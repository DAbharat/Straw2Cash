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

type WordUnit = {
  unit: string;
  index: number;
};

type CharGroup = {
  isSpace: boolean;
  chars: { ch: string; index: number }[];
};

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

  // Structure tokens and calculate unit count
  const { totalCount, wordGroups, charGroups } = React.useMemo(() => {
    if (mode === 'word') {
      // Split into clean words without trailing whitespaces attached to individual units
      const words = text.trim().split(/\s+/).filter(Boolean);
      const wordUnits: WordUnit[] = words.map((w, i) => ({
        unit: w,
        index: i,
      }));
      return {
        totalCount: wordUnits.length,
        wordGroups: wordUnits,
        charGroups: [] as CharGroup[],
      };
    }

    // mode === 'char'
    // Group characters by word tokens so that characters inside a word are wrapped in
    // `inline-block whitespace-nowrap`. This guarantees that words never split mid-word
    // (e.g. "Farming" never has "g" breaking onto the next line by itself).
    const parts = text.split(/(\s+)/);
    let charIndex = 0;
    const groups: CharGroup[] = parts.map((part) => {
      const isSpace = /^\s+$/.test(part);
      const chars = part.split('').map((ch) => ({
        ch,
        index: charIndex++,
      }));
      return {
        isSpace,
        chars,
      };
    });

    return {
      totalCount: charIndex,
      wordGroups: [] as WordUnit[],
      charGroups: groups,
    };
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

        if (count >= totalCount) {
          clearInterval(interval);
          setIsTypingComplete(true);
          onComplete?.();
        }
      }, staggerDelay);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [isInView, totalCount, delay, staggerDelay, onComplete]);

  return (
    <Component
      ref={containerRef as any}
      className={`relative inline-block max-w-full ${className}`}
    >
      {mode === 'word'
        ? wordGroups.map((g, i) => {
            const isRevealed = g.index < visibleCount;

            return (
              <React.Fragment key={g.index}>
                <span
                  className="inline-block whitespace-nowrap select-none"
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
                  {g.unit}
                </span>
                {i < wordGroups.length - 1 && (
                  <span className="inline whitespace-pre select-none"> </span>
                )}
              </React.Fragment>
            );
          })
        : charGroups.map((group, gIdx) => {
            if (group.isSpace) {
              return (
                <React.Fragment key={gIdx}>
                  {group.chars.map(({ index }) => {
                    const isRevealed = index < visibleCount;
                    return (
                      <span
                        key={index}
                        className="inline whitespace-pre select-none"
                        style={{
                          opacity: isRevealed ? 1 : initialBlurVisible && isInView ? 0.22 : 0,
                        }}
                      >
                        {' '}
                      </span>
                    );
                  })}
                </React.Fragment>
              );
            }

            // Word token: wrap in inline-block whitespace-nowrap so the word never splits across lines
            return (
              <span key={gIdx} className="inline-block whitespace-nowrap">
                {group.chars.map(({ ch, index }) => {
                  const isRevealed = index < visibleCount;
                  return (
                    <span
                      key={index}
                      className="inline-block select-none"
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
                      {ch}
                    </span>
                  );
                })}
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
