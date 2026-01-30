import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MobileContainer } from "@/components/MobileContainer";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Chat from "./pages/Chat";
import ProductDetail from "./pages/ProductDetail";
import Wishlist from "./pages/Wishlist";
import Collections from "./pages/Collections";
import Friends from "./pages/Friends";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

// Check if onboarding is complete
const OnboardingGuard = ({ children }: { children: React.ReactNode }) => {
  const onboardingComplete = localStorage.getItem('onboardingComplete') === 'true';
  return onboardingComplete ? <>{children}</> : <Navigate to="/onboarding" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <MobileContainer>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Chat />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/profile" element={<Profile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </MobileContainer>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
