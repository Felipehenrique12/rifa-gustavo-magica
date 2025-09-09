-- Create administradores table
CREATE TABLE public.administradores (
  id SERIAL PRIMARY KEY,
  usuario TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL
);

-- Create numeros_rifa table
CREATE TABLE public.numeros_rifa (
  numero INTEGER PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'disponivel',
  nome_comprador TEXT,
  telefone_comprador TEXT,
  codigo_pix TEXT,
  reservado_por INTEGER REFERENCES public.administradores(id)
);

-- Enable RLS
ALTER TABLE public.administradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.numeros_rifa ENABLE ROW LEVEL SECURITY;

-- Create policies for full access (you can restrict these later)
CREATE POLICY "Permitir acesso total" ON public.administradores FOR ALL USING (true);
CREATE POLICY "Permitir acesso total" ON public.numeros_rifa FOR ALL USING (true);

-- Insert default admin
INSERT INTO public.administradores (usuario, senha) VALUES 
  ('admin', 'admin123'),
  ('gustavo', 'senha123');

-- Insert raffle numbers 1-100
INSERT INTO public.numeros_rifa (numero, status)
SELECT generate_series(1, 100), 'disponivel';

-- Enable realtime for numeros_rifa
ALTER PUBLICATION supabase_realtime ADD TABLE public.numeros_rifa;