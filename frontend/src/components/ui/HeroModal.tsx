import React from 'react';
import {
  Modal as HeroModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import type { ModalProps as HeroModalProps } from '@heroui/react';

export interface ModalProps extends Omit<HeroModalProps, 'children'> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  ...props
}: ModalProps) {
  return (
    <HeroModal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      scrollBehavior="inside"
      classNames={{
        base: 'bg-white dark:bg-gray-900',
        header: 'border-b border-gray-200 dark:border-gray-800',
        body: 'py-6',
        footer: 'border-t border-gray-200 dark:border-gray-800',
      }}
      {...props}
    >
      <ModalContent>
        {title && (
          <ModalHeader className="flex flex-col gap-1 text-xl font-semibold">
            {title}
          </ModalHeader>
        )}
        <ModalBody>{children}</ModalBody>
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </ModalContent>
    </HeroModal>
  );
}
