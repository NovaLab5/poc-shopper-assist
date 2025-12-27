interface AgeSelectionProps {
  onSelect: (age: string) => void;
  friendGender: string;
}

export function AgeSelection({ onSelect, friendGender }: AgeSelectionProps) {
  const pronoun = friendGender === 'male' ? 'him' : friendGender === 'female' ? 'her' : 'them';
  
  const ageRanges = [
    { label: 'Under 18', value: 'under_18' },
    { label: '18-25', value: '18_25' },
    { label: '26-35', value: '26_35' },
    { label: '36-45', value: '36_45' },
    { label: '46-55', value: '46_55' },
    { label: '56-65', value: '56_65' },
    { label: '66+', value: '66_plus' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          How old is {pronoun}?
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
        {ageRanges.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
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

