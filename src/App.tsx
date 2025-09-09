import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginAdmin from "./pages/LoginAdmin";
import PainelAdmin from "./pages/PainelAdmin";
import RifaPublica from "./pages/RifaPublica";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {/* Container do background */}
          <div
            className="min-h-screen w-full bg-cover bg-center"
            style={{
              backgroundImage: "url('/imagens/fundo_bb.jpg')",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Overlay opcional para melhor contraste do texto */}
            <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>

            {/* Conteúdo */}
            <div className="relative z-10 min-h-screen flex flex-col">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/rifa" element={<RifaPublica />} />
                <Route path="/admin/login" element={<LoginAdmin />} />
                <Route path="/admin" element={<PainelAdmin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
