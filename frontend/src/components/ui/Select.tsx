import React, { forwardRef } from 'react';
import { Select as HeroSelect, type SelectProps as HeroSelectProps, type SelectOption } from './HeroSelect';

export type { SelectOption };

interface SelectProps extends Omit<HeroSelectProps, 'options'> {
  options: Array<{ value: string | number; label: string; disabled?: boolean }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, ...props }, ref) => {
    // Convert options to string values
    const heroOptions = options.map(opt => ({
      value: String(opt.value),
      label: opt.label,
      disabled: opt.disabled,
    }));

    return <HeroSelect ref={ref} options={heroOptions} {...props} />;
  }
);

Select.displayName = 'Select';
