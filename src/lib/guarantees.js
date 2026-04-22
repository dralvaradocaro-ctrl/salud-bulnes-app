export function hasVisibleGuaranteeDays(value) {
  if (value === null || value === undefined || value === '') return false;

  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return numericValue > 0;
  }

  return String(value).trim().length > 0;
}

export function hasGuaranteeContent(topic = {}) {
  const hasDetails = typeof topic.guarantee_details === 'string' && topic.guarantee_details.trim().length > 0;
  return hasVisibleGuaranteeDays(topic.guarantee_days) || hasDetails;
}

function normalizeGuaranteeLine(line = '') {
  return line.replace(/\s+/g, ' ').trim();
}

function getTimeframeFromText(text = '') {
  const normalizedText = normalizeGuaranteeLine(text);
  const daysMatch = normalizedText.match(/(\d+)\s*d[ií]as?/i);
  if (daysMatch) {
    return `${daysMatch[1]} días`;
  }

  const hoursMatch = normalizedText.match(/(\d+(?:[.,]\d+)?)\s*horas?/i);
  if (hoursMatch) {
    return `${hoursMatch[1].replace(',', '.')} horas`;
  }

  const minutesMatch = normalizedText.match(/<?\s*(\d+)\s*min/i);
  if (minutesMatch) {
    return `${minutesMatch[1]} min`;
  }

  if (/inmediata|inmediato/i.test(normalizedText)) {
    return 'Inmediata';
  }

  return '';
}

export function extractGuaranteeStages(topic = {}) {
  const details = typeof topic.guarantee_details === 'string' ? topic.guarantee_details.trim() : '';
  const stages = [];

  if (details) {
    for (const rawLine of details.split('\n')) {
      const line = normalizeGuaranteeLine(rawLine);
      if (!line) continue;

      const separatorIndex = line.indexOf(':');
      if (separatorIndex > -1) {
        const label = line.slice(0, separatorIndex).trim();
        const remainder = line.slice(separatorIndex + 1).trim();
        stages.push({
          label,
          timeframe: getTimeframeFromText(remainder),
          description: remainder,
        });
        continue;
      }

      stages.push({
        label: 'Garantía',
        timeframe: getTimeframeFromText(line),
        description: line,
      });
    }
  }

  if (stages.length === 0 && hasVisibleGuaranteeDays(topic.guarantee_days)) {
    stages.push({
      label: 'Oportunidad principal',
      timeframe: `${topic.guarantee_days} días`,
      description: `Prestación garantizada en ${topic.guarantee_days} días.`,
    });
  }

  return stages;
}
