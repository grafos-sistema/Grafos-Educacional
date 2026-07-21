/**
 * Accessibility (A11y) Utilities
 *
 * Helpers for improving accessibility across the application
 */

/**
 * Generate a unique ID for ARIA attributes
 *
 * @example
 * const id = generateId('input');
 * // Returns: 'input-abc123'
 */
let idCounter = 0;
export function generateId(prefix = 'id'): string {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now()}`;
}

/**
 * Get ARIA props for form field with error
 *
 * @example
 * <input {...getFieldAriaProps('email', error, helpText)} />
 */
export function getFieldAriaProps(
  name: string,
  error?: string,
  helpText?: string
) {
  const id = `field-${name}`;
  const errorId = error ? `${id}-error` : undefined;
  const helpId = helpText ? `${id}-help` : undefined;

  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

  return {
    id,
    'aria-invalid': error ? ('true' as const) : undefined,
    'aria-describedby': describedBy,
    'aria-required': undefined, // Set explicitly in component
  };
}

/**
 * Create screen reader only text
 *
 * @example
 * <span className={srOnly()}>Close dialog</span>
 */
export function srOnly(): string {
  return 'sr-only'; // Assumes Tailwind CSS sr-only class exists
}

/**
 * Get ARIA props for a button that controls another element
 *
 * @example
 * <button {...getButtonAriaProps('menu', isOpen)}>Menu</button>
 */
export function getButtonAriaProps(
  controlsId: string,
  expanded: boolean
) {
  return {
    'aria-expanded': expanded,
    'aria-controls': controlsId,
    'aria-haspopup': 'true' as const,
  };
}

/**
 * Get ARIA props for modal/dialog
 *
 * @example
 * <div {...getModalAriaProps('Confirm deletion', 'delete-modal')}>
 */
export function getModalAriaProps(
  title: string,
  id?: string,
  description?: string
) {
  const modalId = id || generateId('modal');
  const titleId = `${modalId}-title`;
  const descId = description ? `${modalId}-desc` : undefined;

  return {
    role: 'dialog' as const,
    'aria-modal': 'true' as const,
    'aria-labelledby': titleId,
    'aria-describedby': descId,
    titleId,
    descId,
  };
}

/**
 * Focus trap helper for modals
 *
 * @example
 * const trapRef = useFocusTrap(isOpen);
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

/**
 * Trap focus within an element (for modals)
 */
export function createFocusTrap(container: HTMLElement) {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Focus first element on mount
  firstElement?.focus();

  // Cleanup
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Announce message to screen readers
 *
 * @example
 * announceToScreenReader('5 new messages');
 */
export function announceToScreenReader(
  message: string,
  politeness: 'polite' | 'assertive' = 'polite'
) {
  if (typeof document === 'undefined') return;

  const announcer = document.createElement('div');
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', politeness);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;

  document.body.appendChild(announcer);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
}

/**
 * Check if element is visible to screen readers
 */
export function isVisibleToScreenReaders(element: HTMLElement): boolean {
  return (
    element.getAttribute('aria-hidden') !== 'true' &&
    !element.hasAttribute('hidden') &&
    element.style.display !== 'none' &&
    element.style.visibility !== 'hidden'
  );
}

/**
 * Get keyboard navigation props for list items
 *
 * @example
 * <div {...getListItemKeyboardProps(index, handleSelect)}>
 */
export function getListItemKeyboardProps(
  index: number,
  onSelect: (index: number) => void,
  total: number
) {
  return {
    role: 'option' as const,
    tabIndex: 0,
    'aria-posinset': index + 1,
    'aria-setsize': total,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(index);
      }
    },
  };
}

/**
 * Create skip link props
 *
 * @example
 * <a {...getSkipLinkProps('main-content')}>Skip to main content</a>
 */
export function getSkipLinkProps(targetId: string) {
  return {
    href: `#${targetId}`,
    className: 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-primary-600 focus:text-white',
    onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    },
  };
}

/**
 * Validate color contrast ratio (WCAG 2.1)
 *
 * @example
 * const hasGoodContrast = checkContrast('#000000', '#ffffff'); // true
 */
export function getLuminance(hexColor: string): number {
  const rgb = parseInt(hexColor.slice(1), 16);
  const r = ((rgb >> 16) & 0xff) / 255;
  const g = ((rgb >> 8) & 0xff) / 255;
  const b = (rgb & 0xff) / 255;

  const [rs, gs, bs] = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWCAGAA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 4.5;
}

export function meetsWCAGAAA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 7;
}

/**
 * Format numbers for screen readers
 *
 * @example
 * formatNumberForScreenReader(1234567) // "1,234,567"
 */
export function formatNumberForScreenReader(num: number): string {
  return new Intl.NumberFormat('pt-BR').format(num);
}

/**
 * Format date for screen readers
 *
 * @example
 * formatDateForScreenReader(new Date()) // "15 de novembro de 2025"
 */
export function formatDateForScreenReader(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
