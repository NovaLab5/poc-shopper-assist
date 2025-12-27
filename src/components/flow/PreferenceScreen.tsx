import { formatLabel, FlowPreference } from '@/lib/flowTypes';

interface PreferenceScreenProps {
  preference: FlowPreference;
  onSelect: (option: string) => void;
}

export function PreferenceScreen({ preference, onSelect }: PreferenceScreenProps) {
  const options = preference.options.filter(o => o !== 'load_more');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          {preference.question}
        </h2>
        <p className="text-muted-foreground">
          This helps us find the best options for you
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 max-w-lg mx-auto">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onSelect(option)}
            className="px-6 py-3 rounded-full border border-border/50 bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
          >
            <span className="font-medium">
              {formatLabel(option)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
