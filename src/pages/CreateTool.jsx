const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, Save, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const SPECIALTIES = [
  'Neurología', 'Cardiología', 'Pediatría', 'Diabetes', 'Nefrología',
  'Gastroenterología', 'Respiratorio', 'Infectología', 'Nutrición', 'Urgencias', 'Otro'
];

const INPUT_TYPES = [
  { value: 'number', label: 'Número' },
  { value: 'select', label: 'Selección' },
  { value: 'text', label: 'Texto' },
  { value: 'checkbox', label: 'Checkbox' }
];

export default function CreateTool() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    type: 'calculator',
    description: '',
    input_schema: [],
    calculation_logic: '',
    result_interpretation: [],
    show_patient_info: true
  });

  const [currentInput, setCurrentInput] = useState({
    id: '',
    label: '',
    type: 'number',
    unit: '',
    required: true,
    options: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.ClinicalTool.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-tools'] });
      toast.success('Herramienta creada');
      navigate(createPageUrl('ToolsManager'));
    }
  });

  const addInput = () => {
    if (!currentInput.id || !currentInput.label) {
      toast.error('ID y Label son requeridos');
      return;
    }
    setFormData(prev => ({
      ...prev,
      input_schema: [...prev.input_schema, { ...currentInput }]
    }));
    setCurrentInput({
      id: '',
      label: '',
      type: 'number',
      unit: '',
      required: true,
      options: []
    });
  };

  const removeInput = (index) => {
    setFormData(prev => ({
      ...prev,
      input_schema: prev.input_schema.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.specialty) {
      toast.error('Nombre y especialidad son requeridos');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('ToolsManager')}>
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Crear Nueva Herramienta</h1>
                <p className="text-sm text-slate-500">Calculadora o herramienta clínica</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={createMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Basic Info */}
        <Card className="p-6 space-y-4">
          <h2 className="font-bold text-slate-900">Información Básica</h2>
          
          <div>
            <Label>Nombre de la Herramienta *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ej: Calculadora de IMC"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Especialidad *</Label>
              <Select value={formData.specialty} onValueChange={(val) => setFormData({...formData, specialty: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map(spec => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calculator">Calculadora</SelectItem>
                  <SelectItem value="score">Score/Escala</SelectItem>
                  <SelectItem value="assessment">Evaluación</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              placeholder="Describe para qué sirve esta herramienta"
            />
          </div>
        </Card>

        {/* Input Schema */}
        <Card className="p-6">
          <h2 className="font-bold text-slate-900 mb-4">Inputs de la Calculadora</h2>
          
          <div className="space-y-3 mb-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">ID del Input *</Label>
                <Input
                  value={currentInput.id}
                  onChange={(e) => setCurrentInput({...currentInput, id: e.target.value})}
                  placeholder="ej: weight"
                />
              </div>
              <div>
                <Label className="text-xs">Label *</Label>
                <Input
                  value={currentInput.label}
                  onChange={(e) => setCurrentInput({...currentInput, label: e.target.value})}
                  placeholder="ej: Peso"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={currentInput.type} onValueChange={(val) => setCurrentInput({...currentInput, type: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INPUT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Unidad</Label>
                <Input
                  value={currentInput.unit}
                  onChange={(e) => setCurrentInput({...currentInput, unit: e.target.value})}
                  placeholder="ej: kg"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={currentInput.required}
                    onChange={(e) => setCurrentInput({...currentInput, required: e.target.checked})}
                  />
                  Requerido
                </label>
              </div>
            </div>

            <Button onClick={addInput} size="sm" variant="outline" className="w-full">
              <Plus className="h-3 w-3 mr-1" />
              Agregar Input
            </Button>
          </div>

          {/* Input List */}
          <div className="space-y-2">
            {formData.input_schema.map((input, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                <div>
                  <span className="font-semibold text-sm">{input.label}</span>
                  <span className="text-xs text-slate-500 ml-2">
                    ({input.id} - {input.type}
                    {input.unit && `, ${input.unit}`}
                    {input.required && ', requerido'})
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeInput(idx)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Calculation Logic */}
        <Card className="p-6">
          <h2 className="font-bold text-slate-900 mb-2">Lógica de Cálculo</h2>
          <p className="text-xs text-slate-600 mb-4">
            Escribe la función JavaScript que calcula el resultado. 
            Ejemplo: "return inputs.weight / Math.pow(inputs.height / 100, 2);"
          </p>
          <Textarea
            value={formData.calculation_logic}
            onChange={(e) => setFormData({...formData, calculation_logic: e.target.value})}
            rows={6}
            placeholder="function calculate(inputs) { ... }"
            className="font-mono text-sm"
          />
        </Card>
      </div>
    </div>
  );
}