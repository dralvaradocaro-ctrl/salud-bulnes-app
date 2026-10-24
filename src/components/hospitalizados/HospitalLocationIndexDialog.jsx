import { useEffect, useState } from 'react';
import { BedDouble } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PatientLocationFields, {
  EMPTY_PATIENT_LOCATION,
  describePatientLocation,
  isPatientLocationComplete,
  useHospitalLocations,
} from '@/components/hospitalizados/PatientLocationFields';

export default function HospitalLocationIndexDialog({
  open,
  title,
  description,
  actionLabel = 'Guardar e imprimir',
  initialValue = null,
  onClose,
  onSave,
  onCompleted,
}) {
  const { locations, loading, error } = useHospitalLocations(open);
  const [value, setValue] = useState(EMPTY_PATIENT_LOCATION);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValue({ ...EMPTY_PATIENT_LOCATION, ...initialValue }); setMessage(''); setDone(false);
    // Solo al abrir: lo que se escriba después en el diálogo no debe pisarse.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const ready = isPatientLocationComplete(value) && !saving;

  const submit = async () => {
    setSaving(true); setMessage('');
    try {
      await onSave({ service: value.service, bedCode: value.bedCode, patientName: value.name.trim(), patientRut: value.rut.trim() });
      // El mensaje es siempre el mismo: no debe dejar entrever si la cama ya
      // tenía un paciente cargado ni quién era.
      setMessage('Resultado guardado. Quedará disponible para el médico en la ficha de la cama.');
      setDone(true);
      onCompleted?.(describePatientLocation(value, locations));
    } catch (saveError) {
      setMessage(saveError?.message || 'No fue posible guardar el resultado.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-2xl">
        <header className="flex items-start gap-3 border-b border-emerald-200 bg-emerald-50 p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-800"><BedDouble className="h-5 w-5" /></span>
          <div>
            <h3 className="font-black text-slate-950">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
        </header>

        <div className="space-y-4 p-5">
          <PatientLocationFields value={value} onChange={next => { setValue(next); setMessage(''); }} locations={locations} loading={loading} disabled={saving || done} />

          {(message || error) && (
            <div className={`rounded-lg border p-3 text-sm font-semibold ${done ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
              {message || error}
            </div>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>{done ? 'Cerrar' : 'Cancelar'}</Button>
          {!done && (
            <Button type="button" onClick={submit} disabled={!ready} className="bg-emerald-700 hover:bg-emerald-800">
              {saving ? 'Guardando…' : actionLabel}
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}
