import React from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-8", iconOnly = false, color = "#0A1628" }) => {
  if (iconOnly) {
    return (
      <svg 
        width="32" 
        height="32" 
        viewBox="0 0 32 32" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path 
          d="M4 4 L14 24 Q16 28 18 24 L28 4" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <svg 
        width="120" 
        height="40" 
        viewBox="0 0 120 40" 
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
      >
        <g transform="translate(10, 5)">
          <path 
            d="M2 2 L13 26 Q15 30 17 26 L28 2" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </g>
        <text 
          x="45" 
          y="27" 
          fontFamily="'Neue Montreal', 'Inter', system-ui, sans-serif" 
          fontWeight="500" 
          fontSize="22" 
          fill="currentColor" 
          letterSpacing="-0.5"
        >
          voira
        </text>
      </svg>
    </div>
  );
};
