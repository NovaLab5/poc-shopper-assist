import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import sourDillLogo from '@/assets/sour-dillmas-logo.png';

interface LoadingScreenProps {
  message?: string;
  onComplete: () => void;
  duration?: number;
}

interface LoadingStep {
  text: string;
  completed: boolean;
}

export function LoadingScreen({
  message = "Finding the best option for you...",
  onComplete,
  duration = 4000
}: LoadingScreenProps) {
  // Generate random number of products between 197 and 3648
  const [randomProducts] = useState(() => Math.floor(Math.random() * (3648 - 197 + 1)) + 197);
  // Calculate 20% of products for reviews
  const [reviewCount] = useState(() => Math.floor(randomProducts * 0.2));

  const [initialSteps] = useState<LoadingStep[]>([
    { text: `Checking ${randomProducts}+ products`, completed: false },
    { text: "Evaluating product attributes", completed: false },
    { text: `Choosing ${reviewCount}+ customer reviews`, completed: false },
    { text: "Comparing prices", completed: false },
    { text: "Checking return rates", completed: false },
  ]);

  const [steps, setSteps] = useState<LoadingStep[]>(initialSteps);

  useEffect(() => {
    const stepDuration = duration / initialSteps.length;
    const timers: NodeJS.Timeout[] = [];

    initialSteps.forEach((_, index) => {
      const timer = setTimeout(() => {
        setSteps(prev =>
          prev.map((step, i) =>
            i === index ? { ...step, completed: true } : step
          )
        );
      }, stepDuration * (index + 1));
      timers.push(timer);
    });

    // Call onComplete after all steps are done
    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration + 200);
    timers.push(completeTimer);

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [duration, onComplete, initialSteps]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-8">
      {/* Logo at top */}
      <div className="relative mb-6">
        {/* Pulsing glow ring */}
        <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/20 animate-ping" />
        <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/30 animate-pulse" />

        {/* Logo with bounce animation */}
        <div className="relative w-20 h-20 rounded-full bg-card shadow-lg flex items-center justify-center animate-bounce border-2 border-primary/30" style={{ animationDuration: '1.5s' }}>
          <img
            src={sourDillLogo}
            alt="Sweet Dill thinking"
            className="w-14 h-14 object-contain"
          />
        </div>
      </div>

      {/* Main heading */}
      <h2 className="text-lg font-semibold text-foreground text-center mb-6">
        SweetDill AI is Finding the best products for you...
      </h2>

      {/* Checklist */}
      <div className="w-full max-w-sm mx-auto space-y-3">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex items-center justify-start gap-2.5 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div
              className={`
                w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
                ${step.completed
                  ? 'bg-primary text-primary-foreground'
                  : 'border-2 border-muted-foreground/30'
                }
              `}
            >
              {step.completed && <Check className="w-4 h-4" />}
            </div>
            <p
              className={`
                text-sm transition-colors duration-300
                ${step.completed
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
                }
              `}
            >
              {step.text}
            </p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm mx-auto mt-6 h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-linear"
          style={{
            width: `${(steps.filter(s => s.completed).length / steps.length) * 100}%`
          }}
        />
      </div>
    </div>
  );
}

