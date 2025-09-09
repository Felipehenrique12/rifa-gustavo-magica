import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ShoppingCart, Gift, Zap, Copy } from 'lucide-react';

interface NumeroRifa {
  numero: number;
  status: string;
}

const RifaPublica = () => {
  const [numerosDisponiveis, setNumerosDisponiveis] = useState<NumeroRifa[]>([]);
  const [numerosSelecionados, setNumerosSelecionados] = useState<number[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [dialogPagamento, setDialogPagamento] = useState(false);
  const [nomeComprador, setNomeComprador] = useState('');
  const [telefoneComprador, setTelefoneComprador] = useState('');
  const [codigoPix, setCodigoPix] = useState('');
  const [processandoPagamento, setProcessandoPagamento] = useState(false);

  useEffect(() => {
    carregarNumerosDisponiveis();
    
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
          carregarNumerosDisponiveis();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const carregarNumerosDisponiveis = async () => {
    try {
      const { data, error } = await supabase
        .from('numeros_rifa')
        .select('numero, status')
        .eq('status', 'disponivel')
        .order('numero');

      if (error) throw error;
      setNumerosDisponiveis(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar números disponíveis",
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  };

  const toggleNumero = (numero: number) => {
    setNumerosSelecionados(prev => 
      prev.includes(numero) 
        ? prev.filter(n => n !== numero)
        : [...prev, numero]
    );
  };

  const gerarPagamentoPix = async () => {
    if (numerosSelecionados.length === 0 || !nomeComprador || !telefoneComprador) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos e selecione pelo menos um número",
        variant: "destructive",
      });
      return;
    }

    setProcessandoPagamento(true);

    try {
      // Primeiro, reservar os números
      for (const numero of numerosSelecionados) {
        const { error } = await supabase
          .from('numeros_rifa')
          .update({
            status: 'reservado',
            nome_comprador: nomeComprador,
            telefone_comprador: telefoneComprador,
          })
          .eq('numero', numero);

        if (error) throw error;
      }

      // Gerar código Pix (simulação - em produção usar API real)
      const valorTotal = numerosSelecionados.length * 10; // R$ 10 por número
      const pixCode = `00020126580014BR.GOV.BCB.PIX013636cfead8-aa34-4a84-9c96-7d6b0d2d8${numerosSelecionados.join('')}5204000053039865802BR5925Rifa do Bebe Gustavo6009SAO PAULO62070503***6304${Math.random().toString().substr(2, 4)}`;
      
      setCodigoPix(pixCode);

      toast({
        title: "Números reservados!",
        description: `${numerosSelecionados.length} número(s) reservado(s). Total: R$ ${valorTotal.toFixed(2)}`,
      });

    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar reserva",
        variant: "destructive",
      });
    } finally {
      setProcessandoPagamento(false);
    }
  };

  const copiarCodigoPix = () => {
    navigator.clipboard.writeText(codigoPix);
    toast({
      title: "Copiado!",
      description: "Código Pix copiado para a área de transferência",
    });
  };

  const valorTotal = numerosSelecionados.length * 10;

  if (carregando) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Rifa do Bebê Gustavo</h1>
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg mb-6">
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="flex items-center gap-2">
                <Gift className="h-6 w-6 text-primary" />
                <span className="font-semibold">1 Lily Eau de Parfum</span>
              </div>
              <div className="flex items-center gap-2">
                <Gift className="h-6 w-6 text-primary" />
                <span className="font-semibold">1 Malbec Tradicional</span>
              </div>
            </div>
            <p className="text-lg font-semibold text-primary mt-2">
              R$ 10,00 por número
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Números Disponíveis</h2>
            <p className="text-muted-foreground">
              {numerosDisponiveis.length} números disponíveis
            </p>
          </div>
          
          {numerosSelecionados.length > 0 && (
            <Dialog open={dialogPagamento} onOpenChange={setDialogPagamento}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Finalizar Compra ({numerosSelecionados.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Finalizar Compra</DialogTitle>
                </DialogHeader>
                
                {!codigoPix ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Números selecionados: {numerosSelecionados.join(', ')}
                      </p>
                      <p className="text-lg font-semibold">
                        Total: R$ {valorTotal.toFixed(2)}
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input
                        id="nome"
                        value={nomeComprador}
                        onChange={(e) => setNomeComprador(e.target.value)}
                        placeholder="Digite seu nome"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="telefone">Telefone/WhatsApp</Label>
                      <Input
                        id="telefone"
                        value={telefoneComprador}
                        onChange={(e) => setTelefoneComprador(e.target.value)}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    
                    <Button 
                      onClick={gerarPagamentoPix} 
                      className="w-full"
                      disabled={processandoPagamento}
                    >
                      {processandoPagamento ? (
                        'Processando...'
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Gerar Pix
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-semibold text-green-600 mb-2">
                        Números Reservados!
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Seus números foram reservados. Efetue o pagamento via Pix:
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Código Pix:</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={copiarCodigoPix}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar
                        </Button>
                      </div>
                      <p className="text-xs break-all bg-white p-2 rounded">
                        {codigoPix}
                      </p>
                    </div>
                    
                    <div className="text-center text-sm text-muted-foreground">
                      <p>Após o pagamento, seus números serão automaticamente confirmados.</p>
                      <p className="font-semibold text-primary">
                        Total: R$ {valorTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>

        {numerosSelecionados.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Números Selecionados:</p>
                  <p className="text-sm text-muted-foreground">
                    {numerosSelecionados.sort((a, b) => a - b).join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    R$ {valorTotal.toFixed(2)}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setNumerosSelecionados([])}
                  >
                    Limpar Seleção
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {numerosDisponiveis.map((numero) => (
            <Button
              key={numero.numero}
              variant={numerosSelecionados.includes(numero.numero) ? "default" : "outline"}
              className={`aspect-square text-sm font-medium ${
                numerosSelecionados.includes(numero.numero) 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary/10'
              }`}
              onClick={() => toggleNumero(numero.numero)}
            >
              {numero.numero}
            </Button>
          ))}
        </div>

        {numerosDisponiveis.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Todos os números foram reservados!</h3>
            <p className="text-muted-foreground">
              Acompanhe o sorteio em nossas redes sociais.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RifaPublica;