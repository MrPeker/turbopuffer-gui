import { toast as sonnerToast } from 'sonner';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

// Wrapper to support shadcn/ui toast API with sonner
function toast(props: ToastProps | string) {
  if (typeof props === 'string') {
    return sonnerToast(props);
  }

  const { title, description, variant } = props;
  const message = title || description || '';
  const options = description && title ? { description } : undefined;

  if (variant === 'destructive') {
    return sonnerToast.error(message, options);
  }

  return sonnerToast.success(message, options);
}

export function useToast() {
  return { toast };
}