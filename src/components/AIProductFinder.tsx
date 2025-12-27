import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import sourDillLogo from '@/assets/sour-dillmas-logo.png';

interface AIProductFinderProps {
  isVisible: boolean;
  onComplete: () => void;
}

const steps = [
  { id: 1, text: "Analyzing", highlight: "210+", suffix: "products" },
  { id: 2, text: "Evaluating product criteria", highlight: "", suffix: "" },
  { id: 3, text: "Analyzing", highlight: "4.4k+", suffix: "customer reviews" },
  { id: 4, text: "Comparing prices and return rates", highlight: "", suffix: "" },
];

export function AIProductFinder({ isVisible, onComplete }: AIProductFinderProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCompletedSteps([]);
      setCurrentStep(0);
      return;
    }

    // Start the animation sequence
    const timers: NodeJS.Timeout[] = [];
    
    steps.forEach((step, index) => {
      const timer = setTimeout(() => {
        setCurrentStep(index + 1);
        setCompletedSteps(prev => [...prev, step.id]);
        
        // Call onComplete after all steps are done
        if (index === steps.length - 1) {
          setTimeout(() => {
            onComplete();
          }, 800);
        }
      }, (index + 1) * 900); // 900ms between each step
      
      timers.push(timer);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in rounded-xl p-6">
      {/* Animated logo */}
      <div className="relative mb-12">
        <div className="absolute inset-0 w-16 h-16 rounded-full bg-primary/20 animate-ping" />
        <div className="relative w-16 h-16 rounded-full bg-card shadow-lg flex items-center justify-center border-2 border-primary/30">
          <img 
            src={sourDillLogo} 
            alt="Finding products" 
            className="w-10 h-10 object-contain animate-pulse"
          />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold text-foreground mb-8">
        Finding the best option for you...
      </h2>

      {/* Steps list */}
      <div className="w-full max-w-sm space-y-4">
        {steps.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          const isActive = currentStep === step.id - 1;
          
          return (
            <div 
              key={step.id} 
              className={`flex items-center gap-3 transition-all duration-300 ${
                isCompleted ? 'opacity-100' : isActive ? 'opacity-70' : 'opacity-40'
              }`}
            >
              {/* Left border indicator */}
              <div 
                className={`w-1 h-8 rounded-full transition-all duration-500 ${
                  isCompleted ? 'bg-primary' : 'bg-muted'
                }`}
              />
              
              {/* Checkbox */}
              <div 
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-foreground border-foreground' 
                    : 'bg-transparent border-muted-foreground/30'
                }`}
              >
                {isCompleted && (
                  <Check className="w-4 h-4 text-background animate-scale-in" />
                )}
              </div>
              
              {/* Text */}
              <span className={`text-sm transition-all duration-300 ${
                isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'
              }`}>
                {step.text}{' '}
                {step.highlight && (
                  <span className="font-bold">{step.highlight}</span>
                )}{' '}
                {step.suffix}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
