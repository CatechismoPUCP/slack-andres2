import { ReactNode } from 'react';
import { useColorPreferences } from '@/providers/color-preferences';
import { cn } from '@/lib/utils';

interface MainContentProps {
  children: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  const { color } = useColorPreferences();

  const bgClass = color === 'green' 
    ? 'bg-[#0d2818]' 
    : color === 'blue' 
    ? 'bg-[#0a1829]' 
    : 'bg-background';

  return (
    <div className={cn('flex-1 min-h-screen', bgClass)}>
      {children}
    </div>
  );
}
