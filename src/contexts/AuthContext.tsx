import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Administrador {
  id: number;
  usuario: string;
}

interface AuthContextType {
  administrador: Administrador | null;
  login: (usuario: string, senha: string) => Promise<boolean>;
  logout: () => void;
  carregando: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [administrador, setAdministrador] = useState<Administrador | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Verificar se há sessão salva no localStorage
    const adminSalvo = localStorage.getItem('administrador');
    if (adminSalvo) {
      setAdministrador(JSON.parse(adminSalvo));
    }
    setCarregando(false);
  }, []);

  const login = async (usuario: string, senha: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('administradores')
        .select('id, usuario')
        .eq('usuario', usuario)
        .eq('senha', senha)
        .single();

      if (error || !data) {
        toast({
          title: "Erro de login",
          description: "Usuário ou senha inválidos",
          variant: "destructive",
        });
        return false;
      }

      setAdministrador(data);
      localStorage.setItem('administrador', JSON.stringify(data));
      return true;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer login",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    setAdministrador(null);
    localStorage.removeItem('administrador');
  };

  return (
    <AuthContext.Provider value={{ administrador, login, logout, carregando }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};