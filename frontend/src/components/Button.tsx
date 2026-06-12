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
  style,
  ...props 
}) => {
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    cta: "btn-cta",
    ghost: "btn-ghost",
    destructive: "btn-primary bg-[var(--color-error)] hover:bg-[var(--color-error)]/90"
  };

  const sizeStyles = {
    sm: { height: '36px', padding: '0 14px', fontSize: '13px' },
    md: {},
    lg: { height: '48px', padding: '0 28px', fontSize: '15px' }
  };

  return (
    <button 
      className={`${variants[variant as keyof typeof variants]} ${className}`}
      style={{ ...sizeStyles[size], ...style }}
      {...props}
    >
      {children}
    </button>
  );
};
