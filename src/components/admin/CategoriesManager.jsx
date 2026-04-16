const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, X, Save, Heart, Activity, AlertCircle, Baby, Brain, Stethoscope, Pill, Syringe, Hospital, Ambulance, UserCheck, Shield } from 'lucide-react';
import { toast } from 'sonner';

const ICON_MAP = {
  Heart, Activity, AlertCircle, Baby, Brain, Stethoscope,
  Pill, Syringe, Hospital, Ambulance, UserCheck, Shield
};

const AVAILABLE_ICONS = [
  'Heart', 'Activity', 'AlertCircle', 'Baby', 'Brain', 'Stethoscope',
  'Pill', 'Syringe', 'Hospital', 'Ambulance', 'UserCheck', 'Shield'
];

const COLORS = [
  { value: 'blue', label: 'Azul', bg: 'bg-blue-100', text: 'text-blue-700' },
  { value: 'purple', label: 'Morado', bg: 'bg-purple-100', text: 'text-purple-700' },
  { value: 'green', label: 'Verde', bg: 'bg-green-100', text: 'text-green-700' },
  { value: 'orange', label: 'Naranja', bg: 'bg-orange-100', text: 'text-orange-700' },
  { value: 'red', label: 'Rojo', bg: 'bg-red-100', text: 'text-red-700' },
  { value: 'pink', label: 'Rosa', bg: 'bg-pink-100', text: 'text-pink-700' }
];

export default function CategoriesManager() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: 'Heart',
    color: 'blue',
    order: 0
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => db.entities.Category.list('order')
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Category.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoría creada');
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Category.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoría actualizada');
      setEditingId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Category.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoría eliminada');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: 'Heart',
      color: 'blue',
      order: 0
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleEdit = (category) => {
    setFormData(category);
    setEditingId(category.id);
    setShowAddForm(false);
  };

  const handleSave = () => {
    if (!formData.name || !formData.slug) {
      toast.error('Nombre y slug son requeridos');
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getIconComponent = (iconName) => {
    return ICON_MAP[iconName] || Heart;
  };

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <Card className="p-6 bg-blue-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">
              {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
            </h3>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Urgencias"
                />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="ej: urgencias"
                />
              </div>
            </div>

            <div>
              <Label>Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Ícono</Label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {AVAILABLE_ICONS.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Color</Label>
                <select
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {COLORS.map(color => (
                    <option key={color.value} value={color.value}>{color.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Orden</Label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {editingId ? 'Actualizar' : 'Crear'} Categoría
            </Button>
          </div>
        </Card>
      )}

      {/* Add Button */}
      {!showAddForm && !editingId && (
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Categoría
        </Button>
      )}

      {/* Categories List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map(category => {
            const IconComponent = getIconComponent(category.icon);
            const colorConfig = COLORS.find(c => c.value === category.color) || COLORS[0];
            
            return (
              <Card key={category.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-3 rounded-xl ${colorConfig.bg}`}>
                    <IconComponent className={`h-6 w-6 ${colorConfig.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900">{category.name}</h4>
                    <p className="text-xs text-slate-500">{category.slug}</p>
                  </div>
                </div>
                {category.description && (
                  <p className="text-sm text-slate-600 mb-3">{category.description}</p>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`¿Eliminar "${category.name}"?`)) {
                        deleteMutation.mutate(category.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1 text-red-600" />
                    Eliminar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}