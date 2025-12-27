import { ReactNode } from 'react';

interface PhoneMockupProps {
  children: ReactNode;
}

export function PhoneMockup({ children }: PhoneMockupProps) {
  return (
    <div className="relative mx-auto" style={{ width: '375px', height: '812px' }}>
      {/* iPhone Frame */}
      <div className="absolute inset-0 bg-foreground rounded-[3rem] shadow-2xl">
        {/* Inner bezel */}
        <div className="absolute inset-[3px] bg-foreground rounded-[2.8rem]">
          {/* Screen area */}
          <div className="absolute inset-[10px] bg-background rounded-[2.2rem] overflow-hidden">
            {/* Dynamic Island / Notch */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-foreground rounded-full z-50" />
            
            {/* Screen Content */}
            <div className="h-full w-full overflow-auto pt-12 pb-6">
              {children}
            </div>
            
            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-foreground/30 rounded-full" />
          </div>
        </div>
      </div>
      
      {/* Side Buttons */}
      <div className="absolute -left-[3px] top-32 w-[3px] h-8 bg-foreground rounded-l-sm" />
      <div className="absolute -left-[3px] top-48 w-[3px] h-16 bg-foreground rounded-l-sm" />
      <div className="absolute -left-[3px] top-[17rem] w-[3px] h-16 bg-foreground rounded-l-sm" />
      <div className="absolute -right-[3px] top-36 w-[3px] h-20 bg-foreground rounded-r-sm" />
    </div>
  );
}
