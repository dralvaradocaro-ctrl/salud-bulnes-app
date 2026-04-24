import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

export default function FirmaDigital({ onSave, value }) {
  const sigRef = useRef(null);

  const clear = () => {
    sigRef.current?.clear();
    onSave('');
  };

  const save = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      onSave(sigRef.current.toDataURL());
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {value ? (
        <div className="flex flex-col items-center gap-1">
          <img src={value} alt="Firma" className="border" style={{ width: 200, height: 80 }} />
          <button type="button" className="text-xs underline text-muted-foreground no-print" onClick={clear}>
            Borrar firma
          </button>
        </div>
      ) : (
        <>
          <div className="border" style={{ width: 200, height: 80 }}>
            <SignatureCanvas
              ref={sigRef}
              penColor="black"
              canvasProps={{ width: 200, height: 80, style: { background: 'white' } }}
              onEnd={save}
            />
          </div>
          <button type="button" className="text-xs underline text-muted-foreground no-print" onClick={clear}>
            Limpiar
          </button>
        </>
      )}
    </div>
  );
}
