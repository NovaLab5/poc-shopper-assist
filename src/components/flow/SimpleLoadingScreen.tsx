import { useEffect } from 'react';
import sourDillLogo from '@/assets/sour-dillmas-logo.png';

interface SimpleLoadingScreenProps {
  message: string;
  onComplete: () => void;
  duration?: number;
  emphasizeText?: string;
}

export function SimpleLoadingScreen({
  message,
  onComplete,
  duration = 3000,
  emphasizeText
}: SimpleLoadingScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-8">
      <div className="flex flex-col items-center gap-6">
        {/* Animated logo container */}
        <div className="relative">
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
        <h2 className="text-xl font-semibold text-foreground text-center">
          SweetDill AI is thinking...
        </h2>

        {/* Specific message */}
        <p className="text-sm text-center text-muted-foreground font-medium max-w-sm">
          {emphasizeText ? (
            <>
              {message.split(emphasizeText).map((part, index, array) => (
                <span key={index}>
                  {part}
                  {index < array.length - 1 && (
                    <span className="font-bold text-foreground">{emphasizeText}</span>
                  )}
                </span>
              ))}
            </>
          ) : (
            message
          )}
        </p>

        {/* Animated dots */}
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

