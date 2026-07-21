/**
 * useKeyboardFocus Hook
 *
 * Detecta quando o usuário está navegando por teclado
 * e aplica classes especiais de foco apenas nesse caso.
 *
 * Evita indicadores de foco desnecessários quando o usuário
 * clica com o mouse.
 */

'use client';

import { useEffect } from 'react';

export function useKeyboardFocus() {
  useEffect(() => {
    let isUsingKeyboard = false;

    // Detecta quando Tab é pressionado
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        isUsingKeyboard = true;
        document.body.classList.add('keyboard-nav');
      }
    };

    // Detecta quando mouse é usado
    const handleMouseDown = () => {
      isUsingKeyboard = false;
      document.body.classList.remove('keyboard-nav');
    };

    // Adiciona listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
}
