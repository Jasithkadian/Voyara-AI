import React from 'react';

export type BadgeType = 'verified' | 'recommender' | 'duration' | 'value' | 'direct';

interface BadgeProps {
  type: BadgeType;
  label: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, label, className = '' }) => {
  // Common standardized styles: 11px font size, 600 weight (mapped as font-semibold), 4px border radius (rounded-sm), 2px 8px padding
  const baseStyle = "inline-flex items-center justify-center text-xs font-semibold rounded-sm px-2 py-1 select-none";
  
  const variants = {
    verified: "bg-successSage/10 text-successSage dark:bg-successSage/20 dark:text-successSage",
    recommender: "bg-primary/10 text-primary dark:bg-primary/20",
    duration: "bg-stoneMuted/50 text-textPrimary dark:bg-dark-muted dark:text-dark-text",
    value: "bg-coral/10 text-coral dark:bg-coral/20",
    direct: "bg-warningAmber/10 text-warningAmber dark:bg-warningAmber/20",
  };

  return (
    <span className={`${baseStyle} ${variants[type]} ${className}`}>
      {label}
    </span>
  );
};
