import { AIOption } from '@/lib/types';
import { cn } from '@/lib/utils';
import { User, Users, Heart, Eye } from 'lucide-react';

interface PillOptionsProps {
  options: AIOption[];
  onSelect: (option: AIOption) => void;
  questionId: string;
}

const iconMap: Record<string, React.ReactNode> = {
  'Me': <User className="w-4 h-4" />,
  'Friend': <Heart className="w-4 h-4" />,
  'Family': <Users className="w-4 h-4" />,
  'Window shopping': <Eye className="w-4 h-4" />,
};

export function PillOptions({ options, onSelect, questionId }: PillOptionsProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {options.map((option, index) => (
        <button
          key={option.id}
          onClick={() => onSelect(option)}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-full",
            "bg-secondary text-secondary-foreground",
            "border border-border/50",
            "hover:bg-pill-hover hover:border-primary/30",
            "active:scale-95",
            "transition-all duration-200 ease-out",
            "text-sm font-medium",
            "shadow-sm hover:shadow-card",
            "animate-fade-in"
          )}
          style={{ animationDelay: `${index * 75}ms` }}
        >
          {iconMap[option.shortAnswer] && (
            <span className="text-muted-foreground">
              {iconMap[option.shortAnswer]}
            </span>
          )}
          {option.shortAnswer}
        </button>
      ))}
    </div>
  );
}
