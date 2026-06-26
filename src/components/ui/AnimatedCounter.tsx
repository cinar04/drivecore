import React, { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1500,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const [current, setCurrent] = useState(0);
  const startTime = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const startValue = useRef(0);

  useEffect(() => {
    startValue.current = current;
    startTime.current = null;

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const newValue = startValue.current + (value - startValue.current) * eased;
      setCurrent(newValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const formatted = decimals > 0 ? current.toFixed(decimals) : Math.round(current).toString();

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
};
