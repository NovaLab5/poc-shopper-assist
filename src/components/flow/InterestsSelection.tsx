import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface InterestsSelectionProps {
  onContinue: (interests: string[]) => void;
  friendGender: string;
}

export function InterestsSelection({ onContinue, friendGender }: InterestsSelectionProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showMore, setShowMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const pronoun = friendGender === 'male' ? 'his' : friendGender === 'female' ? 'her' : 'their';

  const allInterests = [
    'Sports', 'Music', 'Reading', 'Gaming',
    'Cooking', 'Travel', 'Photography', 'Art',
    'Fitness', 'Technology', 'Fashion', 'Movies',
    'Gardening', 'Crafts', 'Yoga', 'Dancing'
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
          What are {pronoun} interests?
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

      {/* Selected interests count */}
      {selectedInterests.length > 0 && (
        <div className="text-center text-sm text-primary font-medium">
          {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
        {mainInterests.map((interest) => {
          const isSelected = selectedInterests.includes(interest);
          return (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`group flex items-center justify-center p-5 rounded-xl border transition-all duration-200 hover:shadow-soft ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border/50 bg-card hover:bg-primary/10 hover:border-primary/50'
              }`}
            >
              <span className="font-medium text-center">
                {interest}
              </span>
              {isSelected && (
                <Check className="w-4 h-4 ml-2" />
              )}
            </button>
          );
        })}

        {showMore && moreInterests.map((interest) => {
          const isSelected = selectedInterests.includes(interest);
          return (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`group flex items-center justify-center p-5 rounded-xl border transition-all duration-200 hover:shadow-soft ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border/50 bg-card hover:bg-primary/10 hover:border-primary/50'
              }`}
            >
              <span className="font-medium text-center">
                {interest}
              </span>
              {isSelected && (
                <Check className="w-4 h-4 ml-2" />
              )}
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
      <div className="flex justify-center pt-4">
        <button
          onClick={handleContinue}
          disabled={selectedInterests.length === 0}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

