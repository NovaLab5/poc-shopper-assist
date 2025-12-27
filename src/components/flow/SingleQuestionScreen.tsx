import { useState } from 'react';
import { FlowQuestion, getOptionLabel, getOptionValue, formatLabel, BudgetOption } from '@/lib/flowTypes';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { BudgetSlider } from './BudgetSlider';

interface SingleQuestionScreenProps {
  question: FlowQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: string | number) => void;
  loadMoreOptions?: string[];
  selectedRecipient?: string;
}

// Default age range options for number type questions
const AGE_OPTIONS = [
  { label: 'Under 18', value: 'under_18' },
  { label: '18 - 25', value: '18_25' },
  { label: '25 - 40', value: '25_40' },
  { label: '40 - 60', value: '40_60' },
  { label: '60+', value: '60_plus' },
];

// Recipients that should not have "Under 18" option
const ADULT_ONLY_RECIPIENTS = [
  'mother', 'father', 'wife', 'husband', 'boss',
  'grandmother', 'grandfather', 'aunt', 'uncle',
  'coworker', 'partner', 'mentor'
];

export function SingleQuestionScreen({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  loadMoreOptions = [],
  selectedRecipient
}: SingleQuestionScreenProps) {
  const [showMore, setShowMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // For slider type (budget), use BudgetSlider component
  if (question.type === 'slider') {
    return <BudgetSlider onSelect={onAnswer} />;
  }

  // For number type (like age), use predefined options
  if (question.type === 'number') {
    // Filter out "Under 18" for adult-only recipients
    const ageOptions = selectedRecipient && ADULT_ONLY_RECIPIENTS.includes(selectedRecipient)
      ? AGE_OPTIONS.filter(opt => opt.value !== 'under_18')
      : AGE_OPTIONS;

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            {question.question}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
          {ageOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onAnswer(option.value)}
              className="group flex items-center justify-center p-5 rounded-xl border border-border/50 bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:shadow-soft"
            >
              <span className="font-medium text-center">
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // For single_select with options
  const options = question.options || [];

  // Check if this question has load_more option and filter it out from main options
  const hasLoadMore = options.some(opt => getOptionValue(opt) === 'load_more');
  const mainOptions = options.filter(opt => getOptionValue(opt) !== 'load_more');

  // Determine if this is the "forWhom" question (should have search)
  const isForWhomQuestion = question.key === 'forWhom';

  // Determine if this is the "gender" question (should be stacked)
  const isGenderQuestion = question.key === 'gender';

  // All available options for search (main + loadMore)
  const allOptions = [...mainOptions.map(opt => getOptionValue(opt)), ...loadMoreOptions];

  // Filter search results
  const searchResults = searchQuery.trim()
    ? allOptions.filter(opt =>
        formatLabel(opt).toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          {question.question}
        </h2>
      </div>

      {/* Search bar for forWhom question */}
      {isForWhomQuestion && (
        <div className="relative max-w-lg mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
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
                    onAnswer(result);
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-primary/10 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  {formatLabel(result)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className={`grid ${isGenderQuestion ? 'grid-cols-1' : 'grid-cols-2'} gap-3 max-w-lg mx-auto ${showMore ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
        {mainOptions.map((option, index) => {
          const label = getOptionLabel(option);
          const value = getOptionValue(option);

          return (
            <button
              key={index}
              onClick={() => onAnswer(value)}
              className="group flex items-center justify-center p-5 rounded-xl border border-border/50 bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:shadow-soft"
            >
              <span className="font-medium text-center">
                {label}
              </span>
            </button>
          );
        })}

        {/* Show load more options when expanded */}
        {showMore && loadMoreOptions.map((option, index) => (
          <button
            key={`more-${index}`}
            onClick={() => onAnswer(option)}
            className="group flex items-center justify-center p-5 rounded-xl border border-border/50 bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:shadow-soft"
          >
            <span className="font-medium text-center">
              {formatLabel(option)}
            </span>
          </button>
        ))}
      </div>

      {/* Load More button */}
      {hasLoadMore && loadMoreOptions.length > 0 && (
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
