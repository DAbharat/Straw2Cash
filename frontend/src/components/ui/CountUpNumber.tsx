import React, { useEffect, useRef, useState } from 'react';

interface CountUpNumberProps {
  value: number;
  duration?: number; // ms
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  triggerOnScroll?: boolean;
}

export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  value,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  triggerOnScroll = true,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const [hasStarted, setHasStarted] = useState(!triggerOnScroll);

  useEffect(() => {
    if (!triggerOnScroll) {
      setHasStarted(true);
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasStarted(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.2,
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [triggerOnScroll]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Smooth easeOutExpo curve: 1 - Math.pow(2, -10 * progress)
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentVal = easeProgress * value;

      setDisplayValue(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [hasStarted, value, duration]);

  const formattedNumber = displayValue.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span
      ref={elementRef}
      className={`font-mono tabular-nums inline-block transition-all duration-700 ease-out ${className}`}
      style={{
        filter: hasStarted ? 'blur(0px)' : 'blur(6px)',
        opacity: hasStarted ? 1 : 0.3,
        willChange: 'filter, opacity',
      }}
    >
      {prefix}
      {formattedNumber}
      {suffix}
    </span>
  );
};
