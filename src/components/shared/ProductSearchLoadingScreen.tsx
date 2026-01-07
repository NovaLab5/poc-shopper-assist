import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import sourDillLogo from '@/assets/sour-dillmas-logo.png';

interface ProductSearchLoadingScreenProps {
  category: string;
  onComplete?: () => void;
  duration?: number; // Total duration in milliseconds (default: 8000)
}

export function ProductSearchLoadingScreen({ 
  category, 
  onComplete,
  duration = 8000 
}: ProductSearchLoadingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [randomNumbers] = useState({
    resources: Math.floor(Math.random() * (37 - 19 + 1)) + 19,
    reviews: Math.floor(Math.random() * (9 - 3 + 1)) + 3,
  });

  const steps = [
    { text: `Checking ${randomNumbers.resources} resources for ${category}` },
    { text: `Checking ${randomNumbers.reviews} customer reviews` },
    { text: 'Finding the best deals' },
    { text: 'Evaluating product attributes' },
    { text: 'Comparing prices' },
    { text: 'Checking return rates' },
  ];

  useEffect(() => {
    const stepDuration = duration / steps.length;
    const timers: NodeJS.Timeout[] = [];

    steps.forEach((_, index) => {
      const timer = setTimeout(() => {
        setCurrentStep(index + 1);
      }, stepDuration * (index + 1));
      timers.push(timer);
    });

    // Call onComplete when all steps are done
    if (onComplete) {
      const completeTimer = setTimeout(onComplete, duration);
      timers.push(completeTimer);
    }

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [duration, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8">
      <div className="relative mb-6">
        <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/20 animate-ping" />
        <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/30 animate-pulse" />
        <div className="relative w-20 h-20 rounded-full bg-card shadow-lg flex items-center justify-center animate-bounce border-2 border-primary/30" style={{ animationDuration: '1.5s' }}>
          <img src={sourDillLogo} alt="Sweet Dill" className="w-14 h-14 object-contain" />
        </div>
      </div>

      <div className="w-full max-w-md mx-auto space-y-3">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex items-center justify-start gap-2.5 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
              currentStep > index ? 'bg-primary text-primary-foreground' : 'border-2 border-muted-foreground/30'
            }`}>
              {currentStep > index && <Check className="w-4 h-4" />}
            </div>
            <p className={`text-sm transition-colors duration-300 ${
              currentStep > index ? 'text-foreground font-medium' : 'text-muted-foreground'
            }`}>
              {step.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

