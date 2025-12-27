import { AIInterpretation, Product } from '@/lib/types';
import { ProductCard } from './ProductCard';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Tag, 
  DollarSign, 
  Users, 
  Target,
  MapPin,
  Lightbulb,
  ArrowDown,
  Star,
  Shuffle,
  Layers,
  Flame,
  Footprints,
  ShieldCheck
} from 'lucide-react';
import { getProductBadges } from '@/lib/aiSimulator';

interface ResultsProps {
  interpretation: AIInterpretation;
  products: Product[];
  onStartOver: () => void;
  onRefine?: (refinement: string) => void;
}

const REFINEMENT_OPTIONS = [
  { id: 'cheaper', label: 'Cheaper', icon: ArrowDown },
  { id: 'quality', label: 'Higher quality', icon: Star },
  { id: 'brands', label: 'Different brands', icon: Shuffle },
  { id: 'category', label: 'Different category', icon: Layers },
];

export function Results({ interpretation, products, onStartOver, onRefine }: ResultsProps) {
  const isGrill = interpretation.category === 'Grill';
  const isSkechers = interpretation.category === 'Skechers';
  
  return (
    <div className="space-y-6 animate-slide-up">
      {/* Interpretation Panel - "What we understood about you" */}
      <div className="bg-card rounded-2xl p-6 shadow-card">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">What we understood about you</h2>
        </div>
        
        <div className="space-y-3">
          {/* Shopping For */}
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
            <Users className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-muted-foreground text-sm">Shopping for:</span>
              <span className="ml-2 font-medium text-foreground">{interpretation.audience}</span>
            </div>
          </div>
          
          {/* Goal */}
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
            <Target className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-muted-foreground text-sm">Goal:</span>
              <span className="ml-2 font-medium text-foreground">{interpretation.goal}</span>
            </div>
          </div>
          
          {/* Location */}
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
            <MapPin className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-muted-foreground text-sm">Location:</span>
              <span className="ml-2 font-medium text-foreground">{interpretation.location}</span>
            </div>
          </div>
          
          {/* Priority */}
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
            <Star className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-muted-foreground text-sm">Priority:</span>
              <span className="ml-2 font-medium text-foreground">{interpretation.priority}</span>
            </div>
          </div>
          
          {/* Inferred Category with Reasoning */}
          <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-xl border border-primary/20">
            <Tag className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Inferred category:</span>
                <span className="font-semibold text-foreground">
                  {isGrill ? 'Outdoor Grills' : 'Comfort Shoes'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                {interpretation.categoryReasoning}
              </p>
            </div>
          </div>
          
          {/* Grill-specific: Setup Style */}
          {isGrill && interpretation.setupStyle && (
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <Flame className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-muted-foreground text-sm">Setup style:</span>
                <span className="ml-2 font-medium text-foreground">{interpretation.setupStyle}</span>
              </div>
            </div>
          )}
          
          {/* Skechers-specific: Comfort Feature */}
          {isSkechers && interpretation.comfortFeature && (
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <Footprints className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-muted-foreground text-sm">Comfort feature:</span>
                <span className="ml-2 font-medium text-foreground">{interpretation.comfortFeature}</span>
              </div>
            </div>
          )}
          
          {/* Final Priority */}
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-muted-foreground text-sm">Final priority:</span>
              <span className="ml-2 font-medium text-foreground">{interpretation.finalPriority}</span>
            </div>
          </div>
          
          {/* Price Range */}
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
            <DollarSign className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-muted-foreground text-sm">Price range:</span>
              <span className="ml-2 font-medium text-foreground">{interpretation.priceRange}</span>
            </div>
          </div>
        </div>
        
        {/* Suggested Brands */}
        {interpretation.brands.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              Suggested Brands
            </p>
            <div className="flex flex-wrap gap-2">
              {interpretation.brands.map((brand) => (
                <Badge key={brand} variant="outline" className="text-xs">
                  {brand}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Refinement Row */}
      {onRefine && (
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <p className="text-sm text-muted-foreground mb-3">Refine results:</p>
          <div className="flex flex-wrap gap-2">
            {REFINEMENT_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => onRefine(option.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-full transition-colors"
              >
                <option.icon className="w-4 h-4" />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Recommended Products */}
      <div className="bg-card rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Recommended For You
          </h2>
          <span className="text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((product, index) => {
            const badges = getProductBadges(product.id, interpretation);
            return (
              <div key={product.id} style={{ animationDelay: `${index * 50}ms` }}>
                <ProductCard product={product} badges={badges} />
              </div>
            );
          })}
        </div>
        
        {/* Disclaimer */}
        <p className="mt-4 text-xs text-muted-foreground text-center">
          Based on your shopping profile. This is a curated shortlist, not a guarantee of perfect match.
        </p>
      </div>
      
      {/* Start Over Button */}
      <div className="flex justify-center">
        <button
          onClick={onStartOver}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 active:scale-95 transition-all shadow-soft"
        >
          Start New Session
        </button>
      </div>
    </div>
  );
}
