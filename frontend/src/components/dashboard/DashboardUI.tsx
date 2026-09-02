import type { ElementType, ReactNode } from 'react';
import Image from 'next/image';

type DashboardTone = 'blue' | 'green' | 'amber' | 'purple' | 'slate';

const toneStyles: Record<DashboardTone, { icon: string; marker: string }> = {
  blue: {
    icon: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    marker: 'bg-blue-600',
  },
  green: {
    icon: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    marker: 'bg-emerald-600',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    marker: 'bg-amber-500',
  },
  purple: {
    icon: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    marker: 'bg-violet-600',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    marker: 'bg-slate-500',
  },
};

interface DashboardStatProps {
  label: string;
  value: string | number;
  helper?: string;
  icon: ElementType;
  tone?: DashboardTone;
  onClick?: () => void;
}

export function DashboardStat({
  label,
  value,
  helper,
  icon: Icon,
  tone = 'blue',
  onClick,
}: DashboardStatProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>
        </div>
        <span className={`rounded-lg p-2.5 ${toneStyles[tone].icon}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      {helper && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{helper}</p>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      {content}
    </div>
  );
}

interface DashboardSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function DashboardSection({
  title,
  description,
  action,
  children,
  className = '',
}: DashboardSectionProps) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

interface DashboardPageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  children,
}: DashboardPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>
      {children}
    </div>
  );
}

interface DashboardEmptyProps {
  icon: ElementType;
  title: string;
  description: string;
  action?: ReactNode;
}

export function DashboardEmpty({ icon: Icon, title, description, action }: DashboardEmptyProps) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center text-center">
      <span className="mb-3 rounded-full bg-slate-100 p-3 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface DashboardAvatarProps {
  src?: string | null;
  firstName?: string;
  lastName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function DashboardAvatar({ src, firstName = '', lastName = '', size = 'md' }: DashboardAvatarProps) {
  const sizes = {
    sm: { wrapper: 'h-8 w-8 text-xs', image: '32px' },
    md: { wrapper: 'h-11 w-11 text-sm', image: '44px' },
    lg: { wrapper: 'h-16 w-16 text-lg', image: '64px' },
  };
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-50 font-semibold text-primary-700 ring-1 ring-primary-100 dark:bg-primary-950/40 dark:text-primary-300 dark:ring-primary-900 ${sizes[size].wrapper}`}
    >
      {src ? (
        <Image
          src={src}
          alt={`${firstName} ${lastName}`.trim() || 'Usuário'}
          fill
          sizes={sizes[size].image}
          className="object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}

export function DashboardStatus({ tone = 'slate', children }: { tone?: DashboardTone; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
      <span className={`h-1.5 w-1.5 rounded-full ${toneStyles[tone].marker}`} aria-hidden="true" />
      {children}
    </span>
  );
}
