import React from 'react';
import {
  Dropdown as HeroDropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';

export interface DropdownMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
}

export function Dropdown({ trigger, items, ...props }: DropdownProps) {
  return (
    <HeroDropdown {...props}>
      <DropdownTrigger>{trigger}</DropdownTrigger>
      <DropdownMenu
        aria-label="Menu options"
        classNames={{
          base: [
            'bg-white dark:bg-gray-800',
            'border border-gray-200 dark:border-gray-700',
            'shadow-lg',
            'rounded-lg',
            'p-1',
          ].join(' '),
          list: 'bg-white dark:bg-gray-800',
        }}
      >
        {items.map((item) => (
          <DropdownItem
            key={item.key}
            startContent={item.icon}
            onPress={item.onClick}
            isDisabled={item.disabled}
            color={item.color}
            className="rounded-md"
          >
            {item.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </HeroDropdown>
  );
}
