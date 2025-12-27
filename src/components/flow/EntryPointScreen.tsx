import { formatLabel } from '@/lib/flowTypes';
import { User, Users, Eye } from 'lucide-react';

interface EntryPointScreenProps {
  entryPoints: string[];
  onSelect: (entry: string) => void;
}

const entryIcons: Record<string, React.ReactNode> = {
  myself: <User className="w-8 h-8" />,
  others: <Users className="w-8 h-8" />,
  browsing: <Eye className="w-8 h-8" />,
};

export function EntryPointScreen({ entryPoints, onSelect }: EntryPointScreenProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          Who are you shopping for?
        </h2>
        <p className="text-sm text-muted-foreground">
          Select an option to get personalized recommendations
        </p>
      </div>

      {/* Vertical stack - all three options one under another */}
      <div className="flex flex-col gap-3 max-w-md mx-auto">
        {entryPoints.map((entry) => (
          <button
            key={entry}
            onClick={() => onSelect(entry)}
            className="group flex items-center gap-4 p-5 rounded-xl border border-border/50 bg-card hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 hover:shadow-soft active:scale-[0.98]"
          >
            <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
              {entryIcons[entry] || <User className="w-8 h-8" />}
            </div>
            <span className="text-lg font-semibold text-foreground">
              {formatLabel(entry)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
