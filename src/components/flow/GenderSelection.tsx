import { User, Users } from 'lucide-react';

interface GenderSelectionProps {
  onSelect: (gender: string) => void;
}

export function GenderSelection({ onSelect }: GenderSelectionProps) {
  const genderOptions = [
    { label: 'Male', value: 'male', icon: User },
    { label: 'Female', value: 'female', icon: User },
    { label: 'Other', value: 'other', icon: Users }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          What is their gender?
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
        {genderOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className="group flex items-center gap-4 p-5 rounded-xl border border-border/50 bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:shadow-soft"
            >
              <Icon className="w-6 h-6" />
              <span className="font-medium text-lg">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

