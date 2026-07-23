'use client';

import { useEffect, useRef, useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/Input';
import {
  SubjectCatalogOption,
  filterCatalogSubjects,
  isCatalogSubject,
} from '@/lib/constants/subject-options';

type SubjectNameSelectorProps = {
  value: string;
  error?: string;
  acceptInitialCustomValue?: boolean;
  onValueChange: (value: string) => void;
  onSelectSubject: (subject: SubjectCatalogOption) => void;
  onSelectCustomValue: (value: string) => void;
};

export function SubjectNameSelector({
  value,
  error,
  acceptInitialCustomValue = false,
  onValueChange,
  onSelectSubject,
  onSelectCustomValue,
}: SubjectNameSelectorProps) {
  const trimmedValue = value.trim();
  const containerRef = useRef<HTMLDivElement>(null);
  const [acceptedCustomValue, setAcceptedCustomValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const filteredSubjects = filterCatalogSubjects(value).slice(0, 12);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (
      acceptInitialCustomValue &&
      trimmedValue &&
      !isCatalogSubject(trimmedValue) &&
      !acceptedCustomValue
    ) {
      setAcceptedCustomValue(trimmedValue);
    }
  }, [acceptInitialCustomValue, acceptedCustomValue, trimmedValue]);

  useEffect(() => {
    if (
      acceptedCustomValue &&
      trimmedValue &&
      trimmedValue !== acceptedCustomValue
    ) {
      setAcceptedCustomValue('');
    }

    if (!trimmedValue) {
      setAcceptedCustomValue('');
    }
  }, [acceptedCustomValue, trimmedValue]);

  const shouldShowCustomOption =
    Boolean(trimmedValue) &&
    !isCatalogSubject(trimmedValue) &&
    trimmedValue !== acceptedCustomValue;
  const shouldShowDropdown =
    isOpen && (filteredSubjects.length > 0 || shouldShowCustomOption || !trimmedValue);

  return (
    <div ref={containerRef} className="w-full">
      <Input
        label="Nome"
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
        error={error}
        placeholder="Pesquise e selecione uma disciplina"
        required
      />

      {shouldShowDropdown && (
        <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 shadow-sm">
          <div className="max-h-64 overflow-y-auto p-2">
            {filteredSubjects.length > 0 || shouldShowCustomOption ? (
              <div className="space-y-1">
                {filteredSubjects.map((subject) => (
                  <button
                    key={subject.name}
                    type="button"
                    onClick={() => {
                      setAcceptedCustomValue('');
                      setIsOpen(false);
                      onSelectSubject(subject);
                    }}
                    className={`w-full rounded-md px-3 py-2 text-left transition-colors ${
                      value === subject.name
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="font-medium">{subject.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Código sugerido: {subject.code}
                    </div>
                  </button>
                ))}

                {shouldShowCustomOption && (
                  <button
                    type="button"
                    onClick={() => {
                      setAcceptedCustomValue(trimmedValue);
                      setIsOpen(false);
                      onSelectCustomValue(trimmedValue);
                    }}
                    className="w-full rounded-md border border-dashed border-primary-300 px-3 py-3 text-left transition-colors text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-900/20"
                  >
                    <div className="font-medium">Cadastrar "{trimmedValue}"</div>
                    <div className="text-xs text-primary-600/80 dark:text-primary-300/80">
                      Use o nome digitado e mantenha o c&oacute;digo sugerido edit&aacute;vel.
                    </div>
                  </button>
                )}
              </div>
            ) : (
              <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                Digite para pesquisar uma disciplina do cat&aacute;logo.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
