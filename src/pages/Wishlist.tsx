import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Bell, Trash2 } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { ProductCard } from '@/components/ProductCard';
import { mockProducts } from '@/data/products';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAssistantState } from '@/hooks/use-assistant-state';
import { clearPriceAlert, toggleWishlistItem } from '@/lib/assistantState';

export default function Wishlist() {
  const navigate = useNavigate();
  const { state, update } = useAssistantState();

  const wishlistItems = useMemo(() => {
    return state.wishlist
      .map((id) => mockProducts.find((product) => product.id === id))
      .filter((product): product is NonNullable<typeof product> => Boolean(product));
  }, [state.wishlist]);

  const handleRemove = (id: string) => {
    update((current) => toggleWishlistItem(current, id));
  };

  const handleClearAlert = (id: string) => {
    update((current) => clearPriceAlert(current, id));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="gradient-header px-4 py-4 shrink-0">
        <div className="flex items-center justify-center">
          <h1 className="text-xl font-bold text-white">My Wishlist</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {wishlistItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <Heart className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No saved items yet</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Save products from chat or product pages to keep track of favorites.
            </p>
            <Button onClick={() => navigate('/chat')} className="rounded-full">
              Start shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {wishlistItems.map((product) => {
              const alert = state.priceAlerts.find((item) => item.productId === product.id);

              return (
                <div key={product.id} className="relative">
                  <div onClick={() => navigate(`/product/${product.id}`)}>
                    <ProductCard product={product} />
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2">
                    {alert ? (
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleClearAlert(product.id)}
                        className="h-8 w-8 rounded-full"
                      >
                        <Bell className="w-4 h-4 text-primary" />
                      </Button>
                    ) : null}
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleRemove(product.id)}
                      className="h-8 w-8 rounded-full"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  {alert && (
                    <Badge className="absolute bottom-4 right-4 bg-primary/10 text-primary">
                      Alert at ${alert.targetPrice}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav activeTab="profile" />
    </div>
  );
}
