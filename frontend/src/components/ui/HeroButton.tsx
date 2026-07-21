import React from 'react';
import { Button as HeroButton } from '@heroui/react';
import type { ButtonProps as HeroButtonProps } from '@heroui/react';

export interface ButtonProps extends Omit<HeroButtonProps, 'size' | 'variant' | 'color'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  children,
  className,
  isLoading,
  ...props
}: ButtonProps) {
  // Map custom variants to HeroUI variants
  const getHeroVariant = () => {
    switch (variant) {
      case 'primary':
        return 'solid';
      case 'secondary':
        return 'flat';
      case 'outline':
        return 'bordered';
      case 'ghost':
        return 'light';
      case 'danger':
        return 'solid';
      default:
        return 'solid';
    }
  };

  const getHeroColor = () => {
    switch (variant) {
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'default';
      case 'outline':
        return 'primary';
      case 'ghost':
        return 'default';
      case 'danger':
        return 'danger';
      default:
        return 'primary';
    }
  };

  return (
    <HeroButton
      {...props}
      size={size}
      variant={getHeroVariant()}
      color={getHeroColor()}
      isLoading={isLoading}
      startContent={leftIcon}
      endContent={rightIcon}
      className={className}
      classNames={{
        base: 'font-medium',
      }}
    >
      {children}
    </HeroButton>
  );
}
