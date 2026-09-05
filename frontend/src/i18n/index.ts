import ja from './ja.js';
import en from './en.js';
import zh from './zh.js';
import ko from './ko.js';
import th from './th.js';
import vi from './vi.js';
import es from './es.js';

export type Lang = 'ja' | 'en' | 'zh' | 'ko' | 'th' | 'vi' | 'es';

export interface Dictionary {
  login: {
    title: string;
    subtitle: string;
    namePlaceholder: string;
    passphrasePlaceholder: string;
    submit: string;
    privacyNote: string;
    error: {
      passphrase: string;
      generic: string;
      roomFull: string;
    };
  };
  topbar: {
    title: string;
    connected: string;
    reconnecting: string;
    leave: string;
  };
  room: {
    alt: string;
    loading: string;
    empty: string;
  };
  chat: {
    inputPlaceholder: string;
    send: string;
  };
  system: {
    joined: string;
    left: string;
  };
}

const DICTIONARIES = { ja, en, zh, ko, th, vi, es };

export const SUPPORTED_LANGS = Object.keys(DICTIONARIES) as Lang[];

// サポート外/未指定の言語はここにフォールバックする。
export const DEFAULT_LANG: Lang = 'en';

/** ログイン画面の言語ドロップダウンに出す、各言語の自称(その言語自身での呼び名)。 */
export const LANGUAGE_NAMES: Record<Lang, string> = {
  ja: '日本語',
  en: 'English',
  zh: '中文',
  ko: '한국어',
  th: 'ไทย',
  vi: 'Tiếng Việt',
  es: 'español',
};

/** サポート対象かどうかを検証し、未サポートなら DEFAULT_LANG を返す。 */
export function resolveLang(candidate: unknown): Lang {
  return SUPPORTED_LANGS.includes(candidate as Lang) ? (candidate as Lang) : DEFAULT_LANG;
}

/** `?lang=` が対応言語ならそれを返す。無効/未指定なら null。 */
function langFromQuery(): Lang | null {
  const raw = new URLSearchParams(location.search).get('lang');
  return SUPPORTED_LANGS.includes(raw as Lang) ? (raw as Lang) : null;
}

/**
 * ブラウザの言語設定(`navigator.languages` を優先)から対応言語を探す。
 * `en-US` のようなサブタグ付き表記は先頭の主タグだけで判定する。
 */
function langFromBrowser(): Lang | null {
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const raw of candidates) {
    const primary = raw?.split('-')[0] as Lang;
    if (SUPPORTED_LANGS.includes(primary)) return primary;
  }
  return null;
}

/**
 * ログイン画面の初期言語を、
 * (1) `?lang=` クエリ → (2) ブラウザの既定言語 → (3) 英語 の優先順位で解決する。
 */
export function resolveInitialLang(): Lang {
  return langFromQuery() ?? langFromBrowser() ?? DEFAULT_LANG;
}

/** 言語バッジ用、`/assets/flags.png` スプライト内の横位置(px)。SUPPORTED_LANGSと同じ並びで1コマ20px。 */
export function flagSpriteOffsetPx(candidate: unknown): number {
  return SUPPORTED_LANGS.indexOf(resolveLang(candidate)) * 20;
}

/** `a.b.c` 形式のドット区切りキーで辞書を辿る。 */
function lookup(lang: Lang, key: string): string {
  let node: any = DICTIONARIES[lang];
  for (const part of key.split('.')) {
    node = node?.[part];
  }
  if (typeof node !== 'string') {
    // 未サポートキーは開発中に気付けるようキーそのものを表示する。
    return key;
  }
  return node;
}

/** 指定言語に束縛された翻訳関数を作る。 */
export function makeTranslator(lang: Lang): (key: string, params?: Record<string, string | number>) => string {
  return (key, params) => {
    const template = lookup(lang, key);
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (match, name) =>
      Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
    );
  };
}
