'use client';

import { useState, useRef, useEffect, forwardRef } from 'react';
import { MagnifyingGlassIcon, MapPinIcon, BuildingOffice2Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/20/solid';

export interface Institution {
  id: string;
  name: string;
  slug?: string;
  city?: string;
  state?: string;
}

interface InstitutionSearchProps {
  institutions: Institution[];
  value?: string;
  onChange: (institutionId: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export const InstitutionSearch = forwardRef<HTMLInputElement, InstitutionSearchProps>(
  (
    {
      institutions,
      value,
      onChange,
      label,
      error,
      required,
      isLoading,
      placeholder = 'Buscar instituição por nome ou cidade...',
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLUListElement>(null);

    const selectedInstitution = institutions.find((inst) => inst.id === value);

    // Filtrar instituições baseado na busca
    const filteredInstitutions = institutions.filter((inst) => {
      const query = searchQuery.toLowerCase();
      return (
        inst.name.toLowerCase().includes(query) ||
        inst.city?.toLowerCase().includes(query) ||
        inst.state?.toLowerCase().includes(query) ||
        inst.slug?.toLowerCase().includes(query)
      );
    });

    // Fechar dropdown ao clicar fora
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll para item destacado
    useEffect(() => {
      if (isOpen && dropdownRef.current) {
        const highlightedElement = dropdownRef.current.children[highlightedIndex] as HTMLElement;
        if (highlightedElement) {
          highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }, [highlightedIndex, isOpen]);

    const handleSelect = (institutionId: string) => {
      onChange(institutionId);
      setIsOpen(false);
      setSearchQuery('');
      setHighlightedIndex(0);
    };

    const handleClear = () => {
      onChange('');
      setSearchQuery('');
      setIsOpen(false);
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
        setIsOpen(true);
        return;
      }

      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredInstitutions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredInstitutions[highlightedIndex]) {
            handleSelect(filteredInstitutions[highlightedIndex].id);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    };

    // Destacar texto da busca
    const highlightText = (text: string, query: string) => {
      if (!query) return text;
      const parts = text.split(new RegExp(`(${query})`, 'gi'));
      return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 font-semibold">
            {part}
          </mark>
        ) : (
          part
        )
      );
    };

    return (
      <div ref={containerRef} className="relative w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
            {required && <span className="text-red-600 ml-1" aria-label="obrigatório">*</span>}
          </label>
        )}

        {/* Input / Selected Display */}
        <div className="relative">
          <div
            className={`relative flex items-center w-full rounded-xl border-2 transition-all ${
              isOpen
                ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900'
                : error
                ? 'border-red-300 dark:border-red-600'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            } ${isLoading ? 'opacity-50' : ''}`}
          >
            {/* Ícone de busca */}
            <div className="absolute left-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>

            {/* Input de busca / Display de selecionado */}
            {isOpen || !selectedInstitution ? (
              <input
                ref={inputRef}
                type="text"
                className="w-full pl-10 pr-10 py-3 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsOpen(true);
                  setHighlightedIndex(0);
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-controls="institution-listbox"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(true);
                  setTimeout(() => inputRef.current?.focus(), 0);
                }}
                className="w-full pl-10 pr-10 py-3 text-left focus:outline-none"
              >
                <div className="flex items-center gap-2">
                  <BuildingOffice2Icon className="h-5 w-5 text-primary-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {selectedInstitution.name}
                    </p>
                    {selectedInstitution.city && selectedInstitution.state && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <MapPinIcon className="h-3 w-3" />
                        {selectedInstitution.city} - {selectedInstitution.state}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            )}

            {/* Botão de limpar */}
            {selectedInstitution && !isOpen && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Limpar seleção"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Dropdown com resultados */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-80 overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-3 text-sm text-gray-500">Carregando instituições...</p>
                </div>
              ) : filteredInstitutions.length === 0 ? (
                <div className="p-8 text-center">
                  <BuildingOffice2Icon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Nenhuma instituição encontrada
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tente buscar por outro nome ou cidade
                  </p>
                </div>
              ) : (
                <>
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {filteredInstitutions.length} {filteredInstitutions.length === 1 ? 'instituição encontrada' : 'instituições encontradas'}
                    </p>
                  </div>
                  <ul
                    ref={dropdownRef}
                    role="listbox"
                    id="institution-listbox"
                    className="overflow-y-auto max-h-64 divide-y divide-gray-100 dark:divide-gray-700"
                  >
                    {filteredInstitutions.map((institution, index) => {
                      const isSelected = institution.id === value;
                      const isHighlighted = index === highlightedIndex;

                      return (
                        <li
                          key={institution.id}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelect(institution.id)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          className={`px-4 py-3 cursor-pointer transition-colors ${
                            isHighlighted
                              ? 'bg-primary-50 dark:bg-primary-900/30'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {isSelected ? (
                                <div className="h-5 w-5 rounded-full bg-primary-600 flex items-center justify-center">
                                  <CheckIcon className="h-3 w-3 text-white" />
                                </div>
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${
                                isSelected
                                  ? 'text-primary-700 dark:text-primary-300'
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {highlightText(institution.name, searchQuery)}
                              </p>
                              {institution.city && institution.state && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                  <MapPinIcon className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {highlightText(`${institution.city} - ${institution.state}`, searchQuery)}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>

        {/* Input hidden para react-hook-form */}
        <input
          ref={ref}
          type="hidden"
          value={value || ''}
          aria-invalid={!!error}
        />

        {/* Mensagem de erro */}
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        {/* Helper text */}
        {!error && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Use as setas ↑↓ para navegar e Enter para selecionar
          </p>
        )}
      </div>
    );
  }
);

InstitutionSearch.displayName = 'InstitutionSearch';
