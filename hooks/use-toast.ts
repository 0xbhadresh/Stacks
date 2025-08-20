export type ToastVariant = 'default' | 'destructive';

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

export function useToast() {
  const toast = ({ title, description, variant = 'default' }: ToastOptions) => {
    const prefix = variant === 'destructive' ? '[Toast:ERROR]' : '[Toast]';
    if (title) console.log(prefix, title);
    if (description) console.log(description);
  };

  return { toast };
} 