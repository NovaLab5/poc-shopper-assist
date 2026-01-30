import { Product, ProductTier } from '@/data/products';
import { Star, TrendingDown, Crown, DollarSign, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  tier?: ProductTier;
}

const tierConfig = {
  best: {
    label: 'Best Choice',
    icon: Crown,
    color: 'bg-amber-500 text-white',
    borderColor: 'border-amber-500/30'
  },
  budget: {
    label: 'Budget Pick',
    icon: DollarSign,
    color: 'bg-emerald-500 text-white',
    borderColor: 'border-emerald-500/30'
  },
  upgrade: {
    label: 'Premium',
    icon: Zap,
    color: 'bg-indigo-500 text-white',
    borderColor: 'border-indigo-500/30'
  }
};

export function ProductCard({ product, tier }: ProductCardProps) {
  const config = tier ? tierConfig[tier] : null;
  const TierIcon = config?.icon;
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Card
      className={cn(
        "border-2 transition-all duration-200 hover:shadow-lg cursor-pointer",
        config?.borderColor || "border-border/40"
      )}
    >
      <CardContent className="p-4">
        {config && (
          <div
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 w-fit",
              config.color
            )}
          >
            {TierIcon && <TierIcon className="w-3.5 h-3.5" />}
            {config.label}
          </div>
        )}

        <div className="relative aspect-square rounded-xl bg-muted flex items-center justify-center mb-3 overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {discount > 0 && (
            <Badge className="absolute top-2 right-2 bg-emerald-500 text-white">
              <TrendingDown className="w-3 h-3 mr-1" />
              {discount}% OFF
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          {product.brand}
        </p>

        <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 mb-2">
          {product.name}
        </h3>

        <div className="flex items-center gap-1 mb-3 text-sm">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="font-medium text-foreground">{product.rating}</span>
          <span className="text-xs text-muted-foreground">
            ({product.reviewCount.toLocaleString()})
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary">
            ${product.price}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ${product.originalPrice}
            </span>
          )}
        </div>

        <div className="mt-2">
          <span
            className={cn(
              "text-xs font-medium",
              product.inStock ? "text-emerald-600" : "text-destructive"
            )}
          >
            {product.inStock ? "In Stock" : "Out of Stock"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
