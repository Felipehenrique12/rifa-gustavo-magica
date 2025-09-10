import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ShoppingCart, Gift, Zap, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface NumeroRifa {
  numero: number;
  status: string;
}

const VALOR_POR_NUMERO = 20;

// ---------- FUNÇÕES PIX ----------
function tlv(tag: string, value: string) {
  const length = value.length.toString().padStart(2, '0');
  return `${tag}${length}${value}`;
}

function calculateCRC16(data: string) {
  let crc = 0xffff;
  const poly = 0x1021;
  const bytes = new TextEncoder().encode(data);
  for (let byte of bytes) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ poly;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function gerarPixCopiaCola(valorTotal: number) {
  const pixKey = '+5581973477175';       // chave fixa
  const name = 'Felipe Henrique';        // nome fixo
  const city = 'Recife';                 // cidade fixa
  const description = '';                 // descrição (opcional)

  let payload = tlv('00', '01');

  const mai =
    tlv('00', 'BR.GOV.BCB.PIX') +
    tlv('01', pixKey) +
    (description ? tlv('02', description) : '');

  payload += tlv('26', mai);
  payload += tlv('52', '0000'); // Merchant Category Code
  payload += tlv('53', '986');  // Moeda BRL
  payload += tlv('54', valorTotal.toFixed(2)); // valor variável
  payload += tlv('58', 'BR');   // País
  payload += tlv('59', name);
  payload += tlv('60', city);

  const addData = tlv('05', '***'); // TXID fixo
  payload += tlv('62', addData);

  const tempPayload = payload + '6304';
  const crc = calculateCRC16(tempPayload);
  return payload + '6304' + crc;
}

// ---------- COMPONENTE ----------
const RifaPublica = () => {
  const [numerosDisponiveis, setNumerosDisponiveis] = useState<NumeroRifa[]>([]);
  const [numerosSelecionados, setNumerosSelecionados] = useState<number[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [dialogPagamento, setDialogPagamento] = useState(false);
  const [nomeComprador, setNomeComprador] = useState('');
  const [telefoneComprador, setTelefoneComprador] = useState('');
  const [processandoPagamento, setProcessandoPagamento] = useState(false);
  const [pixGerado, setPixGerado] = useState(false);

  const valorTotal = numerosSelecionados.length * VALOR_POR_NUMERO;
  const pixCode = useMemo(() => gerarPixCopiaCola(valorTotal), [valorTotal]);

  useEffect(() => {
    carregarNumerosDisponiveis();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'numeros_rifa' },
        () => carregarNumerosDisponiveis()
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
        .is('nome_comprador', null)
        .is('telefone_comprador', null)
        .order('numero');

      if (error) throw error;
      setNumerosDisponiveis(data || []);
    } catch {
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
      prev.includes(numero) ? prev.filter(n => n !== numero) : [...prev, numero]
    );
  };

  const gerarPagamentoPix = async () => {
    if (numerosSelecionados.length === 0 || !nomeComprador || !telefoneComprador || telefoneComprador.length !== 15 ) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos !",
        variant: "destructive",
      });
      return;
    }

    setProcessandoPagamento(true);

    try {
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

      toast({
        title: "Números Reservados!",
        description: `${numerosSelecionados.length} número(s) reservado(s). Total: R$ ${valorTotal.toFixed(2)}`,
      });

      setPixGerado(true);
    } catch {
      toast({
        title: "Erro",
        description: "Erro ao processar reserva",
        variant: "destructive",
      });
    } finally {
      setProcessandoPagamento(false);
    }
  };

  const copiarCodigoPix = async () => {
    if (!pixCode) return;
    try {
      await navigator.clipboard.writeText(pixCode);
      toast({ title: "Código copiado!", description: "Cole no app do seu banco para pagar." });
    } catch {
      toast({ title: "Erro", description: "Não foi possível copiar o código.", variant: "destructive" });
    }
  };

  if (carregando) return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Botão sair */}
        <div className="flex justify-end mb-4">
          <Button variant="outline" onClick={() => window.location.href = "/"}>Sair</Button>
        </div>

        {/* Título */}
        <h1 className="text-4xl font-bold text-primary mb-2 text-center">Rifa do Bebê Gustavo</h1>

        {/* Card de prêmios */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg mb-6">
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-2">
              <img src="/imagens/lily2.png" alt="Bebê Gustavo" className="mb-4 w-32 h-32" />
              <Gift className="h-6 w-6 text-primary" />
              <span className="font-semibold">1 Lily Eau de Parfum</span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="h-6 w-6 text-primary" />
              <span className="font-semibold">1 Malbec Tradicional</span>
              <img src="/imagens/malbec2.png" alt="Bebê Gustavo" className="mb-4 w-32 h-32" />
            </div>
          </div>
          <p className="text-lg font-semibold text-primary mt-2">R$ {VALOR_POR_NUMERO},00 por número</p>
        </div>

        {/* Números disponíveis */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Números Disponíveis</h2>
            <p className="text-muted-foreground">{numerosDisponiveis.length} números disponíveis</p>
          </div>

          {numerosSelecionados.length > 0 && (
            <Dialog open={dialogPagamento} onOpenChange={(open) => {
              setDialogPagamento(open);
              if (!open) setPixGerado(false); // resetar pix ao fechar
            }}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" /> Finalizar Compra ({numerosSelecionados.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Finalizar Compra</DialogTitle>
                </DialogHeader>

                {!pixGerado ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Números selecionados: {numerosSelecionados.join(', ')}
                    </p>
                    <p className="text-lg font-semibold">
                      Total: <span className="text-red-600 font-bold">R$ {valorTotal.toFixed(2)}</span>
                    </p>

                    <div className="mb-4">
                      <Label htmlFor="nome" className="mb-2 block">Nome Completo</Label>
                      <Input id="nome" value={nomeComprador} onChange={e => setNomeComprador(e.target.value)} placeholder="Digite seu nome" />
                    </div>

                    {/* <div className="mb-4">
                      <Label htmlFor="telefone" className="mb-2 block">Telefone/WhatsApp</Label>
                      <Input id="telefone" value={telefoneComprador} onChange={e => setTelefoneComprador(e.target.value)} placeholder="(11) 99999-9999"/>
                    </div> */}
                    <div className="mb-4">
                      <Label htmlFor="telefone" className="mb-2 block">Telefone/WhatsApp</Label>
                      <Input
                        id="telefone"
                        value={telefoneComprador}
                        placeholder="(11) 99999-9999"
                        onChange={e => {
                          // Pega apenas números
                          let valor = e.target.value.replace(/\D/g, '');

                          // Limita a 11 dígitos
                          if (valor.length > 11) valor = valor.slice(0, 11);

                          // Aplica máscara: (XX) XXXXX-XXXX
                          if (valor.length > 5) {
                            valor = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7)}`;
                          } else if (valor.length > 2) {
                            valor = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
                          } else if (valor.length > 0) {
                            valor = `(${valor}`;
                          }

                          setTelefoneComprador(valor);
                        }}
                      />
                      {telefoneComprador.replace(/\D/g, '').length !== 11 && telefoneComprador.length > 0 && (
                        <p className="text-red-600 text-sm mt-1">O telefone deve ter exatamente 11 dígitos.</p>
                      )}
                    </div>



                    <Button onClick={gerarPagamentoPix} className="w-full" disabled={processandoPagamento}>
                      {processandoPagamento ? 'Processando...' : <><Zap className="h-4 w-4 mr-2" /> Gerar Pix</>}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-semibold text-green-600 mb-2">Números Reservados!</h3>
                      <p className="text-sm text-muted-foreground">Seus números foram reservados. Efetue o pagamento via Pix:</p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-muted-foreground mt-2">
                        Clique no botão para copiar o código, ou copie manualmente,<br /> ou leia o QR Code se necessário.
                      </p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Código Pix:</span>
                        <Button variant="outline" size="sm" onClick={copiarCodigoPix}>
                          <Copy className="h-4 w-4 mr-1" /> Copiar
                        </Button>
                      </div>
                      <p className="text-xs break-all bg-white p-2 rounded">{pixCode}</p>

                    </div>

                    <div className="flex flex-col items-center gap-2 mt-4">
                      <QRCodeSVG value={pixCode} size={200} />
                      <p className="text-sm text-muted-foreground">Valor: R$ {valorTotal.toFixed(2)}</p>
                      <p className="text-center text-sm text-muted-foreground mt-2">
                        <strong>Após o pagamento, envie o comprovante!</strong>
                      </p>
                      <p className="font-semibold text-primary">Total: R$ {valorTotal.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Números selecionados */}
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
                  <p className="text-lg font-bold text-primary">R$ {valorTotal.toFixed(2)}</p>
                  <Button variant="outline" size="sm" onClick={() => setNumerosSelecionados([])}>Limpar Seleção</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grid de números */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {numerosDisponiveis.map(numero => (
            <Button
              key={numero.numero}
              variant={numerosSelecionados.includes(numero.numero) ? 'default' : 'outline'}
              className={`aspect-square text-sm font-medium ${numerosSelecionados.includes(numero.numero) ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/10'}`}
              onClick={() => toggleNumero(numero.numero)}
            >
              {numero.numero}
            </Button>
          ))}
        </div>

      </div>
    </div>
  );
};

export default RifaPublica;
