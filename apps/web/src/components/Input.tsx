import React from 'react';
import { cn } from '../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export function Input({ 
  label, 
  error, 
  helper, 
  className, 
  id,
  ...props 
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helper ? `${inputId}-helper` : undefined;

  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-semibold text-ink"
        >
          {label}
        </label>
      )}
      
      <input
        id={inputId}
        className={cn(
          'input w-full',
          error && 'border-secondary focus:border-secondary focus:ring-secondary',
          className
        )}
        aria-describedby={cn(errorId, helperId).trim() || undefined}
        {...props}
      />
      
      {helper && !error && (
        <p id={helperId} className="text-sm text-gray-600">
          {helper}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-secondary" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export function Textarea({ 
  label, 
  error, 
  helper, 
  className, 
  id,
  ...props 
}: TextareaProps) {
  const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helper ? `${inputId}-helper` : undefined;

  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-semibold text-ink"
        >
          {label}
        </label>
      )}
      
      <textarea
        id={inputId}
        className={cn(
          'input w-full min-h-[100px] resize-y',
          error && 'border-secondary focus:border-secondary focus:ring-secondary',
          className
        )}
        aria-describedby={cn(errorId, helperId).trim() || undefined}
        {...props}
      />
      
      {helper && !error && (
        <p id={helperId} className="text-sm text-gray-600">
          {helper}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-secondary" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}