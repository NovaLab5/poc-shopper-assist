import { useState } from 'react';
import { FlowResults, FlowState, formatLabel, getOptionLabel } from '@/lib/flowTypes';
import { Button } from '@/components/ui/button';
import { ExternalLink, RotateCcw, User, Target, MapPin, Heart, ShoppingBag, ChevronDown, DollarSign } from 'lucide-react';

interface ResultsScreenProps {
  results: FlowResults;
  state: FlowState;
  onReset: () => void;
  onSave: () => void;
}

// Helper function to filter results based on selected preference
function filterResultsByPreference(results: FlowResults, preference: string | null): FlowResults {
  if (!preference) return results;
  
  const priceMatch = preference.match(/^\$(\d+)$/);
  if (priceMatch) {
    const selectedPrice = parseInt(priceMatch[1], 10);
    const filteredResults: FlowResults = {};
    
    for (const [retailer, products] of Object.entries(results)) {
      const filtered = products.filter(product => product.price === selectedPrice);
      if (filtered.length > 0) {
        filteredResults[retailer] = filtered;
      }
    }
    
    return Object.keys(filteredResults).length > 0 ? filteredResults : results;
  }
  
  return results;
}

// Get all products as flat array
function getAllProducts(results: FlowResults) {
  const allProducts: Array<{ retailer: string; product: typeof results[string][0] }> = [];
  for (const [retailer, products] of Object.entries(results)) {
    products.forEach(product => allProducts.push({ retailer, product }));
  }
  return allProducts;
}

export function ResultsScreen({ results, state, onReset, onSave }: ResultsScreenProps) {
  const [showAll, setShowAll] = useState(false);
  const filteredResults = filterResultsByPreference(results, state.preference);
  const allProducts = getAllProducts(filteredResults);
  const displayedProducts = showAll ? allProducts : allProducts.slice(0, 4);
  const hasMore = allProducts.length > 4;

  // Get budget label from answers
  const budgetAnswer = state.questionAnswers?.budget;
  const budgetLabel = budgetAnswer ? String(budgetAnswer) : null;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* What We Understood - Compact */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-3 border border-primary/20 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-2 tracking-tight">What we understood about you</h3>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          {state.entryPoint && (
            <div className="flex items-center gap-1.5 min-h-[32px]">
              <User className="w-4 h-4 text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-medium">For</span>
                <span className="text-xs font-bold text-foreground truncate">{formatLabel(state.entryPoint)}</span>
              </div>
            </div>
          )}
          {state.recipient && (
            <div className="flex items-center gap-1.5 min-h-[32px]">
              <Target className="w-4 h-4 text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-medium">Who</span>
                <span className="text-xs font-bold text-foreground truncate">{formatLabel(state.recipient)}</span>
              </div>
            </div>
          )}
          {state.category && (
            <div className="flex items-center gap-1.5 min-h-[32px]">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-medium">Category</span>
                <span className="text-xs font-bold text-foreground line-clamp-2">{formatLabel(state.category)}</span>
              </div>
            </div>
          )}
          {state.subcategory && (
            <div className="flex items-center gap-1.5 min-h-[32px]">
              <ShoppingBag className="w-4 h-4 text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-medium">Product</span>
                <span className="text-xs font-bold text-foreground truncate">{formatLabel(state.subcategory)}</span>
              </div>
            </div>
          )}
          {budgetLabel && (
            <div className="flex items-center gap-1.5 min-h-[32px]">
              <DollarSign className="w-4 h-4 text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-medium">Budget</span>
                <span className="text-xs font-bold text-foreground truncate">{budgetLabel}</span>
              </div>
            </div>
          )}
          {state.preference && (
            <div className="flex items-center gap-1.5 min-h-[32px]">
              <Heart className="w-4 h-4 text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-medium">Preference</span>
                <span className="text-xs font-bold text-foreground truncate">{formatLabel(state.preference)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Products Grid - Compact */}
      <div className="grid grid-cols-2 gap-3">
        {displayedProducts.map(({ retailer, product }, idx) => (
          <a
            key={idx}
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card border border-border/40 rounded-xl p-3 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer hover:border-primary/60 block group active:scale-[0.98]"
          >
            {/* Product Image */}
            <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-secondary/30 relative">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ShoppingBag className="w-8 h-8" />
                </div>
              )}
              {/* Link indicator */}
              <div className="absolute top-1.5 right-1.5 bg-primary rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-3 h-3 text-primary-foreground" />
              </div>
            </div>

            {/* Product Name - Compact */}
            <h4 className="text-sm font-bold text-foreground line-clamp-2 mb-2 min-h-[2.5rem] leading-tight">
              {product.name}
            </h4>

            {/* Price and Retailer */}
            <div className="flex flex-col gap-1.5">
              {/* Price - Compact */}
              <div className="flex items-center justify-center">
                <span className="text-lg font-extrabold text-primary bg-primary/15 px-3 py-1 rounded-lg border border-primary/20">
                  {product.currency === 'USD' ? '$' : product.currency}
                  {product.price}
                </span>
              </div>

              {/* Retailer */}
              <div className="flex items-center justify-center gap-1 min-h-[20px]">
                <ExternalLink className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary font-semibold truncate">{formatLabel(retailer)}</span>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Load More - Compact */}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full min-h-[40px] py-2.5 text-sm font-bold text-primary hover:text-primary/80 hover:bg-primary/5 flex items-center justify-center gap-2 transition-all rounded-lg border border-primary/20 active:scale-[0.98]"
        >
          <ChevronDown className="w-4 h-4" />
          Load More ({allProducts.length - 4} more)
        </button>
      )}

      {/* Start Over Button - Compact */}
      <div className="flex justify-center pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onSave();
            onReset();
          }}
          className="gap-2 text-sm font-bold px-6 py-2 min-h-[40px] rounded-lg border hover:bg-primary/5 active:scale-[0.98] transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Start Over
        </Button>
      </div>
    </div>
  );
}
