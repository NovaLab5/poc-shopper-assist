import { useState } from 'react';
import { DollarSign } from 'lucide-react';

interface BudgetSliderProps {
  onSelect: (budget: string) => void;
}

export function BudgetSlider({ onSelect }: BudgetSliderProps) {
  const [value, setValue] = useState(250); // Default to middle value
  const minValue = 1;
  const maxValue = 500;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(parseInt(e.target.value));
  };

  const handleContinue = () => {
    // Format the budget as a label for display
    const budgetLabel = value >= 500 ? '$500+' : `$${value}`;
    onSelect(budgetLabel);
  };

  // Calculate percentage for gradient
  const percentage = ((value - minValue) / (maxValue - minValue)) * 100;

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          What is your budget?
        </h2>
        <p className="text-sm text-muted-foreground">
          Slide to select your budget range
        </p>
      </div>

      {/* Budget Display */}
      <div className="flex items-center justify-center">
        <div className="relative">
          {/* Pulsing background - softer */}
          <div className="absolute inset-0 bg-primary/10 rounded-xl blur-lg animate-pulse" />

          {/* Budget amount */}
          <div className="relative bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-6 border border-primary/20 shadow-sm">
            <div className="flex items-center justify-center gap-2">
              <DollarSign className="w-7 h-7 text-primary/80" />
              <span className="text-4xl font-semibold text-primary">
                {value >= 500 ? '500+' : value}
              </span>
            </div>
            {value < 500 && (
              <p className="text-center text-xs text-muted-foreground mt-1.5">
                Up to ${value}
              </p>
            )}
            {value >= 500 && (
              <p className="text-center text-xs text-muted-foreground mt-1.5">
                $500 and above
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-3 px-2">
        <div className="relative">
          {/* Track background */}
          <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 bg-secondary/40 rounded-full" />

          {/* Filled track */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r from-primary/80 to-accent/80 rounded-full transition-all duration-150"
            style={{ width: `${percentage}%` }}
          />

          {/* Slider input */}
          <input
            type="range"
            min={minValue}
            max={maxValue}
            value={value}
            onChange={handleSliderChange}
            className="relative w-full h-2 bg-transparent appearance-none cursor-pointer z-10
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-6
              [&::-webkit-slider-thumb]:h-6
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-primary
              [&::-webkit-slider-thumb]:border-3
              [&::-webkit-slider-thumb]:border-background
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-webkit-slider-thumb]:active:scale-95
              [&::-moz-range-thumb]:w-6
              [&::-moz-range-thumb]:h-6
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-primary
              [&::-moz-range-thumb]:border-3
              [&::-moz-range-thumb]:border-background
              [&::-moz-range-thumb]:shadow-md
              [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-thumb]:transition-transform
              [&::-moz-range-thumb]:hover:scale-110
              [&::-moz-range-thumb]:active:scale-95"
          />
        </div>

        {/* Min/Max labels */}
        <div className="flex justify-between text-xs font-medium text-muted-foreground px-1">
          <span>${minValue}</span>
          <span>$500+</span>
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        className="w-full min-h-[48px] py-3 px-6 bg-primary text-primary-foreground rounded-lg text-base font-medium hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm hover:shadow-md"
      >
        Continue
      </button>

      {/* Quick select buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[50, 150, 300, 500].map((amount) => (
          <button
            key={amount}
            onClick={() => setValue(amount)}
            className={`py-2.5 px-2 rounded-lg text-sm font-medium transition-all border ${
              value === amount
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-foreground border-border/40 hover:border-primary/40'
            }`}
          >
            ${amount}{amount === 500 ? '+' : ''}
          </button>
        ))}
      </div>
    </div>
  );
}

