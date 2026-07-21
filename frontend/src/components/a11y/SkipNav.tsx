/**
 * Skip Navigation Component
 *
 * Permite que usuários de teclado e screen readers pulem
 * diretamente para o conteúdo principal, navegação ou rodapé.
 *
 * Segue as diretrizes WCAG 2.1 AA para acessibilidade.
 */

'use client';

export function SkipNav() {
  return (
    <div className="sr-only-focusable">
      <a
        href="#main-content"
        className="absolute left-0 top-0 z-[10000] -translate-x-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white no-underline rounded-br-md shadow-lg transition-transform focus:translate-x-0 focus:outline focus:outline-[3px] focus:outline-amber-400 focus:outline-offset-2"
      >
        Pular para o conteúdo principal
      </a>
      <a
        href="#navigation"
        className="absolute left-0 top-12 z-[10000] -translate-x-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white no-underline rounded-br-md shadow-lg transition-transform focus:translate-x-0 focus:outline focus:outline-[3px] focus:outline-amber-400 focus:outline-offset-2"
      >
        Pular para a navegação
      </a>
    </div>
  );
}
