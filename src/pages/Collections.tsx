import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Plus, ChevronRight, Bell } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { mockProducts } from '@/data/products';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAssistantState } from '@/hooks/use-assistant-state';
import { cn } from '@/lib/utils';

export default function Collections() {
  const navigate = useNavigate();
  const { state } = useAssistantState();

  const collections = useMemo(() => {
    return state.collections
      .map((collection) => {
        const firstProduct = mockProducts.find(
          (product) => product.id === collection.productIds[0]
        );
        const alertCount = state.priceAlerts.filter((alert) =>
          collection.productIds.includes(alert.productId)
        ).length;

        return {
          ...collection,
          firstProduct,
          alertCount,
        };
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [state.collections, state.priceAlerts]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="gradient-header px-4 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Collections</h1>
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:text-white hover:bg-white/20"
            onClick={() => navigate('/chat?mode=gift')}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-sm text-white/90 mt-1">One collection per friend</p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <Gift className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              No collections yet
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Start a gift chat to create a collection for a friend.
            </p>
            <Button onClick={() => navigate('/chat?mode=gift')} className="rounded-full">
              Start a gift chat
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {collections.map((collection) => (
              <Card
                key={collection.id}
                className="border border-border/60 hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate('/chat?mode=gift')}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden shrink-0">
                    {collection.firstProduct ? (
                      <img
                        src={collection.firstProduct.image}
                        alt={collection.friendName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Gift className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Gift className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-foreground">{collection.friendName}</h3>
                      <Badge variant="secondary" className="rounded-full">
                        {collection.productIds.length} items
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Updated {new Date(collection.updatedAt).toLocaleDateString()}
                    </p>
                    {collection.alertCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-primary mt-2">
                        <Bell className="w-3 h-3" />
                        <span>{collection.alertCount} active alert</span>
                      </div>
                    )}
                  </div>

                  <ChevronRight className={cn('w-5 h-5 text-muted-foreground')} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav activeTab="collections" />
    </div>
  );
}
