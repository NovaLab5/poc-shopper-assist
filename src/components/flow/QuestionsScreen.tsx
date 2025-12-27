import { useState } from 'react';
import { FlowQuestion, formatLabel } from '@/lib/flowTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QuestionsScreenProps {
  questions: FlowQuestion[];
  onSubmit: (answers: { [key: string]: string | number }) => void;
}

export function QuestionsScreen({ questions, onSubmit }: QuestionsScreenProps) {
  const [answers, setAnswers] = useState<{ [key: string]: string | number }>({});

  const handleChange = (key: string, value: string | number) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  const isComplete = questions.every(q => answers[q.key] !== undefined && answers[q.key] !== '');

  return (
    <div className="space-y-6 animate-fade-in max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          A few quick questions
        </h2>
        <p className="text-muted-foreground">
          Help us understand what you're looking for
        </p>
      </div>

      <div className="space-y-5">
        {questions.map((q) => (
          <div key={q.key} className="space-y-2">
            <Label htmlFor={q.key} className="text-foreground">
              {q.question}
            </Label>
            {q.type === 'number' ? (
              <Input
                id={q.key}
                type="number"
                placeholder="Enter a number"
                value={answers[q.key] || ''}
                onChange={(e) => handleChange(q.key, parseInt(e.target.value) || '')}
                className="bg-background"
              />
            ) : q.type === 'select' && q.options ? (
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleChange(q.key, opt)}
                    className={`px-4 py-2 rounded-full border transition-all ${
                      answers[q.key] === opt
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card border-border/50 text-foreground hover:border-primary/50'
                    }`}
                  >
                    {formatLabel(opt)}
                  </button>
                ))}
              </div>
            ) : (
              <Input
                id={q.key}
                type="text"
                placeholder="Enter your answer"
                value={answers[q.key] || ''}
                onChange={(e) => handleChange(q.key, e.target.value)}
                className="bg-background"
              />
            )}
          </div>
        ))}
      </div>

      <Button 
        onClick={handleSubmit} 
        disabled={!isComplete}
        className="w-full"
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}
