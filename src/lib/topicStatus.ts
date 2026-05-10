/**
 * Estado del protocolo de un topic GES.
 *
 *  - 'local'     → tiene protocolo local desarrollado (has_local_protocol === true).
 *  - 'checklist' → solo tiene pauta de cotejo (bloque type:'checklist' en content_blocks)
 *                  y no tiene protocolo local.
 *  - 'none'      → ni protocolo local ni pauta de cotejo cargada.
 */
export type TopicProtocolStatus = 'local' | 'checklist' | 'none';

interface TopicLike {
  has_local_protocol?: boolean | null;
  content_blocks?: unknown;
}

const hasChecklistBlock = (content_blocks: unknown): boolean => {
  if (!Array.isArray(content_blocks)) return false;
  return content_blocks.some(
    (b) => b && typeof b === 'object' && (b as { type?: unknown }).type === 'checklist',
  );
};

export function getTopicProtocolStatus(topic: TopicLike | null | undefined): TopicProtocolStatus {
  if (!topic) return 'none';
  if (topic.has_local_protocol === true) return 'local';
  if (hasChecklistBlock(topic.content_blocks)) return 'checklist';
  return 'none';
}

export const TOPIC_STATUS_LABELS: Record<TopicProtocolStatus, string> = {
  local: 'Protocolo local activo',
  checklist: 'Pauta de cotejo',
  none: 'Sin protocolo',
};
