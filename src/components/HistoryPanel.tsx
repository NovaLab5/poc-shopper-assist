import { useState } from 'react';
import { Session } from '@/lib/types';
import { formatDate } from '@/lib/storage';
import { History, ChevronRight, Calendar, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface HistoryPanelProps {
  sessions: Session[];
}

export function HistoryPanel({ sessions }: HistoryPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const completedSessions = sessions.filter(s => s.completedAt);
  
  if (completedSessions.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-card rounded-xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <History className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Session History</span>
        <Badge variant="secondary" className="text-xs ml-auto">
          {completedSessions.length}
        </Badge>
      </div>
      
      {/* Sessions List */}
      <div className="max-h-[300px] overflow-y-auto">
        {completedSessions.slice().reverse().map((session) => (
          <div key={session.id} className="border-b border-border last:border-0">
            {/* Session Header */}
            <button
              onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
              className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left"
            >
              <ChevronRight 
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  expandedId === session.id && "rotate-90"
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(session.completedAt!)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Tag className="w-3 h-3 text-primary" />
                  <span className="text-sm font-medium text-foreground truncate">
                    {session.interpretation?.category || 'General'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    • {session.interpretation?.priceRange}
                  </span>
                </div>
              </div>
            </button>
            
            {/* Expanded Details */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                expandedId === session.id ? "max-h-[400px]" : "max-h-0"
              )}
            >
              <div className="px-4 pb-4 space-y-3 text-xs">
                {/* Answers */}
                <div>
                  <p className="text-muted-foreground uppercase tracking-wide mb-2">Answers</p>
                  <div className="space-y-1">
                    {session.answers.map((a, i) => (
                      <div key={a.questionId} className="bg-secondary/50 rounded-lg p-2">
                        <span className="text-primary font-medium">Q{i + 1}:</span>{' '}
                        <span className="text-foreground/80">{a.shortAnswer}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Interpretation */}
                {session.interpretation && (
                  <div>
                    <p className="text-muted-foreground uppercase tracking-wide mb-2">Interpretation</p>
                    <div className="bg-secondary/50 rounded-lg p-2 space-y-1">
                      <p><span className="text-muted-foreground">Category:</span> {session.interpretation.category}</p>
                      <p><span className="text-muted-foreground">Audience:</span> {session.interpretation.audience}</p>
                      <p><span className="text-muted-foreground">Brand Sensitive:</span> {session.interpretation.brandSensitive ? 'Yes' : 'No'}</p>
                      <p><span className="text-muted-foreground">Brands:</span> {session.interpretation.brands.join(', ')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
