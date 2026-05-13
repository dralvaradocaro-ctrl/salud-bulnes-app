import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserCircle2, Pencil } from 'lucide-react';
import { getSdmEditor, setSdmEditor } from './lib/sdmEditHistory';

const EXTRAS = ['Secretaría SDM', 'Subdirección Médica'];

/**
 * Picker compacto que muestra "Editando como: <nombre> [cambiar]".
 * Si no hay nombre seteado, se ve resaltado en ámbar y obliga a elegir.
 * Doctores se reciben por prop; al elegir uno se usa display_name. Tambien
 * permite ingresar un nombre libre (administrativos, otros).
 */
export default function SdmEditorPicker({ doctors = [] }) {
  const [editor, setEditor] = useState(getSdmEditor());
  const [editing, setEditing] = useState(!getSdmEditor());
  const [freeText, setFreeText] = useState('');

  useEffect(() => {
    setSdmEditor(editor);
  }, [editor]);

  const choices = [
    ...doctors.map(d => d.display_name).filter(Boolean),
    ...EXTRAS,
  ];
  const choicesUnique = Array.from(new Set(choices));

  const commitFreeText = () => {
    const v = freeText.trim();
    if (!v) return;
    setEditor(v);
    setEditing(false);
    setFreeText('');
  };

  if (!editor || editing) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 sdm-print-hide">
        <UserCircle2 className="h-4 w-4 text-amber-700" />
        <span className="text-xs font-semibold text-amber-900">Editando como:</span>
        <Select value="" onValueChange={v => { setEditor(v); setEditing(false); }}>
          <SelectTrigger className="h-7 text-xs w-48"><SelectValue placeholder="Elegir nombre" /></SelectTrigger>
          <SelectContent>
            {choicesUnique.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          className="h-7 text-xs w-40"
          placeholder="o escribir libre"
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commitFreeText(); }}
        />
        <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={commitFreeText} disabled={!freeText.trim()}>OK</Button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-600 sdm-print-hide">
      <UserCircle2 className="h-4 w-4 text-slate-500" />
      <span>Editando como:</span>
      <span className="font-semibold text-slate-800">{editor}</span>
      <button
        onClick={() => setEditing(true)}
        className="text-[10px] text-slate-400 hover:text-blue-600 inline-flex items-center gap-0.5"
        title="Cambiar editor"
      >
        <Pencil className="h-3 w-3" /> cambiar
      </button>
    </div>
  );
}
