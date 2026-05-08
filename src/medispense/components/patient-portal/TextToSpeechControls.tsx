import { Volume2, Pause, Play, Square, Gauge } from 'lucide-react';
import { Button } from '@/medispense/components/ui/button';
import { Badge } from '@/medispense/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/medispense/components/ui/dropdown-menu';
import { type SpeechSpeed, type SpeechStatus } from '@/medispense/hooks/useSpeechSynthesis';
import { cn } from '@/medispense/lib/utils';

const SPEED_LABELS: Record<SpeechSpeed, string> = {
  slow: 'Lenta',
  normal: 'Normal',
  fast: 'Rápida',
};

interface TextToSpeechControlsProps {
  isSupported: boolean;
  status: SpeechStatus;
  speed: SpeechSpeed;
  onSpeedChange: (speed: SpeechSpeed) => void;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function TextToSpeechControls({
  isSupported,
  status,
  speed,
  onSpeedChange,
  onPlay,
  onPause,
  onResume,
  onStop,
}: TextToSpeechControlsProps) {
  if (!isSupported) {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        Lectura asistida no disponible en este navegador
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {status === 'idle' && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={onPlay}
          aria-label="Escuchar página"
        >
          <Volume2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Escuchar</span>
        </Button>
      )}

      {status === 'speaking' && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1 border-primary text-primary"
          onClick={onPause}
          aria-label="Pausar lectura"
        >
          <Pause className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Pausar</span>
        </Button>
      )}

      {status === 'paused' && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1 border-warning text-warning"
          onClick={onResume}
          aria-label="Reanudar lectura"
        >
          <Play className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Reanudar</span>
        </Button>
      )}

      {status !== 'idle' && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onStop}
          aria-label="Detener lectura"
        >
          <Square className="h-3.5 w-3.5" />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 px-2"
            aria-label="Velocidad de lectura"
          >
            <Gauge className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{SPEED_LABELS[speed]}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(Object.keys(SPEED_LABELS) as SpeechSpeed[]).map((s) => (
            <DropdownMenuItem
              key={s}
              onClick={() => onSpeedChange(s)}
              className={cn(speed === s && 'font-bold text-primary')}
            >
              {SPEED_LABELS[s]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
