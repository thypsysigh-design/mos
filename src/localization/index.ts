import ko from './ko.json';
import { catalogs } from './catalogs';

export type TextId = keyof typeof ko;
export type Locale = keyof typeof catalogs;
export type TextParams = Record<string, string | number>;
const configuredLocale = process.env.EXPO_PUBLIC_GAME_LOCALE || 'ko';
export const locale: Locale = Object.hasOwn(catalogs, configuredLocale) ? configuredLocale as Locale : 'ko';

export function textForLocale(language: Locale, id: TextId, params: TextParams = {}): string {
  const translated = (catalogs[language] as Record<string, string>)[id];
  const template = translated || ko[id];
  if (template === undefined) throw new Error(`Unknown text ID: ${id}`);
  return template.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (_, key: string) => {
    if (!Object.hasOwn(params, key)) throw new Error(`Missing parameter ${key} for ${id}`);
    return String(params[key]);
  });
}
export function t(id: TextId, params?: TextParams): string { return textForLocale(locale, id, params); }

// These are stable identifiers in old saves, not editable display strings.
const endingIds: Record<string, TextId> = {
  '모든 이름의 새벽': 'ending.1.title',
  '다시 잡은 손': 'ending.2.title',
  '숲의 새로운 등불': 'ending.3.title',
  '닿지 못한 손': 'ending.4.title',
  '안개에 남은 발자국': 'ending.5.title',
};
export function endingText(id: string): string { return endingIds[id] ? t(endingIds[id]) : id; }
