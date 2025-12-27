import { useEffect, useRef } from 'react';
import { useTypingEffect } from '@/hooks/useTypingEffect';

interface TypingMessageProps {
  content: string;
  shouldAnimate: boolean;
  onTypingComplete?: () => void;
  onTypingProgress?: () => void;
}

export function TypingMessage({ content, shouldAnimate, onTypingComplete, onTypingProgress }: TypingMessageProps) {
  const { displayedText, isTyping } = useTypingEffect(content, 30, shouldAnimate);
  const prevTextLengthRef = useRef(0);

  // Call onTypingComplete when typing finishes
  if (!isTyping && shouldAnimate && displayedText === content && onTypingComplete) {
    setTimeout(onTypingComplete, 0);
  }

  // Call onTypingProgress whenever text grows (for auto-scroll)
  useEffect(() => {
    if (displayedText.length > prevTextLengthRef.current && onTypingProgress) {
      onTypingProgress();
    }
    prevTextLengthRef.current = displayedText.length;
  }, [displayedText, onTypingProgress]);

  return (
    <p className="text-[15px] leading-relaxed whitespace-pre-line">
      {shouldAnimate ? displayedText : content}
      {isTyping && <span className="animate-pulse">▋</span>}
    </p>
  );
}
