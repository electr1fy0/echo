import { Toast } from "@base-ui/react/toast";

export const toastManager = Toast.createToastManager();

interface ToastOptions {
  action?: {
    label: string;
    onClick: () => void;
  };
  [key: string]: any;
}

const transformOptions = (options?: ToastOptions): any => {
  if (!options) return {};
  const { action, ...rest } = options;
  if (action) {
    return {
      ...rest,
      actionProps: {
        children: action.label,
        onClick: action.onClick,
      },
    };
  }
  return options;
};

export const toast = {
  success: (description: string, options?: ToastOptions) =>
    toastManager.add({
      description,
      type: "success",
      ...transformOptions(options),
    }),
  error: (description: string, options?: ToastOptions) =>
    toastManager.add({
      description,
      type: "error",
      ...transformOptions(options),
    }),
  info: (description: string, options?: ToastOptions) =>
    toastManager.add({
      description,
      type: "info",
      ...transformOptions(options),
    }),
  warning: (description: string, options?: ToastOptions) =>
    toastManager.add({
      description,
      type: "warning",
      ...transformOptions(options),
    }),
  custom: (options: ToastOptions) =>
    toastManager.add(transformOptions(options)),
};
