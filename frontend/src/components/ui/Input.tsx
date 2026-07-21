import React, { forwardRef } from 'react';
import { Input as HeroInput, type InputProps as HeroInputProps } from './HeroInput';

export const Input = forwardRef<HTMLInputElement, HeroInputProps>(
  (props, ref) => {
    return <HeroInput ref={ref} {...props} />;
  }
);

Input.displayName = 'Input';
