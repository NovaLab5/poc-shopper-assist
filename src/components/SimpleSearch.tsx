import { useState } from 'react';
import { ShoppingBag, Flame, Footprints, Search, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SimpleSearchProps {
  onSearch: (productName: string, category: string) => void;
  isLoading?: boolean;
}

const CATEGORY_OPTIONS = [
  { id: 'all', label: 'All', icon: ShoppingBag },
  { id: 'grill', label: 'Grills', icon: Flame },
  { id: 'skechers', label: 'Skechers', icon: Footprints },
];

export function SimpleSearch({ onSearch, isLoading = false }: SimpleSearchProps) {
  const [productName, setProductName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (productName.trim() || categoryId) {
      onSearch(productName.trim(), categoryId);
    }
  };

  const handleSearchSubmit = () => {
    onSearch(productName.trim(), selectedCategory);
  };

  return (
    <div className="bg-card rounded-3xl shadow-card p-6 animate-fade-in">
      {isLoading && (
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sour-green/20 to-sour-green-light/20 rounded-full border border-sour-green/30">
            <Sparkles className="w-4 h-4 text-sour-green animate-pulse" />
            <span className="text-sm font-medium text-sour-green">AI is thinking...</span>
            <Loader2 className="w-4 h-4 text-sour-green animate-spin" />
          </div>
        </div>
      )}
      
      {/* Shopping bag icon */}
      <div className="flex items-start mb-6">
        <ShoppingBag className="w-6 h-6 text-foreground/60" />
      </div>

      {/* Product name input */}
      <div className="relative mb-6">
        <Input
          type="text"
          placeholder="Search grills or shoes..."
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
          className="w-full h-12 pl-4 pr-12 text-base bg-background border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20"
        />
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-foreground/60 hover:text-foreground"
          onClick={handleSearchSubmit}
        >
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_OPTIONS.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? 'bg-foreground text-background shadow-md'
                  : 'bg-pill-bg text-foreground/80 hover:bg-pill-bg/80 hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {category.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
