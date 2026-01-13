import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PrivyWrapper } from "@/providers/PrivyProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Home from "./pages/Home";
import Buy from "./pages/Buy";
import BuyReview from "./pages/BuyReview";
import BuyComplete from "./pages/BuyComplete";
import Sell from "./pages/Sell";
import SellReview from "./pages/SellReview";
import SellComplete from "./pages/SellComplete";
import Activity from "./pages/Activity";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PrivyWrapper>
      <AuthProvider>
        <TooltipProvider>
          <AppProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/buy" element={<Buy />} />
                  <Route path="/buy/review" element={<BuyReview />} />
                  <Route path="/buy/complete" element={<BuyComplete />} />
                  <Route path="/sell" element={<Sell />} />
                  <Route path="/sell/review" element={<SellReview />} />
                  <Route path="/sell/complete" element={<SellComplete />} />
                  <Route path="/activity" element={<Activity />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            </BrowserRouter>
          </AppProvider>
        </TooltipProvider>
      </AuthProvider>
    </PrivyWrapper>
  </QueryClientProvider>
);

export default App;
