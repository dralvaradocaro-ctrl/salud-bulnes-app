import { AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/medispense/components/ui/alert';
import { Badge } from '@/medispense/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/medispense/components/ui/tooltip';

interface RiskWarningsProps {
  diagnoses: string[] | null;
  age: number | null;
  medicationNames: string[];
}

interface RiskItem {
  level: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  criteria?: string;
}

// Medications requiring renal dose adjustment
const RENAL_RISK_MEDS: Record<string, string> = {
  'metformina': 'Contraindicada en ERC severa (TFG <30). Ajustar dosis si TFG 30-45.',
  'enalapril': 'Reducir dosis en ERC. Monitorear potasio y creatinina.',
  'lisinopril': 'Reducir dosis en ERC. Monitorear potasio.',
  'losartan': 'Precaución en ERC. Monitorear función renal y potasio.',
  'valsartan': 'Precaución en ERC. Monitorear función renal.',
  'espironolactona': 'Riesgo de hiperkalemia en ERC. Contraindicada si TFG <30.',
  'alopurinol': 'Reducir dosis según TFG. Iniciar con 100mg.',
  'dabigatran': 'Contraindicado si ClCr <30. Ajustar dosis si ClCr 30-50.',
  'rivaroxaban': 'Ajustar dosis si ClCr 15-50. Evitar si ClCr <15.',
  'apixaban': 'Ajustar dosis en ERC. Precaución si ClCr <25.',
  'sulfato ferroso': 'Puede acumularse. Monitorear niveles.',
  'glibenclamida': 'Evitar en ERC (riesgo de hipoglicemia prolongada). Preferir glipizida.',
  'hidroclorotiazida': 'Ineficaz si TFG <30. Considerar furosemida.',
};

// Medications requiring hepatic caution
const HEPATIC_RISK_MEDS: Record<string, string> = {
  'atorvastatina': 'Riesgo de hepatotoxicidad. Monitorear transaminasas.',
  'simvastatina': 'Contraindicada en enfermedad hepática activa.',
  'metformina': 'Precaución en disfunción hepática severa (riesgo de acidosis láctica).',
  'paracetamol': 'Reducir dosis máxima a 2g/día. Riesgo de hepatotoxicidad.',
  'warfarina': 'Metabolismo hepático alterado. Mayor riesgo de sangrado.',
  'acenocumarol': 'Mayor sensibilidad en daño hepático. Ajustar dosis.',
  'diclofenaco': 'Riesgo de hepatotoxicidad. Evitar si es posible.',
  'amitriptilina': 'Metabolismo reducido. Iniciar con dosis bajas.',
  'valproato': 'Contraindicado en enfermedad hepática severa.',
};

// Beers Criteria / STOPP-START medications for elderly
const ELDERLY_RISK_MEDS: Record<string, { criteria: string; description: string }> = {
  'glibenclamida': { criteria: 'Beers/STOPP', description: 'Riesgo de hipoglicemia prolongada en adulto mayor. Preferir glimepirida o linagliptina.' },
  'amitriptilina': { criteria: 'Beers', description: 'Altamente anticolinérgico. Riesgo de confusión, caídas, retención urinaria.' },
  'diazepam': { criteria: 'Beers', description: 'Benzodiacepina de acción prolongada. Riesgo de caídas y fracturas.' },
  'clonazepam': { criteria: 'Beers', description: 'Benzodiacepina. Riesgo de sedación excesiva, caídas.' },
  'alprazolam': { criteria: 'Beers', description: 'Benzodiacepina. Riesgo de caídas. Usar la menor dosis y duración.' },
  'lorazepam': { criteria: 'Beers', description: 'Benzodiacepina. Precaución por riesgo de caídas.' },
  'zolpidem': { criteria: 'Beers', description: 'Riesgo de caídas y fracturas en adulto mayor.' },
  'digoxina': { criteria: 'STOPP', description: 'No usar >125mcg/día en adulto mayor (toxicidad).' },
  'ibuprofeno': { criteria: 'STOPP', description: 'AINE. Riesgo GI, renal y cardiovascular en adulto mayor.' },
  'naproxeno': { criteria: 'STOPP', description: 'AINE. Evitar uso prolongado por riesgo GI y renal.' },
  'diclofenaco': { criteria: 'STOPP', description: 'AINE. Alto riesgo cardiovascular y GI.' },
  'nifedipino': { criteria: 'Beers', description: 'Liberación inmediata: riesgo de hipotensión.' },
  'doxazosina': { criteria: 'Beers', description: 'Riesgo de hipotensión ortostática.' },
  'metildopa': { criteria: 'Beers', description: 'Riesgo de bradicardia y depresión.' },
  'metoclopramida': { criteria: 'Beers', description: 'Riesgo de efectos extrapiramidales. No usar >12 semanas.' },
};

// Drug-drug interaction warnings
const INTERACTION_PAIRS: Array<{ drugs: [string, string]; warning: string }> = [
  { drugs: ['enalapril', 'espironolactona'], warning: 'Riesgo de hiperkalemia severa. Monitorear potasio frecuentemente.' },
  { drugs: ['losartan', 'espironolactona'], warning: 'Riesgo de hiperkalemia. Monitorear electrolitos.' },
  { drugs: ['warfarina', 'aspirina'], warning: 'Mayor riesgo de sangrado. Evaluar necesidad de ambos.' },
  { drugs: ['acenocumarol', 'aspirina'], warning: 'Riesgo hemorrágico aumentado.' },
  { drugs: ['metformina', 'furosemida'], warning: 'Furosemida puede empeorar función renal y afectar metformina.' },
  { drugs: ['enalapril', 'losartan'], warning: 'Doble bloqueo SRAA: riesgo de hiperkalemia y daño renal.' },
  { drugs: ['digoxina', 'amiodarona'], warning: 'Amiodarona aumenta niveles de digoxina. Reducir dosis de digoxina.' },
  { drugs: ['clopidogrel', 'omeprazol'], warning: 'Omeprazol reduce eficacia de clopidogrel. Preferir pantoprazol.' },
  { drugs: ['simvastatina', 'amlodipino'], warning: 'No exceder simvastatina 20mg con amlodipino (riesgo de miopatía).' },
];

function matchesMedName(medName: string, keyword: string): boolean {
  return medName.toLowerCase().includes(keyword.toLowerCase());
}

export function RiskWarnings({ diagnoses, age, medicationNames }: RiskWarningsProps) {
  const risks: RiskItem[] = [];
  const hasRenalDisease = diagnoses?.includes('enfermedad_renal');
  const hasHepaticDisease = diagnoses?.includes('enfermedad_hepatica');
  const isElderly = age !== null && age >= 65;

  // Renal risks
  if (hasRenalDisease) {
    for (const medName of medicationNames) {
      for (const [keyword, warning] of Object.entries(RENAL_RISK_MEDS)) {
        if (matchesMedName(medName, keyword)) {
          risks.push({
            level: 'error',
            title: `⚠️ Ajuste renal: ${medName}`,
            description: warning,
          });
        }
      }
    }
  }

  // Hepatic risks
  if (hasHepaticDisease) {
    for (const medName of medicationNames) {
      for (const [keyword, warning] of Object.entries(HEPATIC_RISK_MEDS)) {
        if (matchesMedName(medName, keyword)) {
          risks.push({
            level: 'error',
            title: `🔴 Precaución hepática: ${medName}`,
            description: warning,
          });
        }
      }
    }
  }

  // Elderly risks (Beers/STOPP)
  if (isElderly) {
    for (const medName of medicationNames) {
      for (const [keyword, info] of Object.entries(ELDERLY_RISK_MEDS)) {
        if (matchesMedName(medName, keyword)) {
          risks.push({
            level: 'warning',
            title: `👴 ${info.criteria}: ${medName}`,
            description: info.description,
            criteria: info.criteria,
          });
        }
      }
    }
  }

  // Drug-drug interactions
  for (const interaction of INTERACTION_PAIRS) {
    const [drugA, drugB] = interaction.drugs;
    const hasA = medicationNames.some(m => matchesMedName(m, drugA));
    const hasB = medicationNames.some(m => matchesMedName(m, drugB));
    if (hasA && hasB) {
      risks.push({
        level: 'warning',
        title: `💊 Interacción: ${drugA} + ${drugB}`,
        description: interaction.warning,
      });
    }
  }

  if (risks.length === 0) return null;

  const errors = risks.filter(r => r.level === 'error');
  const warnings = risks.filter(r => r.level === 'warning');

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <ShieldAlert className="h-5 w-5 text-destructive" />
        <h3 className="font-semibold text-sm">Alertas de Seguridad ({risks.length})</h3>
      </div>

      {errors.map((risk, i) => (
        <Alert key={`err-${i}`} variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">{risk.title}</AlertTitle>
          <AlertDescription className="text-xs">{risk.description}</AlertDescription>
        </Alert>
      ))}

      {warnings.map((risk, i) => (
        <Alert key={`warn-${i}`} className="py-2 border-warning/50 bg-warning/5">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-xs font-semibold">{risk.title}</AlertTitle>
          <AlertDescription className="text-xs">
            {risk.description}
            {risk.criteria && (
              <Badge variant="outline" className="ml-2 text-[10px]">{risk.criteria}</Badge>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
