import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Home from "./pages/Home";
import Buy from "./pages/Buy";
import BuyConfirm from "./pages/BuyConfirm";
import BuyPayment from "./pages/BuyPayment";
import BuyVerify from "./pages/BuyVerify";
import Sell from "./pages/Sell";
import SellTransfer from "./pages/SellTransfer";
import Activity from "./pages/Activity";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/buy" element={<Buy />} />
              <Route path="/buy/confirm" element={<BuyConfirm />} />
              <Route path="/buy/payment" element={<BuyPayment />} />
              <Route path="/buy/verify" element={<BuyVerify />} />
              <Route path="/sell" element={<Sell />} />
              <Route path="/sell/transfer" element={<SellTransfer />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
