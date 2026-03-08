// Simplified use-toast for rapid development
// In a real app, this would be the full shadcn/ui toast implementation

export const useToast = () => {
  const toast = ({ title, description, variant }: { title: string; description: string; variant?: "default" | "destructive" }) => {
    console.log(`[TOAST] ${variant || 'default'}: ${title} - ${description}`);
    // Optional: use browser alert for destructive errors if critical
    // if (variant === 'destructive') alert(`${title}: ${description}`);
  };

  return { toast };
};
