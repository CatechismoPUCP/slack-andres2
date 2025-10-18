import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { useColorPreferences } from '@/providers/color-preferences';
import { Sun, Moon, Monitor } from 'lucide-react';

interface PreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PreferencesDialog({ open, onOpenChange }: PreferencesDialogProps) {
  const { theme, setTheme } = useTheme();
  const { color, selectColor } = useColorPreferences();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Preferences</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => setTheme('light')}
                  className="w-full"
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => setTheme('dark')}
                  className="w-full"
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  onClick={() => setTheme('system')}
                  className="w-full"
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  System
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="colors" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Color Accent</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={color === 'green' ? 'default' : 'outline'}
                  onClick={() => selectColor('green')}
                  className="w-full"
                >
                  <div className="w-4 h-4 rounded-full bg-green-500 mr-2" />
                  Green
                </Button>
                <Button
                  variant={color === 'blue' ? 'default' : 'outline'}
                  onClick={() => selectColor('blue')}
                  className="w-full"
                >
                  <div className="w-4 h-4 rounded-full bg-blue-500 mr-2" />
                  Blue
                </Button>
                <Button
                  variant={color === '' ? 'default' : 'outline'}
                  onClick={() => selectColor('')}
                  className="w-full"
                >
                  Reset
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
