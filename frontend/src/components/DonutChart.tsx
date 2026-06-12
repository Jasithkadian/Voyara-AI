import React, { useEffect, useState, useRef } from 'react';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  total: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ segments, total }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [animateProgress, setAnimateProgress] = useState(false);
  const prevValueRef = useRef(0);

  // Filter out zero-value segments to avoid rendering glitches
  const activeSegments = segments.filter((s) => s.value > 0);
  const segmentsTotal = activeSegments.reduce((sum, s) => sum + s.value, 0);

  // Trigger segments draw animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateProgress(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Center value count-up animation
  useEffect(() => {
    const start = prevValueRef.current;
    const end = total;
    if (start === end) {
      if (start === 0) {
        setAnimatedValue(0);
      }
      return;
    }

    const duration = start === 0 ? 600 : 200;
    const startTime = performance.now();

    let animFrameId: number;

    const updateCounter = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing curve: easeOutQuad
      const ease = progress * (2 - progress);
      const current = Math.floor(start + (end - start) * ease);
      setAnimatedValue(current);

      if (progress < 1) {
        animFrameId = requestAnimationFrame(updateCounter);
      } else {
        setAnimatedValue(end);
        prevValueRef.current = end;
      }
    };

    animFrameId = requestAnimationFrame(updateCounter);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [total]);

  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.327
  let cumulativePercent = 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* SVG Donut Chart rotated to start at top (12 o'clock) */}
      <svg viewBox="0 0 100 100" className="w-52 h-52 transform -rotate-90 overflow-visible">
        {/* Subtle background track */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth="9"
          className="dark:stroke-dark-border"
        />

        {activeSegments.map((seg, idx) => {
          const percent = segmentsTotal > 0 ? seg.value / segmentsTotal : 0;
          const strokeLength = circumference * percent;
          const strokeOffset = circumference - strokeLength;
          const rotation = cumulativePercent * 360;
          
          cumulativePercent += percent;

          return (
            <circle
              key={idx}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={animateProgress ? strokeOffset : circumference}
              transform={`rotate(${rotation} 50 50)`}
              style={{
                transition: 'stroke-dashoffset 800ms ease-out',
                transitionDelay: `${idx * 100}ms`,
                transformOrigin: '50px 50px',
              }}
            />
          );
        })}
      </svg>

      {/* Center Text displaying running total value */}
      <div className="absolute flex flex-col items-center justify-center text-center select-none pointer-events-none">
        <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">
          Total Spent
        </span>
        <span className="price text-[var(--color-accent)] text-lg font-bold">
          {formatCurrency(animatedValue)}
        </span>
      </div>
    </div>
  );
};
