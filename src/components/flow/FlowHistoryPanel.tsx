import { FlowSession, formatLabel } from '@/lib/flowTypes';
import { Clock, ChevronRight } from 'lucide-react';

interface FlowHistoryPanelProps {
  sessions: FlowSession[];
}

export function FlowHistoryPanel({ sessions }: FlowHistoryPanelProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No previous sessions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.slice().reverse().slice(0, 5).map((session) => (
        <div 
          key={session.id}
          className="bg-card border border-border/30 rounded-lg p-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {new Date(session.timestamp).toLocaleDateString()}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
          
          <div className="flex flex-wrap gap-2 text-xs">
            {session.state.entryPoint && (
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                {formatLabel(session.state.entryPoint)}
              </span>
            )}
            {session.state.category && (
              <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full">
                {formatLabel(session.state.category)}
              </span>
            )}
            {session.state.subcategory && (
              <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full">
                {formatLabel(session.state.subcategory)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
