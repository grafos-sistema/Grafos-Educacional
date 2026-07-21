/**
 * Skip Link Component for Keyboard Navigation
 * Allows keyboard users to skip to main content
 */

'use client';

export function SkipLink() {
  const handleSkip = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleSkip}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
    >
      Pular para o conteúdo principal
    </a>
  );
}
