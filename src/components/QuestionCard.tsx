import { AIQuestion, AIOption } from '@/lib/types';
import { PillOptions } from './PillOptions';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface QuestionCardProps {
  question: AIQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (option: AIOption) => void;
}

export function QuestionCard({ 
  question, 
  questionNumber, 
  totalQuestions, 
  onAnswer 
}: QuestionCardProps) {
  return (
    <div className="bg-card rounded-2xl p-8 shadow-card animate-slide-up">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i < questionNumber 
                ? "w-8 bg-primary" 
                : i === questionNumber 
                  ? "w-8 bg-primary animate-pulse-soft" 
                  : "w-4 bg-border"
            )}
          />
        ))}
      </div>
      
      {/* Question text */}
      <h2 className="text-xl md:text-2xl font-semibold text-center text-foreground mb-4 leading-relaxed">
        {question.question}
      </h2>

      {question.basedOn && question.basedOn.length > 0 && (
        <div className="flex items-center justify-center gap-2 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-muted-foreground">
            Based on: {question.basedOn.join(' + ')}
          </span>
        </div>
      )}
      
      {/* Pill options */}
      <PillOptions 
        options={question.options} 
        onSelect={onAnswer}
        questionId={question.id}
      />
      
      {/* Question counter */}
      <p className="text-center text-muted-foreground text-sm mt-6">
        Question {questionNumber + 1} of {totalQuestions}
      </p>
    </div>
  );
}
