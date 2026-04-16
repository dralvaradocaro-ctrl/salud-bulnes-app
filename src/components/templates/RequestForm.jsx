import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Copy, 
  Check, 
  Mail, 
  FileText,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import ImageProtocolForm from './ImageProtocolForm';

export default function RequestForm({ template, onClose }) {
  const [formData, setFormData] = useState({});
  const [copied, setCopied] = useState(false);
  const [generated, setGenerated] = useState('');

  // If it's an image protocol, show the specialized form
  if (template?.type === 'Protocolo Imágenes') {
    return <ImageProtocolForm onClose={onClose} />;
  }

  const handleChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const generateDocument = () => {
    let content = template.template_content || '';
    
    template.required_fields?.forEach(field => {
      const regex = new RegExp(`\\{\\{${field.field_name}\\}\\}`, 'g');
      content = content.replace(regex, formData[field.field_name] || '___________');
    });

    setGenerated(content);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    toast.success('Documento copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">{template.name}</h2>
              <p className="text-blue-100 text-sm">{template.type}</p>
            </div>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {!generated ? (
            <div className="space-y-5">
              {template.instructions && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-sm">
                  {template.instructions}
                </div>
              )}

              {template.required_fields?.map((field, idx) => (
                <div key={idx}>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">
                    {field.field_label}
                  </Label>
                  {field.field_type === 'textarea' ? (
                    <Textarea
                      value={formData[field.field_name] || ''}
                      onChange={(e) => handleChange(field.field_name, e.target.value)}
                      className="min-h-[100px]"
                      placeholder={`Ingrese ${field.field_label.toLowerCase()}`}
                    />
                  ) : (
                    <Input
                      type={field.field_type || 'text'}
                      value={formData[field.field_name] || ''}
                      onChange={(e) => handleChange(field.field_name, e.target.value)}
                      placeholder={`Ingrese ${field.field_label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}

              <Button 
                onClick={generateDocument}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
              >
                <Send className="mr-2 h-5 w-5" />
                Generar Documento
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 whitespace-pre-wrap font-mono text-sm">
                {generated}
              </div>

              {template.destination_emails?.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Enviar a:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {template.destination_emails.map((email, idx) => (
                      <a
                        key={idx}
                        href={`mailto:${email}?subject=${encodeURIComponent(template.name)}&body=${encodeURIComponent(generated)}`}
                        className="px-3 py-1.5 bg-white rounded-full text-sm text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
                      >
                        {email}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="flex-1 h-12"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-5 w-5 text-green-500" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-5 w-5" />
                      Copiar
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setGenerated('')}
                  variant="outline"
                  className="flex-1 h-12"
                >
                  Editar datos
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <Button variant="ghost" onClick={onClose} className="w-full">
            Cerrar
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}