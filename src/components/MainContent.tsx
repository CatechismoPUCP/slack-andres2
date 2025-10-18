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
    <div className={cn('min-h-screen ml-[280px] lg:ml-[420px]', bgClass)}>
      {children}
    </div>
  );
}
