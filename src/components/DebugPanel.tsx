import { useState } from 'react';
import { AIQuestion, SelectedAnswer } from '@/lib/types';
import { ChevronDown, ChevronUp, Code } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DebugPanelProps {
  currentQuestion: AIQuestion | null;
  lastAnswer: SelectedAnswer | null;
  allAnswers: SelectedAnswer[];
}

export function DebugPanel({ currentQuestion, lastAnswer, allAnswers }: DebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="bg-card rounded-xl shadow-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Conversation Debug</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      
      {/* Expanded Content */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="p-4 pt-0 space-y-4 text-xs">
          {/* Current Question */}
          {currentQuestion && (
            <div>
              <p className="text-muted-foreground uppercase tracking-wide mb-1">
                Current AIQuestion
              </p>
              <pre className="bg-secondary rounded-lg p-3 overflow-x-auto text-foreground/80">
                {JSON.stringify(currentQuestion, null, 2)}
              </pre>
            </div>
          )}
          
          {/* Last Selected Answer */}
          {lastAnswer && (
            <div>
              <p className="text-muted-foreground uppercase tracking-wide mb-1">
                Last Selected (longAnswer)
              </p>
              <div className="bg-secondary rounded-lg p-3 text-foreground/80">
                "{lastAnswer.longAnswer}"
              </div>
            </div>
          )}
          
          {/* All Long Answers */}
          {allAnswers.length > 0 && (
            <div>
              <p className="text-muted-foreground uppercase tracking-wide mb-1">
                Accumulated longAnswers
              </p>
              <div className="bg-secondary rounded-lg p-3 space-y-1">
                {allAnswers.map((a, i) => (
                  <div key={a.questionId} className="text-foreground/80">
                    <span className="text-primary font-medium">Q{i + 1}:</span> {a.longAnswer}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {allAnswers.length === 0 && !currentQuestion && (
            <p className="text-muted-foreground text-center py-4">
              No conversation data yet. Start a session to see debug info.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
