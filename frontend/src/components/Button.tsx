import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'lg' | 'default' | 'large';
  shimmer?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'default',
  shimmer = false,
  className = '',
  ...props
}) => {
  // rounded-sm maps to 4px border radius as defined in the theme configuration
  const baseStyle = "font-sans font-semibold transition-colors inline-flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 select-none rounded-sm";
  
  const variants = {
    primary: "bg-primary text-warmWhite hover:bg-primary/90",
    secondary: "bg-stoneMuted text-textPrimary hover:bg-stoneMuted/70",
    ghost: "bg-transparent text-textSecondary hover:bg-stoneMuted/50 hover:text-textPrimary",
    destructive: "bg-coral text-warmWhite hover:bg-coral/90",
  };

  const sizes = {
    sm: "h-9 px-4 text-xs",
    default: "h-9 px-4 text-xs",
    lg: "h-11 px-6 text-sm",
    large: "h-11 px-6 text-sm",
  };

  const label = typeof children === 'string' ? children : '';
  const shimmerClass = shimmer && label === 'Generate Travel Plan' ? "animate-shimmer" : "";

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${shimmerClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
