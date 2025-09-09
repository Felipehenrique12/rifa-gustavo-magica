import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { LogOut, Plus, Check, X } from 'lucide-react';

interface NumeroRifa {
  numero: number;
  telefone_comprador: string | null;
  codigo_pix: string | null;
  nome_comprador: string | null;
  reservado_por: number | null;
  status: string;
}

const PainelAdmin = () => {
  const { administrador, logout } = useAuth();
  const [numeros, setNumeros] = useState<NumeroRifa[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [carregando, setCarregando] = useState(true);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [numeroSelecionado, setNumeroSelecionado] = useState<number>(0);
  const [nomeComprador, setNomeComprador] = useState('');
  const [telefoneComprador, setTelefoneComprador] = useState('');

  if (!administrador) {
    return <Navigate to="/admin/login" replace />;
  }

  useEffect(() => {
    carregarNumeros();
    
    // Configurar realtime
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'numeros_rifa'
        },
        () => {
          carregarNumeros();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const carregarNumeros = async () => {
    try {
      const { data, error } = await supabase
        .from('numeros_rifa')
        .select('*')
        .order('numero');

      if (error) throw error;
      setNumeros(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar números",
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  };

  const reservarNumero = async () => {
    try {
      const { error } = await supabase
        .from('numeros_rifa')
        .update({
          status: 'reservado',
          nome_comprador: nomeComprador,
          telefone_comprador: telefoneComprador,
          reservado_por: administrador.id
        })
        .eq('numero', numeroSelecionado);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Número reservado com sucesso",
      });

      setDialogAberto(false);
      setNomeComprador('');
      setTelefoneComprador('');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao reservar número",
        variant: "destructive",
      });
    }
  };

  const liberarNumero = async (numero: number) => {
    try {
      const { error } = await supabase
        .from('numeros_rifa')
        .update({
          status: 'disponivel',
          nome_comprador: null,
          telefone_comprador: null,
          codigo_pix: null,
          reservado_por: null
        })
        .eq('numero', numero);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Número liberado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao liberar número",
        variant: "destructive",
      });
    }
  };

  const marcarComoPago = async (numero: number) => {
    try {
      const { error } = await supabase
        .from('numeros_rifa')
        .update({ status: 'pago' })
        .eq('numero', numero);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Número marcado como pago",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao marcar como pago",
        variant: "destructive",
      });
    }
  };

  const numerosFiltrados = numeros.filter(numero => {
    if (filtroStatus === 'todos') return true;
    return numero.status === filtroStatus;
  });

  const estatisticas = {
    disponiveis: numeros.filter(n => n.status === 'disponivel').length,
    reservados: numeros.filter(n => n.status === 'reservado').length,
    pagos: numeros.filter(n => n.status === 'pago').length,
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      disponivel: 'bg-green-100 text-green-800',
      reservado: 'bg-yellow-100 text-yellow-800',
      pago: 'bg-blue-100 text-blue-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (carregando) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">Rifa do Bebê Gustavo</h1>
            <p className="text-muted-foreground">Painel Administrativo</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Bem-vindo, {administrador.usuario}
            </span>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{estatisticas.disponiveis}</div>
              <p className="text-sm text-muted-foreground">Disponíveis</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{estatisticas.reservados}</div>
              <p className="text-sm text-muted-foreground">Reservados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{estatisticas.pagos}</div>
              <p className="text-sm text-muted-foreground">Pagos</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Gerenciar Números</CardTitle>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="reservado">Reservado</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {numerosFiltrados.map((numero) => (
                  <TableRow key={numero.numero}>
                    <TableCell className="font-medium">{numero.numero}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(numero.status)}>
                        {numero.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{numero.nome_comprador || '-'}</TableCell>
                    <TableCell>{numero.telefone_comprador || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {numero.status === 'disponivel' && (
                          <Dialog open={dialogAberto && numeroSelecionado === numero.numero} onOpenChange={setDialogAberto}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                onClick={() => setNumeroSelecionado(numero.numero)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Reservar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reservar Número {numero.numero}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="nome">Nome do Comprador</Label>
                                  <Input
                                    id="nome"
                                    value={nomeComprador}
                                    onChange={(e) => setNomeComprador(e.target.value)}
                                    placeholder="Digite o nome"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="telefone">Telefone</Label>
                                  <Input
                                    id="telefone"
                                    value={telefoneComprador}
                                    onChange={(e) => setTelefoneComprador(e.target.value)}
                                    placeholder="Digite o telefone"
                                  />
                                </div>
                                <Button onClick={reservarNumero} className="w-full">
                                  Confirmar Reserva
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {numero.status === 'reservado' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => marcarComoPago(numero.numero)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Pago
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => liberarNumero(numero.numero)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Liberar
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PainelAdmin;