import React from 'react';
import { Button as HeroButton, type ButtonProps as HeroButtonProps } from './HeroButton';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HeroButtonProps, 'variant' | 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  // Map old variants to new ones
  const mappedVariant = variant === 'success' ? 'primary' : variant;

  return (
    <HeroButton
      variant={mappedVariant}
      size={size}
      {...props}
    />
  );
}
