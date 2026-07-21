import React from 'react';
import { Card as HeroCard, CardHeader, CardBody, CardFooter } from '@heroui/react';
import type { CardProps as HeroCardProps } from '@heroui/react';

export interface CardProps extends HeroCardProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  hoverable?: boolean;
}

export function Card({
  header,
  children,
  footer,
  hoverable = false,
  className,
  ...props
}: CardProps) {
  return (
    <HeroCard
      {...props}
      className={className}
      classNames={{
        base: [
          'bg-white dark:bg-gray-900',
          'border border-gray-200 dark:border-gray-800',
          hoverable && 'hover:shadow-lg transition-shadow duration-300',
        ].join(' '),
        header: 'border-b border-gray-200 dark:border-gray-800',
        body: 'p-6',
        footer: 'border-t border-gray-200 dark:border-gray-800',
      }}
    >
      {header && <CardHeader>{header}</CardHeader>}
      <CardBody>{children}</CardBody>
      {footer && <CardFooter>{footer}</CardFooter>}
    </HeroCard>
  );
}
