import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/medispense/components/ui/card';
import { Input } from '@/medispense/components/ui/input';
import { Button } from '@/medispense/components/ui/button';
import { Badge } from '@/medispense/components/ui/badge';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Pill, 
  Edit, 
  Trash2,
  Package,
  Loader2,
  Info
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/medispense/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/medispense/components/ui/tooltip";
import { Label } from '@/medispense/components/ui/label';
import { useToast } from '@/medispense/hooks/use-toast';
import { supabase } from '@/medispense/integrations/supabase/client';
import { routes } from '@/medispense/lib/routes';
import { filterLocallyAvailableMedications, isLocallyAvailableMedication } from '@/lib/localArsenal';

interface Medication {
  id: string;
  name: string;
  active_ingredient: string;
  presentation: string;
  dose_value: number;
  dose_unit: string;
  category: string | null;
  restrictions: string | null;
  is_active: boolean;
}

// Glossary definitions for restriction abbreviations
const GLOSSARY: Record<string, string> = {
  'PM': 'Programa Ministerial',
  'TBC': 'Tuberculosis',
  'FOFAR': 'Fondo de Farmacia',
  'AD': 'Alivio del Dolor',
  'CP': 'Cuidados Paliativos',
  'CPU': 'Cuidados Paliativos Universales',
  'AD y CP': 'Alivio del Dolor y Cuidados Paliativos',
  'SOS': 'Según necesidad',
  'BIC': 'Bomba de infusión continua',
  'SSÑ-2026': 'Arsenal Básico Servicio de Salud Ñuble (Res. Ex. N°5754, dic-2025) — disponible en todos los HCSF, complementa el arsenal local',
};

const SSN2026_TAG = '[SSÑ-2026]';
const isSSN2026 = (restrictions: string | null) => !!restrictions && restrictions.includes(SSN2026_TAG);

const highlightGlossary = (text: string) => {
  if (!text) return null;
  
  // Sort keys by length descending to match longer terms first
  const keys = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
  const regex = new RegExp(`\\b(${keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
  
  const parts = text.split(regex);
  
  return parts.map((part, i) => {
    const matchedKey = keys.find(k => k.toLowerCase() === part.toLowerCase());
    if (matchedKey && GLOSSARY[matchedKey]) {
      return (
        <Tooltip key={i}>
          <TooltipTrigger asChild>
            <span className="underline decoration-dotted decoration-primary cursor-help text-primary font-medium">
              {part}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs font-medium">{GLOSSARY[matchedKey]}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

export default function Arsenal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    activeIngredient: '',
    presentation: '',
    doseValue: '',
    doseUnit: 'mg',
    category: '',
    restrictions: '',
  });

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los medicamentos', variant: 'destructive' });
    } else {
      setMedications(filterLocallyAvailableMedications(data));
    }
    setLoading(false);
  };

  const filteredMedications = medications.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.active_ingredient.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (med.category?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );

  const resetForm = () => {
    setFormData({ name: '', activeIngredient: '', presentation: '', doseValue: '', doseUnit: 'mg', category: '', restrictions: '' });
    setEditingMed(null);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.activeIngredient || !formData.presentation || !formData.doseValue) {
      toast({ title: 'Error', description: 'Completa los campos requeridos', variant: 'destructive' });
      return;
    }

    if (!isLocallyAvailableMedication({
      name: formData.name,
      active_ingredient: formData.activeIngredient,
      dose_value: formData.doseValue,
      dose_unit: formData.doseUnit,
    })) {
      toast({
        title: 'Presentación no disponible',
        description: 'El arsenal local no dispone de Amlodipino 5 mg. Usa Amlodipino 10 mg y fracciona la dosis cuando corresponda.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingMed) {
        const { error } = await supabase
          .from('medications')
          .update({
            name: formData.name,
            active_ingredient: formData.activeIngredient,
            presentation: formData.presentation,
            dose_value: parseFloat(formData.doseValue),
            dose_unit: formData.doseUnit,
            category: formData.category || null,
            restrictions: formData.restrictions || null,
          })
          .eq('id', editingMed.id);
        if (error) throw error;
        toast({ title: 'Medicamento actualizado' });
      } else {
        const { error } = await supabase
          .from('medications')
          .insert({
            name: formData.name,
            active_ingredient: formData.activeIngredient,
            presentation: formData.presentation,
            dose_value: parseFloat(formData.doseValue),
            dose_unit: formData.doseUnit,
            category: formData.category || null,
            restrictions: formData.restrictions || null,
          });
        if (error) throw error;
        toast({ title: 'Medicamento agregado' });
      }
      setIsAddDialogOpen(false);
      resetForm();
      fetchMedications();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo guardar el medicamento', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (med: Medication) => {
    setEditingMed(med);
    setFormData({
      name: med.name,
      activeIngredient: med.active_ingredient,
      presentation: med.presentation,
      doseValue: med.dose_value.toString(),
      doseUnit: med.dose_unit,
      category: med.category || '',
      restrictions: med.restrictions || '',
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('medications')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
      setMedications(medications.filter(med => med.id !== id));
      toast({ title: 'Medicamento eliminado' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-muted-foreground">Cargando medicamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(routes.dashboard())}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Arsenal de Medicamentos</h1>
            <p className="text-muted-foreground">{medications.length} medicamentos disponibles</p>
          </div>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Agregar</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingMed ? 'Editar Medicamento' : 'Nuevo Medicamento'}</DialogTitle>
              <DialogDescription>
                {editingMed ? 'Modifica los datos del medicamento' : 'Agrega un nuevo medicamento al arsenal'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activeIngredient">Principio activo *</Label>
                  <Input id="activeIngredient" value={formData.activeIngredient} onChange={(e) => setFormData({ ...formData, activeIngredient: e.target.value })} />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="presentation">Presentación *</Label>
                  <Input id="presentation" placeholder="Comprimido" value={formData.presentation} onChange={(e) => setFormData({ ...formData, presentation: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doseValue">Dosis *</Label>
                  <Input id="doseValue" type="number" value={formData.doseValue} onChange={(e) => setFormData({ ...formData, doseValue: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doseUnit">Unidad</Label>
                  <Input id="doseUnit" placeholder="mg" value={formData.doseUnit} onChange={(e) => setFormData({ ...formData, doseUnit: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Input id="category" placeholder="Antihipertensivo" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="restrictions">
                  Restricciones
                  <span className="text-xs text-muted-foreground ml-2">(PM, TBC, FOFAR, AD y CP, CPU)</span>
                </Label>
                <Input id="restrictions" placeholder="PM, FOFAR, AD y CP..." value={formData.restrictions} onChange={(e) => setFormData({ ...formData, restrictions: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...</> : editingMed ? 'Guardar' : 'Agregar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Glossary legend */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Glosario</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {Object.entries(GLOSSARY).map(([abbr, full]) => (
              <span key={abbr}><strong className="text-foreground">{abbr}</strong>: {full}</span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, principio activo o categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Medications grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMedications.map((med) => (
          <Card key={med.id} className="group hover:shadow-medical transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Pill className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{med.name}</CardTitle>
                    <CardDescription className="text-xs">{med.active_ingredient}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(med)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(med.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  {med.presentation}
                </Badge>
                <Badge variant="outline">{med.dose_value} {med.dose_unit}</Badge>
                {med.category && (
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20">{med.category}</Badge>
                )}
                {isSSN2026(med.restrictions) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className="bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 cursor-help">
                        🆕 SSÑ-2026
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">{GLOSSARY['SSÑ-2026']}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              {med.restrictions && (
                <p className="text-xs text-muted-foreground mt-2">
                  {highlightGlossary(med.restrictions.replace(SSN2026_TAG, '').trim())}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMedications.length === 0 && (
        <div className="text-center py-12">
          <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No se encontraron medicamentos</p>
        </div>
      )}
    </div>
  );
}
