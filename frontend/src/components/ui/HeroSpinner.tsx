import React from 'react';
import { Spinner as HeroSpinner } from '@heroui/react';
import type { SpinnerProps as HeroSpinnerProps } from '@heroui/react';

export interface SpinnerProps extends Omit<HeroSpinnerProps, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function Spinner({ size = 'md', text, color = 'primary', ...props }: SpinnerProps) {
  if (text) {
    return (
      <div className="flex flex-col items-center justify-center gap-3">
        <HeroSpinner size={size} color={color} {...props} />
        <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
      </div>
    );
  }

  return <HeroSpinner size={size} color={color} {...props} />;
}

// Componente LoadingSpinner para compatibilidade com código existente
export function LoadingSpinner({ size = 'md', text }: SpinnerProps) {
  return <Spinner size={size} text={text} />;
}
