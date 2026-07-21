import React from 'react';
import { Badge as HeroBadge, type BadgeProps as HeroBadgeProps, type BadgeVariant, type BadgeSize } from './HeroBadge';

export type { BadgeVariant, BadgeSize };

interface BadgeProps extends HeroBadgeProps {
  children: React.ReactNode;
}

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  return (
    <HeroBadge
      variant={variant}
      size={size}
      {...props}
    >
      {children}
    </HeroBadge>
  );
}
