import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/medispense/components/ui/dialog';
import { Button } from '@/medispense/components/ui/button';
import { Input } from '@/medispense/components/ui/input';
import { Label } from '@/medispense/components/ui/label';
import { Checkbox } from '@/medispense/components/ui/checkbox';
import { Switch } from '@/medispense/components/ui/switch';
import { BookOpen } from 'lucide-react';
import { DIAGNOSIS_OPTIONS } from '@/medispense/lib/diagnosis-options';
import { supabase } from '@/medispense/integrations/supabase/client';
import { useToast } from '@/medispense/hooks/use-toast';
import { logAudit } from '@/medispense/lib/audit';

interface EducationPage {
  id: string;
  title: string;
}

interface EditPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: {
    id: string;
    age: number | null;
    diagnoses: string[] | null;
    education_tools?: string[] | null;
  };
  onSaved: () => void;
}

export function EditPatientDialog({ open, onOpenChange, patient, onSaved }: EditPatientDialogProps) {
  const { toast } = useToast();
  const [age, setAge] = useState(patient.age?.toString() || '');
  const [diagnoses, setDiagnoses] = useState<string[]>(patient.diagnoses || []);
  const [educationTools, setEducationTools] = useState<string[]>((patient as any).education_tools || []);
  const [enableEducation, setEnableEducation] = useState(((patient as any).education_tools || []).length > 0);
  const [educationPages, setEducationPages] = useState<EducationPage[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('education_pages').select('id, title').order('title').then(({ data }) => {
      if (data) setEducationPages(data as EducationPage[]);
    });
  }, []);

  useEffect(() => {
    setAge(patient.age?.toString() || '');
    setDiagnoses(patient.diagnoses || []);
    setEducationTools((patient as any).education_tools || []);
    setEnableEducation(((patient as any).education_tools || []).length > 0);
  }, [patient]);

  const handleDiagnosisChange = (id: string, checked: boolean) => {
    setDiagnoses(prev => checked ? [...prev, id] : prev.filter(d => d !== id));
  };

  const handleEducationChange = (pageId: string, checked: boolean) => {
    setEducationTools(prev => checked ? [...prev, pageId] : prev.filter(id => id !== pageId));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('patients')
      .update({
        age: age ? parseInt(age) : null,
        diagnoses,
        education_tools: enableEducation ? educationTools : [],
      })
      .eq('id', patient.id);

    setSaving(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    // Log audit for diagnosis changes
    const oldDiag = (patient.diagnoses || []).sort().join(', ');
    const newDiag = diagnoses.sort().join(', ');
    if (oldDiag !== newDiag) {
      await logAudit({
        patientId: patient.id,
        entityType: 'diagnosis',
        actionType: 'update',
        fieldChanged: 'diagnoses',
        oldValue: oldDiag || 'ninguno',
        newValue: newDiag || 'ninguno',
        description: `Actualizó diagnósticos del paciente`,
      });
    }

    toast({ title: 'Paciente actualizado' });
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Paciente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-age">Edad</Label>
            <Input
              id="edit-age"
              type="number"
              min={1}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Diagnósticos</Label>
            <div className="grid sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {DIAGNOSIS_OPTIONS.map((d) => (
                <div key={d.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-${d.id}`}
                    checked={diagnoses.includes(d.id)}
                    onCheckedChange={(checked) => handleDiagnosisChange(d.id, checked as boolean)}
                  />
                  <label htmlFor={`edit-${d.id}`} className="text-sm cursor-pointer">
                    {d.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Herramientas Educativas
              </Label>
              <Switch checked={enableEducation} onCheckedChange={setEnableEducation} />
            </div>
            {enableEducation && (
              <div className="pl-2 space-y-2 border-l-2 border-primary/20 ml-2 max-h-40 overflow-y-auto">
                {educationPages.length > 0 ? (
                  educationPages.map((page) => (
                    <div key={page.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-edu-${page.id}`}
                        checked={educationTools.includes(page.id)}
                        onCheckedChange={(checked) => handleEducationChange(page.id, checked as boolean)}
                      />
                      <label htmlFor={`edit-edu-${page.id}`} className="text-sm cursor-pointer">
                        {page.title}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No hay páginas educativas creadas</p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
