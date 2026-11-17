import { RecetaMedica } from './RecetaMedica';
import { conPuertaAcceso } from '@/components/PuertaAcceso';

function DerivacionProfesionales() {
  return <RecetaMedica derivacion />;
}
export default conPuertaAcceso(DerivacionProfesionales, { storageKey: 'acceso_medico', descripcion: 'Ingresa el código de acceso para emitir derivaciones.' });
