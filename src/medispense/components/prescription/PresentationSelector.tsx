import { useState } from 'react';
import { Button } from '@/medispense/components/ui/button';
import { Input } from '@/medispense/components/ui/input';
import { Label } from '@/medispense/components/ui/label';
import { Badge } from '@/medispense/components/ui/badge';
import { RefreshCw, Search, Loader2, ExternalLink } from 'lucide-react';

interface PresentationOption {
  brand: string;
  presentation: string;
  lab: string;
}

interface PrescriptionItemPartial {
  tempId: string;
  medication_name: string;
  arsenalPresentation: string | null;
  useCustomPresentation: boolean;
  customPresentation: string;
}

interface PresentationSelectorProps {
  item: PrescriptionItemPartial;
  onUpdate: (updates: { useCustomPresentation?: boolean; customPresentation?: string }) => void;
}

export function PresentationSelector({ item, onUpdate }: PresentationSelectorProps) {
  const [searching, setSearching] = useState(false);
  const [options, setOptions] = useState<PresentationOption[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const searchPresentations = async () => {
    setSearching(true);
    setOptions([]);
    try {
      const medName = item.medication_name.replace(/\s*\d+[\.,]?\d*\s*(mg|mcg|g|ml|UI|u)\s*/gi, '').trim();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-presentations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ medicationName: medName, activeIngredient: medName }),
      });

      const data = await response.json();
      if (data.presentations && data.presentations.length > 0) {
        setOptions(data.presentations);
      }
    } catch (error) {
      console.error('Error searching presentations:', error);
    } finally {
      setSearching(false);
      setHasSearched(true);
    }
  };

  const selectPresentation = (opt: PresentationOption) => {
    onUpdate({
      useCustomPresentation: true,
      customPresentation: `${opt.brand} - ${opt.presentation} (${opt.lab})`,
    });
    setOptions([]);
    setHasSearched(false);
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs flex items-center gap-1">
        <RefreshCw className="h-3 w-3" />
        Presentación
      </Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={!item.useCustomPresentation ? "default" : "outline"}
          size="sm"
          className="text-xs h-8"
          onClick={() => {
            onUpdate({ useCustomPresentation: false, customPresentation: '' });
            setOptions([]);
            setHasSearched(false);
          }}
        >
          Arsenal: {item.arsenalPresentation}
        </Button>
        <Button
          type="button"
          variant={item.useCustomPresentation ? "default" : "outline"}
          size="sm"
          className="text-xs h-8"
          onClick={() => onUpdate({ useCustomPresentation: true })}
        >
          Otra
        </Button>
      </div>

      {item.useCustomPresentation && (
        <div className="space-y-2 mt-1">
          <div className="flex gap-2">
            <Input
              placeholder="Ej: Losartan Lab Chile - Comp. recubierto 50mg"
              value={item.customPresentation}
              onChange={(e) => onUpdate({ customPresentation: e.target.value })}
              className="h-8 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0"
              onClick={searchPresentations}
              disabled={searching}
            >
              {searching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Search className="h-3.5 w-3.5 mr-1" />
                  Buscar
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          {options.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-md border bg-popover p-1 space-y-0.5">
              {options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  className="w-full text-left px-2 py-1.5 rounded-sm text-sm hover:bg-accent transition-colors"
                  onClick={() => selectPresentation(opt)}
                >
                  <div className="font-medium text-xs">{opt.brand}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    {opt.presentation}
                    <span className="text-[10px]">•</span>
                    <span className="text-[10px] italic">{opt.lab}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {hasSearched && options.length === 0 && !searching && (
            <p className="text-xs text-muted-foreground italic">
              No se encontraron presentaciones. Escríbela manualmente.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
