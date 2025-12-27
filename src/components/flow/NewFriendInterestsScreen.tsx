import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface NewFriendInterestsScreenProps {
  selectedInterests: string[];
  onContinue: (interests: string[]) => void;
}

export function NewFriendInterestsScreen({ selectedInterests: initialInterests, onContinue }: NewFriendInterestsScreenProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialInterests);
  const [showMore, setShowMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const allInterests = [
    "Sports",
    "Music",
    "Reading",
    "Gaming",
    "Cooking",
    "Travel",
    "Photography",
    "Art",
    "Fitness",
    "Technology",
    "Fashion",
    "Movies",
    "Gardening",
    "Crafts"
  ];

  const mainInterests = allInterests.slice(0, 4);
  const moreInterests = allInterests.slice(4);

  const searchResults = searchQuery.trim()
    ? allInterests.filter(interest =>
        interest.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleContinue = () => {
    if (selectedInterests.length > 0) {
      onContinue(selectedInterests);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          What are their interests?
        </h2>
        <p className="text-sm text-muted-foreground">
          Select all that apply
        </p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-lg mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search interests..."
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
                  toggleInterest(result);
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-primary/10 transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center justify-between"
              >
                <span>{result}</span>
                {selectedInterests.includes(result) && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
        {mainInterests.map((interest) => {
          const isSelected = selectedInterests.includes(interest);
          return (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`group flex items-center justify-between p-5 rounded-xl border transition-all duration-200 hover:shadow-soft ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border/50 bg-card hover:bg-primary/10 hover:border-primary/50'
              }`}
            >
              <span className="font-medium text-center flex-1">
                {interest}
              </span>
              {isSelected && <Check className="w-5 h-5 ml-2" />}
            </button>
          );
        })}

        {showMore && moreInterests.map((interest) => {
          const isSelected = selectedInterests.includes(interest);
          return (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`group flex items-center justify-between p-5 rounded-xl border transition-all duration-200 hover:shadow-soft ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border/50 bg-card hover:bg-primary/10 hover:border-primary/50'
              }`}
            >
              <span className="font-medium text-center flex-1">
                {interest}
              </span>
              {isSelected && <Check className="w-5 h-5 ml-2" />}
            </button>
          );
        })}
      </div>

      {/* Load More button */}
      {moreInterests.length > 0 && (
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

      {/* Continue button */}
      <div className="max-w-lg mx-auto pt-4">
        <button
          onClick={handleContinue}
          disabled={selectedInterests.length === 0}
          className="w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue ({selectedInterests.length} selected)
        </button>
      </div>
    </div>
  );
}

