import sourDillLogo from '@/assets/sour-dillmas-logo.png';

interface AILoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function AILoadingOverlay({ isVisible, message = "SweetDill AI is thinking..." }: AILoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md animate-fade-in rounded-xl">
      <div className="flex flex-col items-center gap-4">
        {/* Animated logo container */}
        <div className="relative">
          {/* Pulsing glow ring */}
          <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/20 animate-ping" />
          <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/30 animate-pulse" />
          
          {/* Logo with bounce animation */}
          <div className="relative w-20 h-20 rounded-full bg-card shadow-lg flex items-center justify-center animate-bounce border-2 border-primary/30" style={{ animationDuration: '1.5s' }}>
            <img 
              src={sourDillLogo} 
              alt="Sour Dill thinking" 
              className="w-14 h-14 object-contain"
            />
          </div>
          
          {/* Rotating dots around logo */}
          <div className="absolute inset-0 w-20 h-20 animate-spin" style={{ animationDuration: '3s' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 rounded-full bg-primary" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-2 h-2 rounded-full bg-primary/60" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rounded-full bg-primary/40" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 rounded-full bg-primary/80" />
          </div>
        </div>
        
        {/* Text with shimmer effect */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-semibold text-foreground">
            {message}
          </p>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
