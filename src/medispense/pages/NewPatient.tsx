import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/medispense/components/ui/card';
import { Input } from '@/medispense/components/ui/input';
import { Button } from '@/medispense/components/ui/button';
import { Label } from '@/medispense/components/ui/label';
import { Checkbox } from '@/medispense/components/ui/checkbox';
import { Switch } from '@/medispense/components/ui/switch';
import { ArrowLeft, UserPlus, AlertCircle, BookOpen } from 'lucide-react';
import { useToast } from '@/medispense/hooks/use-toast';
import { supabase } from '@/medispense/integrations/supabase/client';
import { useAuth } from '@/medispense/contexts/AuthContext';
import { Alert, AlertDescription } from '@/medispense/components/ui/alert';
import { DIAGNOSIS_OPTIONS } from '@/medispense/lib/diagnosis-options';

// Validate patient code format: 2 letters + 2 digits + hyphen + 1 alphanumeric
const PATIENT_CODE_REGEX = /^[A-Za-z]{2}\d{2}-[A-Za-z0-9]$/;

interface EducationPage {
  id: string;
  title: string;
}

export default function NewPatient() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [educationPages, setEducationPages] = useState<EducationPage[]>([]);
  const [enableEducation, setEnableEducation] = useState(false);
  
  const [formData, setFormData] = useState({
    patientCode: '',
    age: '',
    diagnoses: [] as string[],
    educationTools: [] as string[],
  });

  useEffect(() => {
    supabase.from('education_pages').select('id, title').order('title').then(({ data }) => {
      if (data) setEducationPages(data as EducationPage[]);
    });
  }, []);

  const isValidCode = PATIENT_CODE_REGEX.test(formData.patientCode);

  const handleDiagnosisChange = (diagnosisId: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, diagnoses: [...formData.diagnoses, diagnosisId] });
    } else {
      setFormData({ ...formData, diagnoses: formData.diagnoses.filter(d => d !== diagnosisId) });
    }
  };

  const handleEducationChange = (pageId: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, educationTools: [...formData.educationTools, pageId] });
    } else {
      setFormData({ ...formData, educationTools: formData.educationTools.filter(id => id !== pageId) });
    }
  };

  const formatPatientCode = (value: string): string => {
    let clean = value.replace(/-/g, '').toUpperCase();
    if (clean.length > 5) clean = clean.slice(0, 5);
    if (clean.length >= 5) return `${clean.slice(0, 4)}-${clean.slice(4)}`;
    else if (clean.length === 4) return `${clean}-`;
    return clean;
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPatientCode(e.target.value);
    setFormData({ ...formData, patientCode: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientCode || !isValidCode) {
      toast({ title: 'Error', description: 'Ingresa un código de paciente válido (Ej: FC67-3)', variant: 'destructive' });
      return;
    }

    if (!formData.age) {
      toast({ title: 'Error', description: 'La edad es requerida', variant: 'destructive' });
      return;
    }

    if (!user) {
      toast({ title: 'Error', description: 'Debes iniciar sesión', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const patientCode = formData.patientCode.toUpperCase();

    const { error } = await supabase.from('patients').insert({
      patient_code: patientCode,
      full_name: `Paciente ${patientCode}`,
      age: parseInt(formData.age),
      diagnoses: formData.diagnoses,
      education_tools: enableEducation ? formData.educationTools : [],
      created_by: user.id,
    });

    setIsSubmitting(false);

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Error', description: 'Ya existe un paciente con este código', variant: 'destructive' });
      } else {
        toast({ title: 'Error al crear paciente', description: error.message, variant: 'destructive' });
      }
      return;
    }
    
    toast({ title: 'Paciente creado', description: `Código de paciente: ${patientCode}` });
    navigate(`/patients/${patientCode}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/PrescripcionInteligente/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Paciente</h1>
          <p className="text-muted-foreground">Registra un nuevo paciente en el sistema</p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Confidencialidad:</strong> Por seguridad, solo se almacena el código identificador.
          El médico debe generar y registrar el código según el formato establecido.
        </AlertDescription>
      </Alert>

      <Card className="shadow-medical">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Datos del Paciente
          </CardTitle>
          <CardDescription>
            Formato del código: <strong>AB12-X</strong> (Iniciales + 2 últimos dígitos RUT + verificador)
            <br />
            Ejemplo: Pedro Castillo con RUT 4789567-3 → <strong>PC67-3</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Code */}
            <div className="space-y-2">
              <Label htmlFor="patientCode">Código de Paciente *</Label>
              <Input
                id="patientCode"
                placeholder="Ej: FC67-3"
                value={formData.patientCode}
                onChange={handleCodeChange}
                className={`text-2xl font-mono uppercase tracking-wider ${
                  formData.patientCode && !isValidCode ? 'border-destructive' : ''
                } ${isValidCode ? 'border-success' : ''}`}
                maxLength={6}
                required
              />
              {formData.patientCode && !isValidCode && (
                <p className="text-sm text-destructive">
                  Formato incorrecto. Use: 2 letras + 2 números + guión + 1 verificador
                </p>
              )}
              {isValidCode && (
                <p className="text-sm text-success">✓ Código válido</p>
              )}
            </div>

            {isValidCode && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">Código a registrar:</p>
                <p className="text-3xl font-bold text-primary font-mono">{formData.patientCode.toUpperCase()}</p>
              </div>
            )}

            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age">Edad *</Label>
              <Input
                id="age"
                type="number"
                placeholder="65"
                min={1}
                max={120}
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                required
              />
            </div>

            {/* Diagnoses */}
            <div className="space-y-3">
              <Label>Diagnósticos</Label>
              <div className="grid sm:grid-cols-2 gap-3">
                {DIAGNOSIS_OPTIONS.map((diagnosis) => (
                  <div key={diagnosis.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={diagnosis.id}
                      checked={formData.diagnoses.includes(diagnosis.id)}
                      onCheckedChange={(checked) => handleDiagnosisChange(diagnosis.id, checked as boolean)}
                    />
                    <label htmlFor={diagnosis.id} className="text-sm font-medium leading-none cursor-pointer">
                      {diagnosis.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Education Tools */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Herramientas Educativas
                </Label>
                <Switch checked={enableEducation} onCheckedChange={setEnableEducation} />
              </div>
              {enableEducation && (
                <div className="pl-2 space-y-2 border-l-2 border-primary/20 ml-2">
                  {educationPages.length > 0 ? (
                    educationPages.map((page) => (
                      <div key={page.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edu-${page.id}`}
                          checked={formData.educationTools.includes(page.id)}
                          onCheckedChange={(checked) => handleEducationChange(page.id, checked as boolean)}
                        />
                        <label htmlFor={`edu-${page.id}`} className="text-sm font-medium leading-none cursor-pointer">
                          {page.title}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hay páginas educativas creadas. <a href="/education" className="text-primary underline">Crear una</a>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/PrescripcionInteligente/dashboard')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !isValidCode} className="flex-1">
                {isSubmitting ? 'Guardando...' : 'Crear Paciente'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
