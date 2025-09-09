import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Users, Zap } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center py-12">
          <h1 className="text-5xl font-bold text-primary mb-4">Rifa do Bebê Gustavo</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Concorra a prêmios incríveis e ajude o bebê Gustavo!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Gift className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Prêmios</h3>
                <p className="text-muted-foreground mb-4">
                  1 Lily Eau de Parfum<br />
                  1 Malbec Tradicional
                </p>
                <p className="text-2xl font-bold text-primary">R$ 20,00</p>
                <p className="text-sm text-muted-foreground">por número</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Como Funciona</h3>
                <p className="text-muted-foreground mb-4">
                  Escolha seus números da sorte<br />
                  Pague via Pix instantaneamente<br />
                  Acompanhe o sorteio!
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/rifa">
              <Button size="lg" className="text-lg px-8">
                <Gift className="h-5 w-5 mr-2" />
                Participar da Rifa
              </Button>
            </Link>
            
            <Link to="/admin/login">
              <Button variant="outline" size="lg" className="text-lg px-8">
                <Users className="h-5 w-5 mr-2" />
                Acesso Admin
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
