export function extractSpecificIndication(aiDescription: string | null): string | null {
  if (!aiDescription) return null;
  const match = aiDescription.match(/💊\s*(.+?)(?:\s*\||\s*$)/);
  return match ? match[1].trim() : null;
}

export function extractTabletDisplay(aiDescription: string | null): string | null {
  if (!aiDescription) return null;
  const match = aiDescription.match(/(½|¼|¾|\d+½|\d+)\s*comprimido/i);
  return match ? match[0] : null;
}

export function extractTabletInfo(aiDescription: string | null, hour: number): string | null {
  if (!aiDescription) return null;
  const hourStr = hour.toString().padStart(2, '0');
  const regex = new RegExp(`(½|¼|¾|\\d+½|\\d+)\\s*comp\\s*a\\s*las\\s*${hourStr}:\\d+`, 'i');
  const match = aiDescription.match(regex);
  return match ? match[0].replace(/a las \d+:\d+/i, '').trim() : null;
}

export function extractCustomPresentation(aiDescription: string | null): string | null {
  if (!aiDescription) return null;
  const match = aiDescription.match(/Presentación:\s*(.+?)(?:\s*\||$)/);
  return match ? match[1].trim() : null;
}

const TABLET_FRACTION_MAP: Record<string, string> = {
  '½': '.5',
  '¼': '.25',
  '¾': '.75',
};

export function extractTabletsPerDose(aiDescription: string | null): number {
  if (!aiDescription) return 1;
  const match = aiDescription.match(/(½|¼|¾|\d+½|\d+(?:\.\d+)?)\s*(?:comprimido|cápsula|tableta|comp)/i);
  if (!match) return 1;
  let raw = match[1];
  for (const [glyph, dec] of Object.entries(TABLET_FRACTION_MAP)) {
    raw = raw.replace(glyph, dec);
  }
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 1;
}
