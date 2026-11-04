import React from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText } from 'lucide-react';
import { groupBySeparators } from '@/lib/blockContent';

const docMarkdown = {
  h2: ({ children }) => <h4 className="mt-3 text-sm font-semibold text-slate-900 first:mt-0">{children}</h4>,
  h3: ({ children }) => <h4 className="mt-3 text-sm font-semibold text-slate-900 first:mt-0">{children}</h4>,
  h4: ({ children }) => <h4 className="mt-3 text-sm font-semibold text-slate-900 first:mt-0">{children}</h4>,
  p: ({ children }) => <p className="mt-1 text-[15px] leading-relaxed text-slate-800">{children}</p>,
  ul: ({ children }) => <ul className="mt-1 list-disc space-y-1 pl-5 text-[15px] text-slate-800">{children}</ul>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
};

// Bloques administrativos del protocolo (documento base, objetivo, alcance) leídos dentro de la ficha.
function DocumentBlock({ block }) {
  if (block.type === 'criteria') {
    const groups = groupBySeparators(block.items || []);
    return (
      <div>
        {block.content && <p className="mt-1 text-[15px] leading-relaxed text-slate-800">{block.content}</p>}
        {groups.map((group, gi) => (
          <div key={gi} className="mt-2">
            {group.title && <h4 className="text-sm font-semibold text-slate-900">{group.title}</h4>}
            <ul className="mt-1 list-disc space-y-1 pl-5 text-[15px] text-slate-800">
              {group.items.map((item, i) => <li key={i}>{item.replace(/^[•·]\s*/, '')}</li>)}
            </ul>
          </div>
        ))}
      </div>
    );
  }
  return <ReactMarkdown components={docMarkdown}>{block.content || ''}</ReactMarkdown>;
}

const VALIDITY = {
  vigente: { label: 'Vigente', dot: 'bg-green-600' },
  proximo: { label: 'Próximo a vencer', dot: 'bg-amber-500' },
  vencido: { label: 'Vencido', dot: 'bg-red-600' },
};

export const hasFichaContent = (topic) => Boolean(
  topic.protocol_code || topic.protocol_edition || topic.protocol_date || topic.protocol_validity ||
  topic.protocol_objective || topic.protocol_authors?.length || topic.protocol_participants?.length
);

// Datos administrativos del documento (antes en ProtocolHeader), fuera del camino clínico.
export default function ProtocolFicha({ topic, validityStatus, pdfUrl, documentBlocks = [] }) {
  const validity = VALIDITY[validityStatus];
  const rows = [
    ['Código', topic.protocol_code],
    ['Edición', topic.protocol_edition],
    ['Elaborado', topic.protocol_date],
    ['Vigencia', topic.protocol_validity],
  ].filter(([, value]) => value);
  const authors = (topic.protocol_authors || []).filter(a => a?.name);
  const participants = topic.protocol_participants || [];

  return (
    <div className="space-y-5 text-slate-900">
      {validity && (
        <p className="flex items-center gap-2 text-xl font-bold">
          <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${validity.dot}`} />
          {validity.label}
        </p>
      )}

      {rows.length > 0 && (
        <dl className="space-y-2 text-[15px] [font-variant-numeric:tabular-nums]">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-slate-600">{label}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {authors.length > 0 && (
        <section aria-labelledby="ficha-autores" className="border-t border-slate-200 pt-4">
          <h3 id="ficha-autores" className="text-sm font-semibold text-slate-600">Autores y responsables</h3>
          <ul className="mt-2 space-y-2.5 text-[15px]">
            {authors.map((author, idx) => (
              <li key={idx}>
                {author.role && <span className="block text-[13px] text-slate-600">{author.role}</span>}
                <span className="font-medium">{author.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {participants.length > 0 && (
        <section aria-labelledby="ficha-ejecucion" className="border-t border-slate-200 pt-4">
          <h3 id="ficha-ejecucion" className="text-sm font-semibold text-slate-600">Responsables de la ejecución</h3>
          <p className="mt-1 text-[15px]">{participants.join(' · ')}</p>
        </section>
      )}

      {documentBlocks.map((block, idx) => (
        <section key={block.id || idx} aria-labelledby={`ficha-doc-${idx}`} className="border-t border-slate-200 pt-4">
          <h3 id={`ficha-doc-${idx}`} className="text-sm font-semibold text-slate-600">{block.title}</h3>
          <DocumentBlock block={block} />
        </section>
      ))}

      {topic.protocol_objective && (
        <section aria-labelledby="ficha-objetivo" className="border-t border-slate-200 pt-4">
          <h3 id="ficha-objetivo" className="text-sm font-semibold text-slate-600">Objetivo</h3>
          <p className="mt-1 text-[15px] leading-relaxed">{topic.protocol_objective}</p>
        </section>
      )}

      {pdfUrl ? (
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 text-sm font-semibold text-white hover:bg-blue-800">
          <FileText className="h-4 w-4" aria-hidden="true" />
          Abrir PDF del protocolo
        </a>
      ) : (
        <p className="text-sm text-slate-600">PDF no disponible aún.</p>
      )}
    </div>
  );
}
