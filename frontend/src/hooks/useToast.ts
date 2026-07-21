import toast from 'react-hot-toast';

export const useToast = () => {
  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const showError = (message: string) => {
    toast.error(message);
  };

  const showLoading = (message: string) => {
    return toast.loading(message);
  };

  const showInfo = (message: string) => {
    toast(message, {
      icon: 'ℹ️',
    });
  };

  const showWarning = (message: string) => {
    toast(message, {
      icon: '⚠️',
      style: {
        background: '#f59e0b',
        color: '#fff',
      },
    });
  };

  const dismiss = (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  };

  const promise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  };

  return {
    success: showSuccess,
    error: showError,
    loading: showLoading,
    info: showInfo,
    warning: showWarning,
    dismiss,
    promise,
  };
};
