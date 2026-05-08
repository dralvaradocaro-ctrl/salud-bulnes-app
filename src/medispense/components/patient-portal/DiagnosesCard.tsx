import { Card, CardContent, CardHeader, CardTitle } from '@/medispense/components/ui/card';
import { Heart } from 'lucide-react';
import { DIAGNOSIS_LABELS } from '@/medispense/lib/diagnosis-options';

interface DiagnosesCardProps {
  diagnoses: string[] | null;
}

export function DiagnosesCard({ diagnoses }: DiagnosesCardProps) {
  if (!diagnoses || diagnoses.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Heart className="h-5 w-5 text-primary" />
          Mis Diagnósticos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {diagnoses.map((diagnosis) => {
            const label = DIAGNOSIS_LABELS[diagnosis] || diagnosis;
            return (
              <div key={diagnosis} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {label}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
