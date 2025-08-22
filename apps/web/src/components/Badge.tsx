import React from 'react';
import { cn } from '../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
}

export function Badge({ 
  variant = 'info', 
  className, 
  children, 
  ...props 
}: BadgeProps) {
  const variantClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info'
  };

  return (
    <span
      className={cn(
        'badge',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}