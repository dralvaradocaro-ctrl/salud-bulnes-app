import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/medispense/components/ui/dialog";
import { Badge } from '@/medispense/components/ui/badge';
import { Pill, AlertTriangle, Clock, Info, Stethoscope } from 'lucide-react';

// Common adverse reactions by medication category/name
const MEDICATION_INFO: Record<string, { purpose: string; description: string; adverseReactions: string[]; tips: string[] }> = {
  'losartan': {
    purpose: 'Controlar la presión arterial alta',
    description: 'Antihipertensivo que bloquea los receptores de angiotensina II, ayudando a relajar los vasos sanguíneos y reducir la presión arterial.',
    adverseReactions: ['Mareos', 'Tos seca (menos frecuente que IECA)', 'Hipotensión', 'Hiperkalemia'],
    tips: ['Tomar a la misma hora cada día', 'Evitar suplementos de potasio', 'Controlar presión regularmente']
  },
  'metformina': {
    purpose: 'Controlar el azúcar en la sangre en diabetes tipo 2',
    description: 'Antidiabético oral que mejora la forma en que su cuerpo utiliza la insulina, reduciendo el azúcar en la sangre.',
    adverseReactions: ['Molestias gastrointestinales', 'Diarrea', 'Náuseas', 'Sabor metálico'],
    tips: ['Tomar con las comidas', 'Evitar alcohol en exceso', 'Controlar glucemia regularmente']
  },
  'insulina': {
    purpose: 'Regular el nivel de azúcar en la sangre',
    description: 'Hormona que permite que el azúcar de la sangre entre a las células para producir energía. Se usa cuando el cuerpo no produce suficiente insulina.',
    adverseReactions: ['Hipoglucemia (baja de azúcar)', 'Reacciones en sitio de inyección', 'Aumento de peso'],
    tips: ['Rotar sitios de inyección', 'Siempre tener azúcar disponible por si baja la glicemia', 'No omitir comidas']
  },
  'atorvastatina': {
    purpose: 'Reducir el colesterol malo (LDL) en la sangre',
    description: 'Estatina que disminuye la producción de colesterol en el hígado, reduciendo el riesgo de problemas cardíacos.',
    adverseReactions: ['Dolores musculares', 'Elevación de enzimas hepáticas', 'Cefalea'],
    tips: ['Tomar por la noche', 'Reportar dolores musculares inusuales', 'Control de perfil lipídico periódico']
  },
  'aspirina': {
    purpose: 'Prevenir la formación de coágulos en la sangre',
    description: 'Antiagregante plaquetario que evita que las plaquetas se peguen, reduciendo el riesgo de infartos y accidentes cerebrovasculares.',
    adverseReactions: ['Molestias gástricas', 'Sangrado digestivo', 'Hematomas fáciles'],
    tips: ['Tomar con comida', 'Evitar otros antiinflamatorios sin indicación', 'Informar antes de cirugías']
  },
  'levotiroxina': {
    purpose: 'Reemplazar la hormona tiroidea cuando la tiroides no produce suficiente',
    description: 'Hormona tiroidea sintética que regula el metabolismo, la energía y el funcionamiento de los órganos.',
    adverseReactions: ['Taquicardia', 'Nerviosismo', 'Insomnio', 'Pérdida de peso'],
    tips: ['Tomar en ayunas 30-60 min antes del desayuno', 'No tomar con calcio o hierro', 'Control de TSH regular']
  },
  'amlodipino': {
    purpose: 'Reducir la presión arterial relajando los vasos sanguíneos',
    description: 'Bloqueador de canales de calcio que ensancha las arterias, facilitando el paso de la sangre.',
    adverseReactions: ['Edema de tobillos', 'Rubor facial', 'Cefalea', 'Palpitaciones'],
    tips: ['Puede tomarse con o sin alimentos', 'Evitar pomelo', 'Controlar presión regularmente']
  },
  'enalapril': {
    purpose: 'Tratar la presión alta y proteger el corazón',
    description: 'Inhibidor de la enzima convertidora de angiotensina (ECA) que relaja los vasos sanguíneos y reduce la carga sobre el corazón.',
    adverseReactions: ['Tos seca persistente', 'Mareos', 'Hipotensión', 'Hiperkalemia'],
    tips: ['Evitar suplementos de potasio', 'Levantarse lentamente', 'Control de función renal']
  },
  'clopidogrel': {
    purpose: 'Prevenir coágulos de sangre después de un evento cardíaco',
    description: 'Antiagregante plaquetario que impide que las plaquetas formen coágulos, protegiendo contra infartos y ACV.',
    adverseReactions: ['Sangrado', 'Hematomas', 'Dolor abdominal', 'Diarrea'],
    tips: ['No suspender sin indicación médica', 'Informar antes de procedimientos', 'Evitar lesiones']
  },
  'bisoprolol': {
    purpose: 'Reducir la presión arterial y proteger el corazón',
    description: 'Betabloqueador que disminuye la frecuencia cardíaca y la presión arterial, reduciendo el trabajo del corazón.',
    adverseReactions: ['Bradicardia', 'Fatiga', 'Extremidades frías', 'Mareos'],
    tips: ['No suspender bruscamente', 'Controlar frecuencia cardíaca', 'Evitar cambios posturales rápidos']
  },
  'omeprazol': {
    purpose: 'Proteger el estómago reduciendo la producción de ácido',
    description: 'Inhibidor de bomba de protones que reduce la cantidad de ácido del estómago, previniendo úlceras y reflujo.',
    adverseReactions: ['Cefalea', 'Diarrea', 'Dolor abdominal', 'Déficit de vitamina B12 (uso prolongado)'],
    tips: ['Tomar 30 min antes del desayuno', 'Revisar necesidad de uso prolongado', 'Suplementar B12 si es necesario']
  },
  'furosemida': {
    purpose: 'Eliminar exceso de líquido del cuerpo',
    description: 'Diurético de asa que ayuda a los riñones a eliminar agua y sal, reduciendo la hinchazón y la presión arterial.',
    adverseReactions: ['Hipokalemia (baja de potasio)', 'Deshidratación', 'Mareos', 'Calambres'],
    tips: ['Tomar por la mañana para evitar ir al baño de noche', 'Consumir alimentos ricos en potasio', 'Controlar peso diariamente']
  },
  'warfarina': {
    purpose: 'Prevenir la formación de coágulos peligrosos',
    description: 'Anticoagulante oral que reduce la capacidad de coagulación de la sangre, previniendo trombosis y embolias.',
    adverseReactions: ['Sangrado', 'Hematomas', 'Sangrado de encías', 'Sangre en orina'],
    tips: ['Mantener dieta constante en vitamina K', 'Control de INR regular', 'Evitar cambios bruscos de dieta']
  },
  'carvedilol': {
    purpose: 'Proteger el corazón y bajar la presión arterial',
    description: 'Betabloqueador que reduce la frecuencia cardíaca y relaja los vasos sanguíneos, mejorando la función del corazón.',
    adverseReactions: ['Mareos', 'Fatiga', 'Bradicardia', 'Hipotensión'],
    tips: ['Tomar con alimentos', 'No suspender bruscamente', 'Levantarse despacio']
  },
  'ácido acetilsalicílico': {
    purpose: 'Prevenir la formación de coágulos en la sangre',
    description: 'Antiagregante plaquetario para prevención cardiovascular.',
    adverseReactions: ['Molestias gástricas', 'Sangrado digestivo', 'Hematomas fáciles'],
    tips: ['Tomar con comida', 'Evitar otros antiinflamatorios', 'Informar antes de cirugías']
  },
};

const getDefaultInfo = () => ({
  purpose: 'Tratamiento indicado por su médico',
  description: 'Medicamento prescrito según su condición clínica.',
  adverseReactions: ['Consulte a su médico ante cualquier molestia inusual'],
  tips: ['Tome según indicación médica', 'No suspenda sin consultar']
});

const findMedicationInfo = (medicationName: string) => {
  const nameLower = medicationName.toLowerCase();
  
  for (const [key, value] of Object.entries(MEDICATION_INFO)) {
    if (nameLower.includes(key)) {
      return value;
    }
  }
  
  return getDefaultInfo();
};

interface MedicationInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medication: {
    medication_name: string;
    prescribed_dose: number;
    prescribed_unit: string;
    frequency: string;
    schedule: string[] | null;
    ai_description: string | null;
  } | null;
}

export function MedicationInfoDialog({ open, onOpenChange, medication }: MedicationInfoDialogProps) {
  if (!medication) return null;

  const info = findMedicationInfo(medication.medication_name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            {medication.medication_name}
          </DialogTitle>
          <DialogDescription className="sr-only">Información del medicamento</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Purpose - prominent */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm text-foreground">¿Para qué sirve?</span>
            </div>
            <p className="text-sm text-foreground font-medium">{info.purpose}</p>
            <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
          </div>

          {/* Dosage Info */}
          <div className="p-3 rounded-lg bg-accent/30">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm text-foreground">Dosis y Horarios</span>
            </div>
            <p className="text-sm">
              <strong>{medication.prescribed_dose}{medication.prescribed_unit}</strong> - {medication.frequency}
            </p>
            {medication.schedule && medication.schedule.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {medication.schedule.map((time, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {time}
                  </Badge>
                ))}
              </div>
            )}
            {medication.ai_description && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                {medication.ai_description}
              </p>
            )}
          </div>

          {/* Adverse Reactions - FIXED CONTRAST */}
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="font-medium text-sm text-foreground">Efectos Adversos a Vigilar</span>
            </div>
            <ul className="text-sm space-y-1">
              {info.adverseReactions.map((reaction, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                  <span className="text-foreground">{reaction}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Si presenta alguno de estos síntomas de forma severa, consulte a su médico.
            </p>
          </div>

          {/* Tips */}
          <div className="p-3 rounded-lg bg-accent/30 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm text-foreground">Recomendaciones</span>
            </div>
            <ul className="text-sm space-y-1">
              {info.tips.map((tip, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-foreground">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
