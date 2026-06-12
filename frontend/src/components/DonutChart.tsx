import React, { useEffect, useState, useRef } from 'react';
import { Bus, Train, Plane, Ship } from 'lucide-react';
import { TransportMode } from '../types';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  total: number;
  transportMode?: TransportMode;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  segments,
  total,
  transportMode = 'flight',
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [animateProgress, setAnimateProgress] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const prevValueRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter out zero-value segments
  const activeSegments = segments.filter((s) => s.value > 0);
  const segmentsTotal = activeSegments.reduce((sum, s) => sum + s.value, 0);

  // Draw animation trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateProgress(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Total count-up animation
  useEffect(() => {
    const start = prevValueRef.current;
    const end = total;
    if (start === end) {
      if (start === 0) setAnimatedValue(0);
      return;
    }

    const duration = start === 0 ? 600 : 200;
    const startTime = performance.now();
    let animFrameId: number;

    const updateCounter = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
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
    return () => cancelAnimationFrame(animFrameId);
  }, [total]);

  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.327
  let cumulativePercent = 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // Get matching icon for the transport mode
  const getTransportIcon = (mode: TransportMode) => {
    const iconClass = "w-3.5 h-3.5 shrink-0";
    if (mode === 'bus') return <Bus className={iconClass} />;
    if (mode === 'train-sleeper' || mode === 'train-ac') return <Train className={iconClass} />;
    if (mode === 'ferry') return <Ship className={iconClass} />;
    return <Plane className={iconClass} />;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-full flex items-center justify-center overflow-visible"
    >
      {/* SVG Donut Chart */}
      <svg viewBox="0 0 100 100" className="w-52 h-52 transform -rotate-90 overflow-visible">
        {/* Track circle */}
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

          const isHovered = hoveredIdx === idx;
          const currentStrokeWidth = isHovered ? 13 : 9;

          return (
            <circle
              key={idx}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={currentStrokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={animateProgress ? strokeOffset : circumference}
              transform={`rotate(${rotation} 50 50)`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="transition-all duration-150 cursor-pointer"
              style={{
                transformOrigin: '50px 50px',
              }}
            />
          );
        })}
      </svg>

      {/* Center text in donut hole */}
      <div className="absolute flex flex-col items-center justify-center text-center select-none pointer-events-none">
        <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">
          Total Spent
        </span>
        <span className="price text-[var(--color-accent)] text-lg font-bold">
          {formatCurrency(animatedValue)}
        </span>
      </div>

      {/* Interactive Tooltip Card */}
      {hoveredIdx !== null && activeSegments[hoveredIdx] && (
        <div
          className="absolute z-30 bg-slate-950/90 border border-white/15 px-3 py-2.5 rounded-xl text-xs font-semibold text-white shadow-2xl pointer-events-none flex items-center gap-2 backdrop-blur-md animate-fade-in text-left font-sans"
          style={{
            left: mousePos.x + 12,
            top: mousePos.y - 45,
          }}
        >
          {activeSegments[hoveredIdx].label.toLowerCase().includes('transport') && (
            <div className="text-teal-400 p-1 bg-teal-500/10 rounded-md border border-teal-500/20">
              {getTransportIcon(transportMode)}
            </div>
          )}
          <div>
            <span className="block text-[10px] uppercase font-bold text-stone-400 leading-none mb-1">
              {activeSegments[hoveredIdx].label}
            </span>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-mono font-bold text-white">
                {formatCurrency(activeSegments[hoveredIdx].value)}
              </span>
              <span className="text-[10px] text-stone-400 font-normal">
                ({Math.round((activeSegments[hoveredIdx].value / (segmentsTotal || 1)) * 100)}%)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
