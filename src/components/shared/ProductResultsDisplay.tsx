import { useState } from 'react';
import { Star, TrendingUp, TrendingDown, Sparkles, RotateCcw } from 'lucide-react';
import { generateAIRecommendation } from '@/lib/productRecommendations';

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  store: string;
  image?: string;
  rating?: number;
  url?: string;
  aiRecommendation?: string;
}

interface ProductResultsDisplayProps {
  products: ProductItem[];
  maxBudget?: number | null;
  showUpgradeButton?: boolean;
  showBudgetButton?: boolean;
  onSomethingElse?: () => void;
  className?: string;
}

// Helper functions for product selection
function getBestOption(products: ProductItem[], maxBudget?: number | null): ProductItem | null {
  if (products.length === 0) return null;

  if (!maxBudget) {
    // If no budget, return middle-priced item
    const sorted = [...products].sort((a, b) => a.price - b.price);
    return sorted[Math.floor(sorted.length / 2)];
  }

  // Target price is 85% of max budget (slightly below)
  const targetPrice = maxBudget * 0.85;

  // Find product closest to target price but not exceeding max budget
  const withinBudget = products.filter(p => p.price <= maxBudget);
  if (withinBudget.length === 0) {
    // If nothing within budget, return cheapest
    return products.sort((a, b) => a.price - b.price)[0];
  }

  // Find closest to target
  return withinBudget.reduce((closest, current) => {
    const closestDiff = Math.abs(closest.price - targetPrice);
    const currentDiff = Math.abs(current.price - targetPrice);
    return currentDiff < closestDiff ? current : closest;
  });
}

function getUpgradeOption(products: ProductItem[], maxBudget: number | null | undefined, bestOption: ProductItem): ProductItem | null {
  if (products.length === 0) return null;

  // Find products more expensive than best option
  const moreExpensive = products.filter(p => p.price > bestOption.price);
  if (moreExpensive.length === 0) return null;

  if (!maxBudget) {
    return moreExpensive[0];
  }

  // Prefer items at or slightly above max budget (up to 110%)
  const targetPrice = maxBudget * 1.05;
  return moreExpensive.reduce((closest, current) => {
    const closestDiff = Math.abs(closest.price - targetPrice);
    const currentDiff = Math.abs(current.price - targetPrice);
    return currentDiff < closestDiff ? current : closest;
  });
}

function getBudgetOption(products: ProductItem[], bestOption: ProductItem): ProductItem | null {
  if (products.length === 0) return null;

  // Find products cheaper than best option
  const cheaper = products.filter(p => p.price < bestOption.price);
  if (cheaper.length === 0) return null;

  // Return the most expensive of the cheaper options (best value in lower range)
  return cheaper.reduce((best, current) =>
    current.price > best.price ? current : best
  );
}

export function ProductResultsDisplay({
  products,
  maxBudget,
  showUpgradeButton = true,
  showBudgetButton = true,
  onSomethingElse,
  className = ''
}: ProductResultsDisplayProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showBudget, setShowBudget] = useState(false);

  const bestOption = getBestOption(products, maxBudget);
  const upgradeOption = bestOption ? getUpgradeOption(products, maxBudget, bestOption) : null;
  const budgetOption = bestOption ? getBudgetOption(products, bestOption) : null;

  const ProductCard = ({ product }: { product: ProductItem }) => {
    // Generate AI recommendation if not provided
    const aiRecommendation = product.aiRecommendation || generateAIRecommendation({
      id: product.id,
      name: product.name,
      brand: product.store, // Using store as brand fallback
      tags: [], // No tags available in ProductItem
      price: product.price,
    });

    return (
      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full max-w-[280px] mx-auto bg-card border-2 border-primary/30 rounded-2xl p-4 hover:shadow-xl transition-all cursor-pointer hover:border-primary hover:scale-[1.02] block group"
      >
        {/* Product Name - Now at top */}
        <h4 className="text-base font-semibold text-foreground line-clamp-2 mb-3">
          {product.name}
        </h4>

        {/* Product Image - Smaller size */}
        <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-secondary/30 relative max-h-[180px]">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              No image
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* AI Recommendation Text - New section */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {aiRecommendation}
          </p>
        </div>

        {/* Price and Rating - Now at bottom */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-lg font-bold text-primary">${product.price}</span>
          {product.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              <span className="text-xs text-muted-foreground font-medium">{product.rating}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{product.store}</p>
      </a>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Best Option - Beautiful Badge */}
      {bestOption && (
        <div className="flex flex-col items-center gap-3 mt-4">
          {/* Beautiful non-clickable badge */}
          <div className="relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent via-accent/90 to-accent/80 rounded-full shadow-lg">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
            <span className="text-base font-extrabold text-white tracking-wide">Best Option</span>
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
            {/* Shine effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
          <ProductCard product={bestOption} />
        </div>
      )}

      {/* Upgrade and Budget Pick Buttons - Side by Side */}
      {((!showUpgrade && upgradeOption) || (!showBudget && budgetOption)) && (
        <div className="flex items-center justify-center gap-3 max-w-[280px] mx-auto mt-4">
          {showUpgradeButton && upgradeOption && !showUpgrade && (
            <button
              onClick={() => setShowUpgrade(true)}
              className="flex-1 py-2 px-3 bg-accent/10 border-2 border-accent/30 rounded-full text-xs font-semibold text-accent hover:bg-accent/20 hover:border-accent hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Upgrade Pick</span>
            </button>
          )}
          {showBudgetButton && budgetOption && !showBudget && (
            <button
              onClick={() => setShowBudget(true)}
              className="flex-1 py-2 px-3 bg-accent/10 border-2 border-accent/30 rounded-full text-xs font-semibold text-accent hover:bg-accent/20 hover:border-accent hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Budget Pick</span>
            </button>
          )}
        </div>
      )}

      {/* Upgrade Pick - Product Card */}
      {showUpgradeButton && upgradeOption && showUpgrade && (
        <div className="flex flex-col items-center gap-3 mt-4">
          <div className="relative inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">Upgrade Pick</span>
          </div>
          <ProductCard product={upgradeOption} />
          {/* Hide button for Upgrade Pick */}
          <button
            onClick={() => setShowUpgrade(false)}
            className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
          >
            hide
          </button>
        </div>
      )}

      {/* Budget Pick - Product Card */}
      {showBudgetButton && budgetOption && showBudget && (
        <div className="flex flex-col items-center gap-3 mt-4">
          <div className="relative inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent/20 to-accent/10 rounded-full">
            <TrendingDown className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold text-accent">Budget Pick</span>
          </div>
          <ProductCard product={budgetOption} />
          {/* Hide button for Budget Pick */}
          <button
            onClick={() => setShowBudget(false)}
            className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
          >
            hide
          </button>
        </div>
      )}

      {/* Something Else button */}
      {onSomethingElse && (
        <div className="flex flex-col items-center gap-3 max-w-[280px] mx-auto mt-4">
          <button
            onClick={onSomethingElse}
            className="w-full py-2.5 px-4 bg-secondary/50 border-2 border-border rounded-xl text-sm font-semibold text-foreground hover:bg-secondary hover:border-border/80 hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Something Else</span>
          </button>
        </div>
      )}
    </div>
  );
}

