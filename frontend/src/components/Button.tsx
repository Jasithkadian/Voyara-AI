import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'cta' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}) => {
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    cta: "btn-cta",
    ghost: "btn-ghost",
    destructive: "btn-primary bg-[var(--color-error)] hover:bg-[var(--color-error)]/90"
  };

  // Adjust height based on size if needed, but the design system has fixed heights
  // sm: 36px (ghost/sm), md: 40px (primary/secondary), lg: 48px (cta)
  
  return (
    <button 
      className={`${variants[variant as keyof typeof variants]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
