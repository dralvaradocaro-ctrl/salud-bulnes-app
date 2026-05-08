import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/medispense/components/ui/card';
import { Input } from '@/medispense/components/ui/input';
import { Button } from '@/medispense/components/ui/button';
import { Badge } from '@/medispense/components/ui/badge';
import { 
  Search, 
  Plus, 
  Users, 
  AlertTriangle, 
  Clock, 
  Pill,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/medispense/integrations/supabase/client';

interface PatientWithPrescription {
  id: string;
  patient_code: string;
  full_name: string;
  age: number | null;
  diagnoses: string[] | null;
  daysUntilExpiry: number | null;
  prescriptionCount: number;
}

const getExpiryBadgeVariant = (days: number | null) => {
  if (days === null) return 'secondary';
  if (days <= 7) return 'destructive';
  if (days <= 15) return 'warning';
  return 'success';
};

const getExpiryBadgeText = (days: number | null) => {
  if (days === null) return 'Sin recetas';
  if (days <= 7) return `${days}d - Urgente`;
  if (days <= 15) return `${days}d - Próximo`;
  return `${days}d`;
};

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [alertThreshold, setAlertThreshold] = useState(7);
  const [patients, setPatients] = useState<PatientWithPrescription[]>([]);
  const [searchResults, setSearchResults] = useState<PatientWithPrescription[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchPatientsWithPrescriptions();
  }, []);

  // Debounced search against database
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const q = searchQuery.trim();
        const { data: patientsData } = await supabase
          .from('patients')
          .select('*')
          .or(`full_name.ilike.%${q}%,patient_code.ilike.%${q}%`)
          .order('created_at', { ascending: false })
          .limit(20);

        if (patientsData) {
          const results = await Promise.all(
            patientsData.map(async (patient) => {
              const { data: prescriptions } = await supabase
                .from('prescriptions')
                .select('expiry_date')
                .eq('patient_id', patient.id);

              const prescriptionCount = prescriptions?.length || 0;
              let daysUntilExpiry: number | null = null;
              if (prescriptions && prescriptions.length > 0) {
                const today = new Date();
                const expiryDates = prescriptions.map(p => {
                  const expiry = new Date(p.expiry_date);
                  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                });
                daysUntilExpiry = Math.min(...expiryDates);
              }

              return {
                id: patient.id,
                patient_code: patient.patient_code,
                full_name: patient.full_name,
                age: patient.age,
                diagnoses: patient.diagnoses,
                daysUntilExpiry,
                prescriptionCount,
              };
            })
          );
          setSearchResults(results);
        }
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const fetchPatientsWithPrescriptions = async () => {
    setLoading(true);

    // Fetch all patients
    const { data: patientsData, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (patientsError || !patientsData) {
      setLoading(false);
      return;
    }

    // For each patient, get their prescription info
    const patientsWithPrescriptions = await Promise.all(
      patientsData.map(async (patient) => {
        const { data: prescriptions } = await supabase
          .from('prescriptions')
          .select('expiry_date')
          .eq('patient_id', patient.id);

        const prescriptionCount = prescriptions?.length || 0;
        
        // Find the nearest expiry date
        let daysUntilExpiry: number | null = null;
        if (prescriptions && prescriptions.length > 0) {
          const today = new Date();
          const expiryDates = prescriptions.map(p => {
            const expiry = new Date(p.expiry_date);
            return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          });
          daysUntilExpiry = Math.min(...expiryDates);
        }

        return {
          id: patient.id,
          patient_code: patient.patient_code,
          full_name: patient.full_name,
          age: patient.age,
          diagnoses: patient.diagnoses,
          daysUntilExpiry,
          prescriptionCount,
        };
      })
    );

    // Sort by expiry (nearest first), then by those without prescriptions
    patientsWithPrescriptions.sort((a, b) => {
      if (a.daysUntilExpiry === null && b.daysUntilExpiry === null) return 0;
      if (a.daysUntilExpiry === null) return 1;
      if (b.daysUntilExpiry === null) return -1;
      return a.daysUntilExpiry - b.daysUntilExpiry;
    });

    setPatients(patientsWithPrescriptions.slice(0, 10));
    setLoading(false);
  };

  const filteredPatients = searchResults !== null ? searchResults : patients;

  const urgentPrescriptions = patients.filter(p => 
    p.daysUntilExpiry !== null && p.daysUntilExpiry <= alertThreshold
  );

  return (
    <div className="space-y-6">
      {/* Search section */}
      <Card className="shadow-medical">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente por ID o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button asChild>
              <Link to="/PrescripcionInteligente/patients/new">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Paciente
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent patients */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Pacientes Recientes</CardTitle>
                </div>
                <Badge variant="secondary">{patients.length}</Badge>
              </div>
              <CardDescription>
                Ordenados por proximidad de vencimiento de recetas
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-pulse-soft text-muted-foreground">Cargando...</div>
                </div>
              ) : filteredPatients.length > 0 ? (
                <div className="space-y-2">
                  {filteredPatients.map((patient) => (
                    <Link
                      key={patient.id}
                      to={`/PrescripcionInteligente/patients/${patient.patient_code}`}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {patient.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{patient.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            ID: {patient.patient_code}
                            {patient.age && ` • ${patient.age} años`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {patient.prescriptionCount > 0 && (
                          <Badge variant="outline" className="hidden sm:flex">
                            <Pill className="h-3 w-3 mr-1" />
                            {patient.prescriptionCount} receta{patient.prescriptionCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                        <Badge 
                          className={
                            getExpiryBadgeVariant(patient.daysUntilExpiry) === 'warning' 
                              ? 'bg-warning text-warning-foreground' 
                              : getExpiryBadgeVariant(patient.daysUntilExpiry) === 'success'
                              ? 'bg-success text-success-foreground'
                              : getExpiryBadgeVariant(patient.daysUntilExpiry) === 'secondary'
                              ? 'bg-secondary text-secondary-foreground'
                              : ''
                          }
                          variant={getExpiryBadgeVariant(patient.daysUntilExpiry) === 'destructive' ? 'destructive' : 'default'}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {getExpiryBadgeText(patient.daysUntilExpiry)}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No hay pacientes registrados</p>
                  <Button asChild>
                    <Link to="/PrescripcionInteligente/patients/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Primer Paciente
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts panel */}
        <div className="space-y-6">
          <Card className="border-destructive/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-lg">Alertas de Caducidad</CardTitle>
              </div>
              <CardDescription>
                Prescripciones próximas a vencer
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Umbral:</span>
                  <div className="flex gap-1">
                    {[7, 15, 30].map((days) => (
                      <Button
                        key={days}
                        variant={alertThreshold === days ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAlertThreshold(days)}
                      >
                        {days}d
                      </Button>
                    ))}
                  </div>
                </div>

                {urgentPrescriptions.length > 0 ? (
                  <div className="space-y-2">
                    {urgentPrescriptions.map((patient) => (
                      <Link
                        key={patient.id}
                        to={`/PrescripcionInteligente/patients/${patient.patient_code}`}
                        className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 hover:bg-destructive/10 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium">{patient.full_name}</p>
                          <p className="text-xs text-muted-foreground">{patient.patient_code}</p>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          {patient.daysUntilExpiry}d
                        </Badge>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay prescripciones próximas a vencer
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/PrescripcionInteligente/patients/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Paciente
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/PrescripcionInteligente/arsenal">
                  <Pill className="h-4 w-4 mr-2" />
                  Ver Arsenal
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/PrescripcionInteligente/education">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Herramientas Educativas
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
