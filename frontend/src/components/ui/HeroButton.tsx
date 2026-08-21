import React from 'react';
import { Button as HeroButton } from '@heroui/react';
import type { ButtonProps as HeroButtonProps } from '@heroui/react';
import { cn } from '@/lib/utils';

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

  const baseClasses = cn(
    'inline-flex min-w-fit items-center justify-center gap-2 whitespace-nowrap',
    '!rounded-lg border font-semibold leading-5 shadow-sm',
    'transition-all duration-150 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none',
    'data-[loading=true]:cursor-wait',
    {
      'min-h-9 px-3 py-2 text-sm': size === 'sm',
      'min-h-10 px-4 py-2 text-sm': size === 'md',
      'min-h-11 px-5 py-2.5 text-base': size === 'lg',
      'border-primary-500 !bg-primary-500 !text-white hover:!bg-primary-600 active:!bg-primary-700':
        variant === 'primary',
      'border-secondary-200 !bg-secondary-100 text-secondary-800 hover:!bg-secondary-200 active:!bg-secondary-300':
        variant === 'secondary',
      'border-primary-500 !bg-white text-primary-700 hover:!bg-primary-50 active:!bg-primary-100':
        variant === 'outline',
      'border-secondary-200 !bg-white text-secondary-700 hover:!bg-secondary-50 active:!bg-secondary-100':
        variant === 'ghost',
      'border-danger-500 !bg-danger-500 !text-white hover:!bg-danger-600 active:!bg-danger-700':
        variant === 'danger',
    },
    className
  );

  return (
    <HeroButton
      {...props}
      // Buttons inside forms must opt into submit explicitly. This prevents
      // navigation, tab and helper buttons from saving a form accidentally.
      type={props.type ?? 'button'}
      size={size}
      variant={getHeroVariant()}
      color={getHeroColor()}
      isLoading={isLoading}
      startContent={leftIcon}
      endContent={rightIcon}
      className={baseClasses}
      classNames={{
        base: baseClasses,
      }}
    >
      {children}
    </HeroButton>
  );
}
