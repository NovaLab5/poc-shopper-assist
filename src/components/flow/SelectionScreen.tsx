import { useState } from 'react';
import { formatLabel } from '@/lib/flowTypes';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

interface SelectionOption {
  key: string;
  label: string;
}

interface SelectionScreenProps {
  title: string;
  subtitle?: string;
  options: SelectionOption[] | string[];
  onSelect: (option: string) => void;
  loadMoreOptions?: string[];
  showSearch?: boolean;
  allOptions?: string[];
}

export function SelectionScreen({ 
  title, 
  subtitle, 
  options, 
  onSelect, 
  loadMoreOptions = [],
  showSearch = false,
  allOptions = []
}: SelectionScreenProps) {
  const [showMore, setShowMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Normalize options to always have key and label
  const normalizedOptions: SelectionOption[] = options
    .filter(opt => typeof opt === 'string' ? opt !== 'load_more' : opt.key !== 'load_more')
    .map((opt) => {
      if (typeof opt === 'string') {
        return { key: opt, label: formatLabel(opt) };
      }
      return { key: opt.key, label: formatLabel(opt.label) };
    });

  // Normalize load more options
  const normalizedLoadMore: SelectionOption[] = loadMoreOptions.map((opt) => ({
    key: opt,
    label: formatLabel(opt),
  }));

  // Filter search results
  const searchResults = allOptions.length > 0 && searchQuery.trim()
    ? allOptions.filter(opt => 
        opt.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  const hasLoadMore = loadMoreOptions.length > 0 || options.some(opt =>
    (typeof opt === 'string' ? opt : opt.key) === 'load_more'
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Search bar for browsing */}
      {showSearch && allOptions.length > 0 && (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(e.target.value.trim().length > 0);
              }}
              onFocus={() => setShowSearchResults(searchQuery.trim().length > 0)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border/50 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          
          {/* Search results dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-card border border-border/50 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result}
                  onClick={() => {
                    onSelect(result.toLowerCase().replace(/\s+/g, '_'));
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-primary/10 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  {result}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
        {normalizedOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => onSelect(option.key)}
            className="group flex items-center justify-center p-4 h-16 rounded-xl border border-border/50 bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:shadow-soft"
          >
            <span className="font-medium text-center text-sm leading-tight">
              {option.label}
            </span>
          </button>
        ))}
        
        {/* Show more options when expanded */}
        {showMore && normalizedLoadMore.map((option) => (
          <button
            key={option.key}
            onClick={() => onSelect(option.key)}
            className="group flex items-center justify-center p-4 h-16 rounded-xl border border-border/50 bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:shadow-soft"
          >
            <span className="font-medium text-center text-sm leading-tight">
              {option.label}
            </span>
          </button>
        ))}
      </div>

      {/* Load More button */}
      {hasLoadMore && normalizedLoadMore.length > 0 && (
        <button
          onClick={() => setShowMore(!showMore)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          {showMore ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Load More
            </>
          )}
        </button>
      )}
    </div>
  );
}