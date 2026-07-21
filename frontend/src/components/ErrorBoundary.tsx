'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Você pode enviar para um serviço de monitoramento aqui
    // Ex: Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Algo deu errado
              </h1>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Desculpe, ocorreu um erro inesperado. Nossa equipe foi notificada e estamos trabalhando para resolver o problema.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
                  <p className="text-sm font-mono text-red-800 dark:text-red-300 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={this.handleReset}
                  variant="primary"
                  leftIcon={<ArrowPathIcon className="h-5 w-5" />}
                  className="w-full"
                >
                  Tentar Novamente
                </Button>

                <Button
                  onClick={() => window.location.href = '/'}
                  variant="secondary"
                  className="w-full"
                >
                  Voltar para Página Inicial
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para resetar error boundary
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
}
