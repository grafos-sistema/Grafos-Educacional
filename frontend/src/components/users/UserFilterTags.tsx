import { cn } from '@/lib/utils';

type UserFilterTagsProps = {
  isActive?: boolean;
  onStatusChange: (value: boolean | undefined) => void;
  hasProfile?: boolean;
  onProfileChange?: (value: boolean | undefined) => void;
};

const tagClass =
  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30';

export function UserFilterTags({
  isActive,
  onStatusChange,
  hasProfile,
  onProfileChange,
}: UserFilterTagsProps) {
  const statusTags = [
    { label: 'Todos', value: undefined },
    { label: 'Ativos', value: true },
    { label: 'Inativos', value: false },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Filtros rápidos">
      <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Filtros rápidos
      </span>
      {statusTags.map((tag) => {
        const selected = isActive === tag.value;
        return (
          <button
            key={tag.label}
            type="button"
            aria-pressed={selected}
            onClick={() => onStatusChange(tag.value)}
            className={cn(
              tagClass,
              selected
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-primary-700 dark:hover:text-primary-300',
            )}
          >
            {tag.label}
          </button>
        );
      })}
      {onProfileChange && (
        <>
          <span className="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
          {[{ label: 'Com perfil', value: true }, { label: 'Sem perfil', value: false }].map((tag) => {
            const selected = hasProfile === tag.value;
            return (
              <button
                key={tag.label}
                type="button"
                aria-pressed={selected}
                onClick={() => onProfileChange(tag.value)}
                className={cn(
                  tagClass,
                  selected
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-primary-700 dark:hover:text-primary-300',
                )}
              >
                {tag.label}
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}
