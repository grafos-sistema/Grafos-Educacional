import React from 'react';
import { Chip } from '@heroui/react';
import type { ChipProps } from '@heroui/react';

export type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'default';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends Omit<ChipProps, 'color' | 'size' | 'variant'> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className,
  ...props
}: BadgeProps) {
  // Map our variants to HeroUI colors
  const getHeroColor = () => {
    switch (variant) {
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'info':
        return 'primary';
      case 'default':
      default:
        return 'default';
    }
  };

  return (
    <Chip
      {...props}
      color={getHeroColor()}
      size={size}
      variant="flat"
      className={className}
      classNames={{
        base: 'font-medium',
        content: 'text-xs',
      }}
    >
      {children}
    </Chip>
  );
}
