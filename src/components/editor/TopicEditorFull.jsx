const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  GripVertical, X, Plus, FileText, Upload, Sparkles, Link as LinkIcon,
  Save, Eye, EyeOff, History, GitBranch, AlertCircle, ChevronDown
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import AIContentActions from '@/components/editor/AIContentActions';
import ReferenceBlock from '@/components/editor/ReferenceBlock';

const BLOCK_TYPES = [
  { type: 'text', label: 'Texto', icon: FileText },
  { type: 'flowchart', label: 'Paso de Flujo', icon: GripVertical },
  { type: 'algorithm', label: 'Algoritmo', icon: GitBranch },
  { type: 'alert', label: 'Alerta', icon: AlertCircle },
  { type: 'reference', label: 'Referencia', icon: LinkIcon }
];

const FLOW_COLORS = [
  { value: 'blue', label: 'Azul', bg: 'bg-blue-50', border: 'border-blue-200', circle: 'bg-blue-600' },
  { value: 'purple', label: 'Morado', bg: 'bg-purple-50', border: 'border-purple-200', circle: 'bg-purple-600' },
  { value: 'green', label: 'Verde', bg: 'bg-green-50', border: 'border-green-200', circle: 'bg-green-600' },
  { value: 'orange', label: 'Naranja', bg: 'bg-orange-50', border: 'border-orange-200', circle: 'bg-orange-600' },
  { value: 'red', label: 'Rojo', bg: 'bg-red-50', border: 'border-red-200', circle: 'bg-red-600' }
];

const LAYOUT_MODES = [
  { value: 'auto', label: 'Automático (Responsive)' },
  { value: 'single', label: 'Columna Única' },
  { value: 'two-panel-5050', label: '2 Paneles (50/50)' },
  { value: 'two-panel-6040', label: '2 Paneles (60/40)' },
  { value: 'two-panel-4060', label: '2 Paneles (40/60)' },
  { value: 'full-width', label: 'Ancho Completo' }
];

export default function TopicEditorFull({ 
  topicData, 
  onSave, 
  onDelete,
  isNew = false,
  categories = []
}) {
  const [showPreview, setShowPreview] = useState(true);
  const [showAIActions, setShowAIActions] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    category_id: '',
    subcategory: '',
    authors: [],
    published_date: '',
    layout_mode: 'auto',
    status: 'draft',
    blocks: [],
    related_topics: [],
    related_tools: [],
    tipo_contenido: [],
    clasificacion_ges: '',
    has_local_protocol: false,
    show_protocol_header: false,
    protocol_code: '',
    protocol_edition: '',
    protocol_date: '',
    protocol_validity: '',
    protocol_objective: '',
    protocol_authors: [],
    protocol_participants: [],
    protocol_file_url: '',
    ...topicData
  });

  useEffect(() => {
    if (topicData) {
      const blocks = topicData.content_blocks?.length > 0 
        ? topicData.content_blocks 
        : parseTopicToBlocks(topicData);
      
      setFormData({
        name: topicData.name || '',
        title: topicData.title || '',
        description: topicData.description || '',
        category_id: topicData.category_id || '',
        subcategory: topicData.subcategory || '',
        authors: topicData.authors || [],
        published_date: topicData.published_date || '',
        layout_mode: topicData.layout_mode || 'auto',
        status: topicData.status || 'draft',
        blocks: blocks,
        related_topics: topicData.related_topics || [],
        related_tools: topicData.related_tools || [],
        tipo_contenido: topicData.tipo_contenido || [],
        clasificacion_ges: topicData.clasificacion_ges || '',
        has_local_protocol: topicData.has_local_protocol || false,
        show_protocol_header: !!(topicData.protocol_code || topicData.protocol_authors?.length),
        protocol_code: topicData.protocol_code || '',
        protocol_edition: topicData.protocol_edition || '',
        protocol_date: topicData.protocol_date || '',
        protocol_validity: topicData.protocol_validity || '',
        protocol_objective: topicData.protocol_objective || '',
        protocol_authors: topicData.protocol_authors || [],
        protocol_participants: topicData.protocol_participants || [],
        protocol_file_url: topicData.protocol_file_url || ''
      });
    }
  }, [topicData?.id]);

  const parseTopicToBlocks = (topic) => {
    const blocks = [];
    if (topic.clinical_summary) {
      blocks.push({ id: 'cs', type: 'text', title: 'Resumen Clínico', content: topic.clinical_summary, layout_position: 'main' });
    }
    if (topic.diagnostic_orientation) {
      blocks.push({ id: 'do', type: 'text', title: 'Orientación Diagnóstica', content: topic.diagnostic_orientation, layout_position: 'main' });
    }
    if (topic.protocol_flowchart?.length > 0) {
      topic.protocol_flowchart.forEach((step, i) => {
        blocks.push({ 
          id: `flow-${i}`, 
          type: 'flowchart', 
          title: step.title,
          description: step.description,
          details: step.details || [],
          color: step.color || 'blue',
          icon: step.icon || 'FileText',
          layout_position: 'main'
        });
      });
    }
    return blocks;
  };

  const addBlock = (type) => {
    const newBlock = {
      id: `block-${Date.now()}`,
      type,
      title: '',
      description: '',
      content: '',
      details: (type === 'flowchart' || type === 'algorithm') ? [] : undefined,
      color: 'blue',
      layout_position: 'main',
      order: formData.blocks.length
    };
    
    if (type === 'reference') {
      newBlock.reference_type = '';
      newBlock.reference_id = '';
      newBlock.reference_label = '';
    }
    
    setFormData(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock]
    }));
  };

  const updateBlock = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === id ? { ...b, [field]: value } : b)
    }));
  };

  const deleteBlock = (id) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => b.id !== id)
    }));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(formData.blocks);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setFormData(prev => ({ ...prev, blocks: items }));
  };

  const addDetailToBlock = (blockId) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => 
        b.id === blockId ? { ...b, details: [...(b.details || []), ''] } : b
      )
    }));
  };

  const updateDetail = (blockId, detailIndex, value) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => 
        b.id === blockId ? {
          ...b,
          details: b.details.map((d, i) => i === detailIndex ? value : d)
        } : b
      )
    }));
  };

  const removeDetail = (blockId, detailIndex) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => 
        b.id === blockId ? {
          ...b,
          details: b.details.filter((_, i) => i !== detailIndex)
        } : b
      )
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    toast.loading('Subiendo archivo...');
    try {
      const { base44 } = await import('@/api/base44Client');
      const result = await db.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, protocol_file_url: result.file_url }));
      toast.success('Archivo subido');
    } catch (error) {
      toast.error('Error al subir archivo');
    }
  };

  const addAuthor = () => {
    setFormData(prev => ({
      ...prev,
      authors: [...(prev.authors || []), { name: '', role: '' }]
    }));
  };

  const updateAuthor = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      authors: prev.authors.map((a, i) => i === index ? { ...a, [field]: value } : a)
    }));
  };

  const removeAuthor = (index) => {
    setFormData(prev => ({
      ...prev,
      authors: prev.authors.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (!formData.category_id) {
      toast.error('La categoría es obligatoria');
      return;
    }
    if (!formData.tipo_contenido?.length) {
      toast.error('⚠️ Selecciona al menos un tipo de contenido para guardar');
      return;
    }
    
    // Excluir campos UI-only del payload persistido
    const { show_protocol_header, blocks, ...rest } = formData;
    
    const saveData = {
      ...rest,
      content_blocks: formData.blocks,
      last_updated: new Date().toISOString(),
      // Si el banner de protocolo está desactivado, limpiar campos de protocolo
      ...(show_protocol_header ? {} : {
        protocol_code: '',
        protocol_edition: '',
        protocol_date: '',
        protocol_validity: '',
        protocol_objective: '',
        protocol_authors: [],
        protocol_participants: [],
        protocol_file_url: ''
      })
    };
    
    onSave(saveData);
  };

  const applyAIChanges = (changes) => {
    if (changes.blocks) {
      const newBlocks = changes.blocks.map((b, idx) => ({
        ...b,
        id: `ai-${Date.now()}-${idx}`,
        order: formData.blocks.length + idx,
        layout_position: b.layout_position || 'main',
        color: b.color || 'blue'
      }));
      setFormData(prev => ({
        ...prev,
        blocks: [...prev.blocks, ...newBlocks]
      }));
    }
    if (changes.structure) {
      setFormData(prev => ({
        ...prev,
        ...changes.structure
      }));
    }
    toast.success('Cambios de IA aplicados');
    setShowAIActions(false);
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPreview ? 'Ocultar' : 'Ver'} Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAIActions(!showAIActions)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Asistente IA
          </Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
          {!isNew && onDelete && (
            <Button variant="destructive" onClick={onDelete} size="sm">
              Eliminar
            </Button>
          )}
        </div>
      </div>

      {/* AI Actions Panel */}
      {showAIActions && (
        <AIContentActions 
          currentContent={formData} 
          onApplyChanges={applyAIChanges}
          onClose={() => setShowAIActions(false)}
        />
      )}

      <div className={`grid gap-4 ${showPreview ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {/* Editor Panel */}
        <div className="space-y-4">
          {/* Header Information */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Información del Encabezado</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  show_protocol_header: !prev.show_protocol_header 
                }))}
              >
                {formData.show_protocol_header ? '✓' : '+'} Banner Protocolo
              </Button>
            </div>
            
            <div>
              <Label>Título Principal *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Protocolo de Manejo de ACV"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoría *</Label>
                <Select value={formData.category_id} onValueChange={(val) => setFormData(prev => ({ ...prev, category_id: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Subcategoría</Label>
                <Input
                  value={formData.subcategory || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                  placeholder="Ej: Protocolos Locales"
                />
              </div>
            </div>

            <div>
              <Label>Descripción Breve</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                placeholder="Resumen corto del contenido"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Autores</Label>
                <Button variant="outline" size="sm" onClick={addAuthor}>
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar
                </Button>
              </div>
              <div className="space-y-2">
                {(formData.authors || []).map((author, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      placeholder="Nombre"
                      value={author.name}
                      onChange={(e) => updateAuthor(idx, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Cargo"
                      value={author.role}
                      onChange={(e) => updateAuthor(idx, 'role', e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeAuthor(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha de Publicación</Label>
                <Input
                  type="date"
                  value={formData.published_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, published_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={formData.status || 'draft'} onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Protocol Header Fields */}
            {formData.show_protocol_header && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                <h4 className="font-semibold text-blue-900 text-sm">Información del Banner de Protocolo</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Código del Protocolo</Label>
                    <Input
                      value={formData.protocol_code || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, protocol_code: e.target.value }))}
                      placeholder="Ej: PROT-NUT-001"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Edición</Label>
                    <Input
                      value={formData.protocol_edition || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, protocol_edition: e.target.value }))}
                      placeholder="Ej: Primera edición"
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Fecha de Elaboración</Label>
                    <Input
                      value={formData.protocol_date || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, protocol_date: e.target.value }))}
                      placeholder="Ej: Enero 2024"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Vigencia</Label>
                    <Input
                      value={formData.protocol_validity || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, protocol_validity: e.target.value }))}
                      placeholder="Ej: 3 años desde elaboración"
                      className="text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Objetivo Principal</Label>
                  <Textarea
                    value={formData.protocol_objective || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, protocol_objective: e.target.value }))}
                    placeholder="Describe el objetivo principal del protocolo"
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs">Autores del Protocolo</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        protocol_authors: [...(prev.protocol_authors || []), { name: '', role: '' }]
                      }))}
                      className="h-7 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(formData.protocol_authors || []).map((author, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          placeholder="Nombre"
                          value={author.name}
                          onChange={(e) => {
                            const newAuthors = [...(formData.protocol_authors || [])];
                            newAuthors[idx] = { ...author, name: e.target.value };
                            setFormData(prev => ({ ...prev, protocol_authors: newAuthors }));
                          }}
                          className="flex-1 text-sm"
                        />
                        <Input
                          placeholder="Cargo/Rol"
                          value={author.role}
                          onChange={(e) => {
                            const newAuthors = [...(formData.protocol_authors || [])];
                            newAuthors[idx] = { ...author, role: e.target.value };
                            setFormData(prev => ({ ...prev, protocol_authors: newAuthors }));
                          }}
                          className="flex-1 text-sm"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              protocol_authors: prev.protocol_authors.filter((_, i) => i !== idx)
                            }));
                          }}
                          className="h-9"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Responsables de Ejecución (separados por coma)</Label>
                  <Input
                    value={(formData.protocol_participants || []).join(', ')}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      protocol_participants: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    }))}
                    placeholder="Ej: Médico Tratante, Enfermera Clínica, Nutricionista"
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">URL del Archivo PDF (opcional)</Label>
                  <Input
                    value={formData.protocol_file_url || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, protocol_file_url: e.target.value }))}
                    placeholder="https://..."
                    className="text-sm"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Clinical Classification */}
          <Card className="p-4 space-y-4 border-l-4 border-l-indigo-400">
            <h3 className="font-bold text-slate-900">Clasificación Clínica</h3>

            <div>
              <Label className="mb-2 block text-sm">Tipo de Contenido <span className="text-red-500">*</span></Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'protocolo', label: 'Protocolo', bg: 'bg-green-100 border-green-400 text-green-800' },
                  { value: 'contenido_medico', label: 'Contenido Médico', bg: 'bg-blue-100 border-blue-400 text-blue-800' },
                  { value: 'herramienta_clinica', label: 'Herramienta Clínica', bg: 'bg-purple-100 border-purple-400 text-purple-800' },
                ].map(({ value, label, bg }) => {
                  const selected = (formData.tipo_contenido || []).includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setFormData(prev => {
                          const current = prev.tipo_contenido || [];
                          const isSelected = current.includes(value);
                          return {
                            ...prev,
                            tipo_contenido: isSelected
                              ? current.filter(v => v !== value)
                              : [...current, value]
                          };
                        });
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${selected ? bg : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Clasificación GES</Label>
                <Select value={formData.clasificacion_ges || ''} onValueChange={(val) => setFormData(prev => ({ ...prev, clasificacion_ges: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GES">GES</SelectItem>
                    <SelectItem value="No GES">No GES</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, has_local_protocol: !prev.has_local_protocol }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.has_local_protocol
                      ? 'bg-green-50 border-green-400 text-green-800'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="text-base">{formData.has_local_protocol ? '✓' : '○'}</span>
                  Protocolo Local
                </button>
              </div>
            </div>
          </Card>

          {/* Layout Control */}
          <Card className="p-4">
            <Label className="mb-2 block">Diseño del Contenido</Label>
            <Select value={formData.layout_mode || 'auto'} onValueChange={(val) => setFormData(prev => ({ ...prev, layout_mode: val }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LAYOUT_MODES.map(mode => (
                  <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Content Blocks */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Label>Bloques de Contenido</Label>
              <div className="flex gap-2 flex-wrap">
                {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => addBlock(type)}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="blocks">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {formData.blocks.map((block, index) => (
                      <Draggable key={block.id} draggableId={block.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="bg-slate-50 border border-slate-200 rounded-lg p-4"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <div
                                {...provided.dragHandleProps}
                                title="Arrastrar para reordenar"
                                className="p-1 rounded hover:bg-slate-200 cursor-grab active:cursor-grabbing transition-colors"
                              >
                                <GripVertical className="h-5 w-5 text-slate-400" />
                              </div>
                              <Input
                                value={block.title}
                                onChange={(e) => updateBlock(block.id, 'title', e.target.value)}
                                placeholder="Título del bloque"
                                className="flex-1"
                              />
                              <Select 
                                value={block.layout_position || 'main'} 
                                onValueChange={(val) => updateBlock(block.id, 'layout_position', val)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="main">Principal</SelectItem>
                                  <SelectItem value="sidebar">Lateral</SelectItem>
                                  <SelectItem value="full">Completo</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteBlock(block.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            {block.type === 'reference' && (
                              <ReferenceBlock
                                block={block}
                                onUpdate={(field, value) => updateBlock(block.id, field, value)}
                              />
                            )}

                            {block.type === 'text' && (
                              <Textarea
                                value={block.content || ''}
                                onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
                                placeholder="Contenido (Markdown soportado)"
                                rows={4}
                              />
                            )}

                            {(block.type === 'flowchart' || block.type === 'algorithm') && (
                              <div className="space-y-3">
                                {/* Color selector */}
                                <div>
                                  <Label className="text-xs mb-1.5 block">Color del paso</Label>
                                  <div className="flex gap-2">
                                    {FLOW_COLORS.map(c => (
                                      <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => updateBlock(block.id, 'color', c.value)}
                                        title={c.label}
                                        className={`w-6 h-6 rounded-full ${c.circle} border-2 transition-all ${
                                          block.color === c.value ? 'border-slate-800 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <Textarea
                                  value={block.description || ''}
                                  onChange={(e) => updateBlock(block.id, 'description', e.target.value)}
                                  placeholder="Descripción del paso"
                                  rows={2}
                                />
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Detalles / acciones</Label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addDetailToBlock(block.id)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Agregar
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {(block.details || []).map((detail, idx) => (
                                    <div key={idx} className="flex gap-2">
                                      <Textarea
                                        value={detail}
                                        onChange={(e) => updateDetail(block.id, idx, e.target.value)}
                                        placeholder="Detalle"
                                        rows={2}
                                        className="flex-1"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeDetail(block.id, idx)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </Card>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="sticky top-4 h-[calc(100vh-6rem)] overflow-y-auto">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <Eye className="h-4 w-4 text-slate-400" />
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Vista Previa — igual a lo que verá el usuario</h3>
              </div>
              <div className="space-y-4">
                {/* Header */}
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{formData.name || <span className="text-slate-300 italic">Sin título</span>}</h1>
                  {formData.description && (
                    <p className="text-slate-500 mt-1 text-sm">{formData.description}</p>
                  )}
                  {formData.tipo_contenido?.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {formData.tipo_contenido.includes('protocolo') && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">Protocolo</span>
                      )}
                      {formData.tipo_contenido.includes('contenido_medico') && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">Contenido Médico</span>
                      )}
                      {formData.tipo_contenido.includes('herramienta_clinica') && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 font-medium">Herramienta</span>
                      )}
                      {formData.has_local_protocol && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 font-semibold border border-green-300">✓ Prot. Local</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Blocks */}
                {formData.blocks.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                    Sin bloques aún — agrega contenido desde el panel izquierdo
                  </p>
                )}

                {formData.blocks.map((block, index) => {
                  const colorConfig = FLOW_COLORS.find(c => c.value === block.color) || FLOW_COLORS[0];
                  return (
                    <div key={block.id}>
                      {/* text */}
                      {block.type === 'text' && (
                        <div className="border-t border-slate-100 pt-4">
                          {block.title && (
                            <h3 className="font-semibold text-slate-900 mb-2 text-sm">{block.title}</h3>
                          )}
                          {block.content ? (
                            <ReactMarkdown className="prose prose-sm max-w-none text-slate-700">
                              {block.content}
                            </ReactMarkdown>
                          ) : (
                            <p className="text-xs text-slate-300 italic">Sin contenido</p>
                          )}
                        </div>
                      )}

                      {/* flowchart / algorithm — igual a ProtocolFlowchart */}
                      {(block.type === 'flowchart' || block.type === 'algorithm') && (
                        <div className="border-t border-slate-100 pt-4">
                          <div className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-7 h-7 rounded-full ${colorConfig.circle} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                                {index + 1}
                              </div>
                              <div className="w-0.5 flex-1 bg-slate-200 mt-1" />
                            </div>
                            <div className={`flex-1 pb-4 p-3 rounded-lg ${colorConfig.bg} border ${colorConfig.border}`}>
                              {block.title && (
                                <h4 className="font-bold text-slate-900 text-sm mb-1">{block.title}</h4>
                              )}
                              {block.description && (
                                <p className="text-xs text-slate-700 mb-2">{block.description}</p>
                              )}
                              {block.details?.length > 0 && (
                                <ul className="space-y-1">
                                  {block.details.map((d, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                                      <span className="font-bold text-slate-500 flex-shrink-0">{i + 1}.</span>
                                      <span>{d}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* alert */}
                      {block.type === 'alert' && (
                        <div className="border-t border-slate-100 pt-4">
                          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                              {block.title && (
                                <p className="font-semibold text-amber-900 text-sm">{block.title}</p>
                              )}
                              {block.content && (
                                <p className="text-xs text-amber-800 mt-0.5">{block.content}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* reference */}
                      {block.type === 'reference' && block.reference_label && (
                        <div className="border-t border-slate-100 pt-4">
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                            <LinkIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span className="text-sm font-semibold text-blue-900">{block.reference_label}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
