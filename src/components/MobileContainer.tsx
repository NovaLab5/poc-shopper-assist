import { type ReactNode } from 'react';

interface MobileContainerProps {
  children: ReactNode;
}

/**
 * MobileContainer - Constrains app to iOS iPhone dimensions
 * 
 * - Desktop: Shows centered iPhone mockup (390px wide)
 * - iOS device: Full screen with safe area handling
 */
export function MobileContainer({ children }: MobileContainerProps) {
  // Detect if running in Capacitor (native iOS app)
  const isNative = typeof window !== 'undefined' && 'Capacitor' in window;

  if (isNative) {
    // Native iOS: use full screen with safe areas
    return (
      <div className="h-screen w-screen overflow-hidden bg-background">
        <div
          className="h-full w-full"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  // Web/Desktop: centered iPhone mockup
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 flex items-center justify-center p-4">
      <div className="relative w-full max-w-[390px] aspect-[390/844] bg-[#2D2D2D] rounded-[3rem] p-3 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-[#2D2D2D] rounded-b-3xl z-50" />
        
        {/* Screen */}
        <div className="relative h-full bg-white rounded-[2.5rem] overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
