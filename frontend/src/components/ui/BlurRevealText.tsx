import React, { useEffect, useRef, useState } from 'react';

interface BlurRevealTextProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  className?: string;
  mode?: 'word' | 'char';
  delay?: number; // ms before typing starts
  staggerDelay?: number; // ms per unit
  triggerOnScroll?: boolean;
  initialBlurVisible?: boolean; // if true, text is visible in blurred/misty state before typing into clarity
  showCursor?: boolean;
  cursorColor?: string;
  onComplete?: () => void;
}

export const BlurRevealText: React.FC<BlurRevealTextProps> = ({
  text,
  as: Component = 'div',
  className = '',
  mode = 'word',
  delay = 80,
  staggerDelay = 45,
  triggerOnScroll = true,
  initialBlurVisible = true,
  showCursor = false,
  cursorColor = '#E5A812',
  onComplete,
}) => {
  const containerRef = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(!triggerOnScroll);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  // Split into units (words or chars)
  const units = React.useMemo(() => {
    if (mode === 'char') {
      return text.split('');
    }
    // Word mode with attached space
    const words = text.split(' ');
    return words.map((w, i) => (i < words.length - 1 ? w + ' ' : w));
  }, [text, mode]);

  useEffect(() => {
    if (!triggerOnScroll) {
      setIsInView(true);
      return;
    }

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -20px 0px',
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [triggerOnScroll]);

  // Progressive typing with blur clearing
  useEffect(() => {
    if (!isInView) return;

    const startTimeout = setTimeout(() => {
      let count = 0;
      const interval = setInterval(() => {
        count += 1;
        setVisibleCount(count);

        if (count >= units.length) {
          clearInterval(interval);
          setIsTypingComplete(true);
          onComplete?.();
        }
      }, staggerDelay);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [isInView, units.length, delay, staggerDelay, onComplete]);

  return (
    <Component
      ref={containerRef as any}
      className={`relative inline-block ${className}`}
    >
      {units.map((unit, index) => {
        const isRevealed = index < visibleCount;
        const isSpace = unit === ' ';

        if (isSpace) {
          return (
            <span key={index} className="inline-block">
              &nbsp;
            </span>
          );
        }

        // Initially blurred and slightly faded, then typing effect clears the blur into sharp focus
        return (
          <span
            key={index}
            className="inline-block whitespace-pre-wrap select-none"
            style={{
              opacity: isRevealed ? 1 : initialBlurVisible && isInView ? 0.22 : 0,
              filter: isRevealed ? 'blur(0px)' : 'blur(12px)',
              transform: isRevealed
                ? 'translateY(0px) scale(1)'
                : 'translateY(6px) scale(0.97)',
              transition:
                'filter 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease-out, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              willChange: 'filter, opacity, transform',
            }}
          >
            {unit}
          </span>
        );
      })}

      {/* Blinking Golden Typing Cursor that follows the typing head */}
      {showCursor && !isTypingComplete && isInView && (
        <span
          className="inline-block w-1.5 h-[0.8em] ml-1.5 align-baseline animate-pulse rounded-full"
          style={{
            backgroundColor: cursorColor,
            boxShadow: `0 0 12px ${cursorColor}`,
          }}
        />
      )}
    </Component>
  );
};
