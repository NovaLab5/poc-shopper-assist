import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Star,
  TrendingDown,
  TrendingUp,
  Minus,
  Heart,
  ShoppingCart,
  ExternalLink,
  Info,
  Bell,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { getProductById, getPriceStats, getPriceTrend } from '@/data/products';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAssistantState } from '@/hooks/use-assistant-state';
import { clearPriceAlert, setPriceAlert, toggleWishlistItem } from '@/lib/assistantState';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, update } = useAssistantState();
  const product = getProductById(id || '');
  const [priceInput, setPriceInput] = useState('');

  const isWishlisted = product ? state.wishlist.includes(product.id) : false;
  const priceAlert = product
    ? state.priceAlerts.find((alert) => alert.productId === product.id)
    : undefined;

  const priceStats = useMemo(() => (product ? getPriceStats(product) : null), [product]);
  const priceTrend = useMemo(() => (product ? getPriceTrend(product) : null), [product]);

  useEffect(() => {
    if (priceAlert) {
      setPriceInput(priceAlert.targetPrice.toString());
    }
  }, [priceAlert]);

  if (!product || !priceStats || !priceTrend) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Product not found</p>
      </div>
    );
  }

  const chartData = product.priceHistory.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: point.price,
    fullDate: point.date,
  }));

  const handleWishlist = () => {
    update((current) => toggleWishlistItem(current, product.id));
  };

  const handleSaveAlert = () => {
    const parsed = parseFloat(priceInput);
    if (!Number.isNaN(parsed)) {
      update((current) => setPriceAlert(current, { productId: product.id, targetPrice: parsed }));
    }
  };

  const handleClearAlert = () => {
    update((current) => clearPriceAlert(current, product.id));
  };

  const handleBuyNow = () => {
    window.open(product.storeLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 bg-white border-b border-border px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleWishlist}
            className="rounded-full"
          >
            <Heart className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-foreground'} />
          </Button>
        </div>
      </header>

      <div className="bg-white px-6 py-8">
        <div className="aspect-square max-w-md mx-auto bg-muted rounded-2xl overflow-hidden">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="bg-white px-6 py-6 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
            {product.brand}
          </p>
          <h1 className="text-2xl font-bold text-foreground mb-2">{product.name}</h1>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground">{product.rating}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              ({product.reviewCount.toLocaleString()} reviews)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-4xl font-bold text-primary">${product.price}</span>
          {product.originalPrice && (
            <>
              <span className="text-lg text-muted-foreground line-through">
                ${product.originalPrice}
              </span>
              <Badge className="bg-emerald-500 text-white">
                Save ${(product.originalPrice - product.price).toFixed(2)}
              </Badge>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm">
          {priceTrend.direction === 'down' && (
            <div className="flex items-center gap-1 text-emerald-600 font-medium">
              <TrendingDown className="w-4 h-4" />
              <span>Price dropped {Math.abs(priceTrend.percentChange).toFixed(1)}%</span>
            </div>
          )}
          {priceTrend.direction === 'up' && (
            <div className="flex items-center gap-1 text-destructive font-medium">
              <TrendingUp className="w-4 h-4" />
              <span>Price increased {priceTrend.percentChange.toFixed(1)}%</span>
            </div>
          )}
          {priceTrend.direction === 'stable' && (
            <div className="flex items-center gap-1 text-muted-foreground font-medium">
              <Minus className="w-4 h-4" />
              <span>Price stable</span>
            </div>
          )}
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Learn more about price
              </span>
              <span className="text-xs text-muted-foreground">90 day history</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Learn More Price</DialogTitle>
              <DialogDescription>
                Track the 90 day history and set a target alert.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Card className="bg-muted/40">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground mb-1">Lowest</p>
                    <p className="font-bold text-emerald-600">${priceStats.min.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/40">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground mb-1">Average</p>
                    <p className="font-bold text-foreground">${priceStats.avg.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/40">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground mb-1">Highest</p>
                    <p className="font-bold text-destructive">${priceStats.max.toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 12 }} domain={['dataMin - 10', 'dataMax + 10']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                    />
                    <ReferenceLine
                      y={priceStats.avg}
                      stroke="#9ca3af"
                      strokeDasharray="5 5"
                      label={{ value: 'Avg', position: 'insideTopRight', fill: '#6b7280' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#84cc16"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Set a price alert</p>
                <div className="flex gap-2">
                  <Input
                    value={priceInput}
                    onChange={(event) => setPriceInput(event.target.value)}
                    placeholder={`Target price (current $${priceStats.current.toFixed(2)})`}
                  />
                  <Button onClick={handleSaveAlert} className="shrink-0">
                    Save
                  </Button>
                </div>
                {priceAlert && (
                  <Button variant="outline" onClick={handleClearAlert} className="w-full">
                    <Bell className="w-4 h-4 mr-2" />
                    Alert active at ${priceAlert.targetPrice}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white px-6 py-6 mt-2">
        <h2 className="font-bold text-foreground mb-3">About this product</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          {product.description}
        </p>

        <h3 className="font-semibold text-foreground mb-2">Key Features</h3>
        <ul className="space-y-2">
          {product.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 flex gap-3">
        <Button className="flex-1 rounded-full" onClick={handleBuyNow}>
          <ShoppingCart className="w-5 h-5 mr-2" />
          Buy Now
        </Button>
        <Button variant="outline" className="px-6 rounded-full" onClick={handleBuyNow}>
          <ExternalLink className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
