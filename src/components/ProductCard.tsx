import { Product } from '@/lib/types';
import { Package, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { generateAIRecommendation } from '@/lib/productRecommendations';

interface ProductCardProps {
  product: Product;
  badges?: string[];
}

export function ProductCard({ product, badges = [] }: ProductCardProps) {
  // Generate AI recommendation if not provided
  const aiRecommendation = product.aiRecommendation || generateAIRecommendation({
    id: product.id,
    name: product.name,
    brand: product.brand,
    tags: product.tags,
    price: product.price,
    category: product.category,
  });

  return (
    <div className="bg-card rounded-xl p-4 shadow-card hover:shadow-soft transition-shadow duration-200 animate-scale-in border border-border/30 flex flex-col">
      {/* Product Name - Now at top */}
      <div className="mb-2">
        <h3 className="font-semibold text-foreground text-base leading-tight line-clamp-2">
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">
          {product.brand}
        </p>
      </div>

      {/* Product Image - Smaller size and CENTERED */}
      <div className="aspect-square rounded-lg bg-secondary flex items-center justify-center mb-3 relative overflow-hidden max-h-[180px]">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <Package className={`w-10 h-10 text-muted-foreground/50 absolute ${product.imageUrl ? 'hidden' : ''}`} />
        {badges.length > 0 && (
          <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1">
            {badges.slice(0, 1).map((badge, i) => (
              <Badge
                key={i}
                variant="default"
                className="text-[10px] px-1.5 py-0.5 bg-primary/90 backdrop-blur-sm"
              >
                {badge}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* AI Recommendation Text - New section */}
      <div className="mb-3 flex-1">
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {aiRecommendation}
        </p>
      </div>

      {/* Price and Rating - Now at bottom */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-primary font-bold text-lg">
            ${product.price}
          </span>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {product.category}
          </span>
        </div>

        {/* Additional badge row for second badge */}
        {badges.length > 1 && (
          <div>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
              {badges[1]}
            </Badge>
          </div>
        )}
      </div>

      {/* Amazon CTA Button */}
      <Button
        asChild
        className="mt-3 w-full gap-2"
        size="sm"
      >
        <a
          href={product.amazonUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on Amazon
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </Button>
    </div>
  );
}
