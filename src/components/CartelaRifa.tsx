import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Download, FileImage, FileText, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface NumeroRifa {
  numero: number;
  status: string;
  nome_comprador?: string;
}

const CartelaRifa = () => {
  const [numerosRifa, setNumerosRifa] = useState<NumeroRifa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [dialogAberto, setDialogAberto] = useState(false);
  const cartelaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    carregarNumeros();

    const channel = supabase
      .channel('cartela-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'numeros_rifa' },
        () => carregarNumeros()
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
        .select('numero, status, nome_comprador')
        .order('numero');

      if (error) throw error;
      
      // Garantir que todos os números de 1 a 100 existam
      const numerosCompletos = Array.from({ length: 100 }, (_, i) => {
        const numero = i + 1;
        const numeroExistente = data?.find(n => n.numero === numero);
        return numeroExistente || { 
          numero, 
          status: 'disponivel', 
          nome_comprador: null 
        };
      });
      
      setNumerosRifa(numerosCompletos);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar números da rifa",
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  };

  const exportarImagem = async () => {
    if (!cartelaRef.current) return;

    try {
      const canvas = await html2canvas(cartelaRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });

      const link = document.createElement('a');
      link.download = 'cartela-rifa-bebe-gustavo.png';
      link.href = canvas.toDataURL();
      link.click();

      toast({
        title: "Sucesso",
        description: "Imagem exportada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar imagem",
        variant: "destructive",
      });
    }
  };

  const exportarPDF = async () => {
    if (!cartelaRef.current) return;

    try {
      const canvas = await html2canvas(cartelaRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      const imgWidth = 297; // A4 landscape width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('cartela-rifa-bebe-gustavo.pdf');

      toast({
        title: "Sucesso",
        description: "PDF exportado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar PDF",
        variant: "destructive",
      });
    }
  };

  const numeroReservados = numerosRifa.filter(n => n.status !== 'disponivel').length;
  const numerosDisponiveis = numerosRifa.filter(n => n.status === 'disponivel').length;

  if (carregando) return <div>Carregando...</div>;

  return (
    <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="text-lg px-8 flex items-center gap-2">
          <FileImage className="h-5 w-5" />
          Ver Cartela
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Cartela da Rifa - Bebê Gustavo</span>
            <div className="flex gap-2">
              <Button onClick={exportarImagem} size="sm" variant="outline">
                <FileImage className="h-4 w-4 mr-1" />
                Salvar PNG
              </Button>
              <Button onClick={exportarPDF} size="sm" variant="outline">
                <FileText className="h-4 w-4 mr-1" />
                Salvar PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div ref={cartelaRef} className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-lg">
          {/* Cabeçalho da cartela */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
              <h1 className="text-4xl font-bold mb-2">🍼 RIFA DO BEBÊ GUSTAVO 🍼</h1>
              <div className="flex justify-center items-center gap-8 mt-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-xl font-semibold">Prêmios:</p>
                  <p className="text-lg">🎁 1 Lily Eau de Parfum + 1 Malbec Tradicional</p>
                </div>
              </div>
            </div>
          </div>

          {/* Legenda */}
          <div className="flex justify-center gap-8 mb-6">
            <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg border-2 border-green-300">
              <div className="w-6 h-6 bg-green-500 rounded border-2 border-green-600"></div>
              <span className="font-semibold text-green-800">DISPONÍVEL ({numerosDisponiveis})</span>
            </div>
            <div className="flex items-center gap-2 bg-red-100 px-4 py-2 rounded-lg border-2 border-red-300">
              <div className="w-6 h-6 bg-red-500 rounded border-2 border-red-600 flex items-center justify-center">
                <X className="h-4 w-4 text-white font-bold" />
              </div>
              <span className="font-semibold text-red-800">RESERVADO ({numeroReservados})</span>
            </div>
          </div>

          {/* Grid de números */}
          <div className="grid grid-cols-10 gap-3 p-6 bg-white rounded-xl shadow-inner">
            {numerosRifa.map((numero) => {
              const isReservado = numero.status !== 'disponivel';
              return (
                <div
                  key={numero.numero}
                  className={`
                    relative aspect-square flex items-center justify-center text-xl font-bold rounded-lg border-4 shadow-md transition-all
                    ${isReservado 
                      ? 'bg-red-500 border-red-600 text-white' 
                      : 'bg-green-500 border-green-600 text-white hover:scale-105'
                    }
                  `}
                >
                  <span className="relative z-10">{numero.numero}</span>
                  {isReservado && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <X className="h-8 w-8 text-white drop-shadow-lg" strokeWidth={4} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Rodapé */}
          <div className="text-center mt-8 bg-blue-500 text-white p-4 rounded-xl">
            <p className="text-lg font-semibold">💰 Cada número custa R$ 20,00</p>
            <p className="text-sm mt-2">📱 Entre em contato para adquirir seus números!</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CartelaRifa;