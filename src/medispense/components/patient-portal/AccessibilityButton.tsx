import { useState } from 'react';
import { Settings2, Plus, Minus, Palette } from 'lucide-react';
import { Button } from '@/medispense/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/medispense/components/ui/popover';
import { Label } from '@/medispense/components/ui/label';

const COLOR_THEMES: { id: string; label: string; bg: string; filterValue: string }[] = [
  { id: 'default', label: 'Normal', bg: 'bg-primary', filterValue: '' },
  { id: 'high-contrast', label: 'Alto contraste', bg: 'bg-foreground', filterValue: 'contrast(1.4)' },
  { id: 'warm', label: 'Cálido', bg: 'bg-warning', filterValue: 'sepia(0.3)' },
  { id: 'cool', label: 'Frío', bg: 'bg-blue-500', filterValue: 'hue-rotate(20deg)' },
];

interface AccessibilityState {
  fontSize: number; // 0 = default, 1 = large, 2 = extra large
  theme: string;
}

export function AccessibilityButton() {
  const [state, setState] = useState<AccessibilityState>({
    fontSize: 0,
    theme: 'default',
  });

  const applyFontSize = (level: number) => {
    const root = document.documentElement;
    const sizes = ['100%', '115%', '130%'];
    root.style.fontSize = sizes[level] || '100%';
    setState(prev => ({ ...prev, fontSize: level }));
  };

  const applyTheme = (themeId: string) => {
    const main = document.querySelector('main') as HTMLElement;
    if (!main) return;
    const theme = COLOR_THEMES.find(t => t.id === themeId);
    main.style.filter = theme?.filterValue || '';
    setState(prev => ({ ...prev, theme: themeId }));
    setState(prev => ({ ...prev, theme: themeId }));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full shadow-md border-2"
          aria-label="Opciones de accesibilidad"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 space-y-3" align="end">
        <p className="text-sm font-semibold">Accesibilidad</p>

        {/* Font Size */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tamaño de letra</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={state.fontSize === 0}
              onClick={() => applyFontSize(Math.max(0, state.fontSize - 1))}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="text-sm font-medium flex-1 text-center">
              {state.fontSize === 0 ? 'Normal' : state.fontSize === 1 ? 'Grande' : 'Extra grande'}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={state.fontSize === 2}
              onClick={() => applyFontSize(Math.min(2, state.fontSize + 1))}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Color Theme */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tonos de color</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {COLOR_THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => applyTheme(theme.id)}
                className={`flex items-center gap-1.5 p-1.5 rounded-md text-xs transition-colors border ${
                  state.theme === theme.id
                    ? 'border-primary bg-primary/10 font-medium'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <div className={`h-3 w-3 rounded-full ${theme.bg} shrink-0`} />
                {theme.label}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
