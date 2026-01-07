import { useState } from 'react';
import { FlowResults, FlowState, formatLabel, getOptionLabel } from '@/lib/flowTypes';
import { Button } from '@/components/ui/button';
import { ExternalLink, RotateCcw, User, Target, MapPin, Heart, ShoppingBag, ChevronDown, DollarSign, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { generateAIRecommendation } from '@/lib/productRecommendations';

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

// Parse budget from budget label (e.g., "$250", "$500+", "$50 - $150")
function parseBudgetMax(budgetLabel: string | null): number | null {
  if (!budgetLabel) return null;

  // Handle "$500+" format
  if (budgetLabel.includes('+')) {
    const match = budgetLabel.match(/\$?(\d+)\+/);
    return match ? parseInt(match[1], 10) : null;
  }

  // Handle "$50 - $150" format
  if (budgetLabel.includes('-')) {
    const match = budgetLabel.match(/\$?(\d+)\s*-\s*\$?(\d+)/);
    return match ? parseInt(match[2], 10) : null;
  }

  // Handle simple "$250" format
  const match = budgetLabel.match(/\$?(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// Get best option (slightly below max budget)
function getBestOption(allProducts: Array<{ retailer: string; product: any }>, maxBudget: number | null) {
  if (!maxBudget || allProducts.length === 0) {
    // If no budget, return middle-priced item
    const sorted = [...allProducts].sort((a, b) => a.product.price - b.product.price);
    return sorted[Math.floor(sorted.length / 2)];
  }

  // Target price is 85% of max budget (slightly below)
  const targetPrice = maxBudget * 0.85;

  // Find product closest to target price but not exceeding max budget
  const withinBudget = allProducts.filter(p => p.product.price <= maxBudget);
  if (withinBudget.length === 0) {
    // If nothing within budget, return cheapest
    return [...allProducts].sort((a, b) => a.product.price - b.product.price)[0];
  }

  // Find closest to target
  return withinBudget.reduce((closest, current) => {
    const closestDiff = Math.abs(closest.product.price - targetPrice);
    const currentDiff = Math.abs(current.product.price - targetPrice);
    return currentDiff < closestDiff ? current : closest;
  });
}

// Get upgrade option (at or slightly above max budget)
function getUpgradeOption(allProducts: Array<{ retailer: string; product: any }>, maxBudget: number | null, bestOption: any) {
  if (!maxBudget || allProducts.length === 0) return null;

  // Find products more expensive than best option
  const moreExpensive = allProducts.filter(p => p.product.price > bestOption.product.price);
  if (moreExpensive.length === 0) return null;

  // Prefer items at or slightly above max budget (up to 110%)
  const targetPrice = maxBudget * 1.05;
  return moreExpensive.reduce((closest, current) => {
    const closestDiff = Math.abs(closest.product.price - targetPrice);
    const currentDiff = Math.abs(current.product.price - targetPrice);
    return currentDiff < closestDiff ? current : closest;
  });
}

// Get budget option (cheaper than best option)
function getBudgetOption(allProducts: Array<{ retailer: string; product: any }>, bestOption: any) {
  if (allProducts.length === 0) return null;

  // Find products cheaper than best option
  const cheaper = allProducts.filter(p => p.product.price < bestOption.product.price);
  if (cheaper.length === 0) return null;

  // Return the most expensive of the cheaper options (best value in lower range)
  return cheaper.reduce((best, current) =>
    current.product.price > best.product.price ? current : best
  );
}

export function ResultsScreen({ results, state, onReset, onSave }: ResultsScreenProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const filteredResults = filterResultsByPreference(results, state.preference);
  const allProducts = getAllProducts(filteredResults);

  // Get budget label from answers
  const budgetAnswer = state.questionAnswers?.budget;
  const budgetLabel = budgetAnswer ? String(budgetAnswer) : null;
  const maxBudget = parseBudgetMax(budgetLabel);

  // Get best, upgrade, and budget options
  const bestOption = getBestOption(allProducts, maxBudget);
  const upgradeOption = getUpgradeOption(allProducts, maxBudget, bestOption);
  const budgetOption = getBudgetOption(allProducts, bestOption);

  // Product card component
  const ProductCard = ({ retailer, product, label, icon }: {
    retailer: string;
    product: any;
    label?: string;
    icon?: React.ReactNode;
  }) => {
    // Generate AI recommendation
    const aiRecommendation = generateAIRecommendation({
      id: product.id || '',
      name: product.name,
      brand: retailer,
      tags: [],
      price: product.price,
    });

    return (
      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-card border border-border/40 rounded-xl p-3 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer hover:border-primary/60 block group active:scale-[0.98]"
      >
        {label && (
          <div className="flex items-center justify-center gap-1.5 mb-2">
            {icon}
            <span className="text-xs font-bold text-primary uppercase tracking-wide">{label}</span>
          </div>
        )}

        {/* Product Name - Now at top */}
        <h4 className="text-base font-bold text-foreground line-clamp-2 mb-2 leading-tight">
          {product.name}
        </h4>

        {/* Product Image - Smaller size and CENTERED */}
        <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-secondary/30 relative max-h-[160px] flex items-center justify-center">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
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

        {/* AI Recommendation Text - New section */}
        <div className="mb-2">
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {aiRecommendation}
          </p>
        </div>

        {/* Price and Retailer - Now at bottom */}
        <div className="flex flex-col gap-1.5">
          {/* Price */}
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
    );
  };

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

      {/* Best Option - Featured */}
      {bestOption && (
        <div className="space-y-3 mt-4">
          {/* Beautiful non-clickable badge */}
          <div className="flex justify-center">
            <div className="relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent via-accent/90 to-accent/80 rounded-full shadow-lg">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
              <span className="text-base font-extrabold text-white tracking-wide">Best Option</span>
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
              {/* Shine effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Our optimized choice for your budget
          </p>
          <ProductCard
            retailer={bestOption.retailer}
            product={bestOption.product}
          />
        </div>
      )}

      {/* Upgrade / Budget Pick Buttons */}
      {(upgradeOption || budgetOption) && !showUpgrade && !showBudget && (
        <div className={`grid gap-3 ${upgradeOption && budgetOption ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {upgradeOption && (
            <button
              onClick={() => setShowUpgrade(true)}
              className="min-h-[52px] py-3.5 px-5 bg-gradient-to-r from-primary/15 to-primary/10 border-2 border-primary/40 rounded-xl text-sm font-bold text-primary hover:from-primary/25 hover:to-primary/15 hover:border-primary/60 hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <TrendingUp className="w-5 h-5" />
              <span>Upgrade Pick</span>
            </button>
          )}
          {budgetOption && (
            <button
              onClick={() => setShowBudget(true)}
              className="min-h-[52px] py-3.5 px-5 bg-gradient-to-r from-accent/15 to-accent/10 border-2 border-accent/40 rounded-xl text-sm font-bold text-accent hover:from-accent/25 hover:to-accent/15 hover:border-accent/60 hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <TrendingDown className="w-5 h-5" />
              <span>Budget Pick</span>
            </button>
          )}
        </div>
      )}

      {/* Upgrade Option */}
      {showUpgrade && upgradeOption && (
        <div className="space-y-2">
          <ProductCard
            retailer={upgradeOption.retailer}
            product={upgradeOption.product}
            label="Upgrade Pick"
            icon={<TrendingUp className="w-4 h-4 text-primary" />}
          />
          <button
            onClick={() => setShowUpgrade(false)}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Hide Upgrade Pick
          </button>
        </div>
      )}

      {/* Budget Option */}
      {showBudget && budgetOption && (
        <div className="space-y-2">
          <ProductCard
            retailer={budgetOption.retailer}
            product={budgetOption.product}
            label="Budget Pick"
            icon={<TrendingDown className="w-4 h-4 text-primary" />}
          />
          <button
            onClick={() => setShowBudget(false)}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Hide Budget Pick
          </button>
        </div>
      )}

      {/* Something Else Button */}
      {!showAlternatives && (
        <button
          onClick={() => setShowAlternatives(true)}
          className="w-full min-h-[44px] py-3 px-4 bg-secondary/50 border border-border/40 rounded-xl text-sm font-medium text-foreground hover:bg-secondary hover:border-primary/40 active:scale-[0.98] transition-all"
        >
          Something Else
        </button>
      )}

      {/* Alternative Options */}
      {showAlternatives && (
        <div className="space-y-3 p-4 bg-secondary/30 rounded-xl border border-border/40">
          <p className="text-sm font-semibold text-foreground text-center">
            What would you like to do?
          </p>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => {
                // Navigate to category selection
                setShowAlternatives(false);
                // You can add navigation logic here
              }}
              className="min-h-[40px] py-2.5 px-4 bg-card border border-border/40 rounded-lg text-sm font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98] transition-all"
            >
              Choose a Different Category
            </button>
            <button
              onClick={() => {
                // Navigate to budget adjustment
                setShowAlternatives(false);
                // You can add navigation logic here
              }}
              className="min-h-[40px] py-2.5 px-4 bg-card border border-border/40 rounded-lg text-sm font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98] transition-all"
            >
              Adjust Price Range
            </button>
            <button
              onClick={() => setShowAlternatives(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
            >
              Cancel
            </button>
          </div>
        </div>
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
