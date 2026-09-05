export interface Occupant {
  room: number;
  name: string;
  pose: number;
  lang: string;
}

/** Identity persisted in localStorage across reloads (cleared entirely on leave). */
export interface StoredIdentity {
  userId: string;
  token: string;
  name: string;
  lang: string;
}

/**
 * システムメッセージはサーバーが完成文を作らず event + パラメータだけを送る。
 * 文言化(どの言語で表示するか)はクライアント側の i18n 辞書が担う。
 */
export type SystemEvent = 'joined' | 'left';

/**
 * `lang`は原語。`translations`は実際に訳された言語だけのキーを持つ(本人の言語は含まない)。
 * 即時エコー時点では空で、翻訳完了後のブロードキャストで埋まる。
 */
export interface HistoryChatEntry {
  type: 'chat';
  id: number;
  time: string;
  name: string;
  userId: string;
  lang: string;
  text: string;
  translations: Record<string, string>;
}

export interface HistorySystemEntry {
  type: 'system';
  id: number;
  time: string;
  event: SystemEvent;
  name: string;
  count: number;
}

export type HistoryEntry = HistoryChatEntry | HistorySystemEntry;

export interface HistoryPayload {
  type: 'history';
  messages: HistoryEntry[];
}

export interface ChatMessage {
  type: 'chat';
  id: number;
  time: string;
  name: string;
  userId: string;
  lang: string;
  text: string;
  translations: Record<string, string>;
  rooms: Occupant[];
}

export interface SystemMessage {
  type: 'system';
  id: number;
  time: string;
  event: SystemEvent;
  name: string;
  count: number;
  rooms: Occupant[];
}

export interface LoginOkPayload {
  type: 'login_ok';
  userId: string;
  token: string;
  rooms: Occupant[];
}

export interface LoginErrorPayload {
  type: 'login_error';
  reason: string;
}

export interface ResumeOkPayload {
  type: 'resume_ok';
  rooms: Occupant[];
}

export interface ResumeErrorPayload {
  type: 'resume_error';
}

export interface LeftPayload {
  type: 'left';
}

/** サーバーが定期送信する生存確認。受け取ったら即座にpongを返す。 */
export interface PingPayload {
  type: 'ping';
}

export type ServerPayload =
  | HistoryPayload
  | ChatMessage
  | SystemMessage
  | LoginOkPayload
  | LoginErrorPayload
  | ResumeOkPayload
  | ResumeErrorPayload
  | LeftPayload
  | PingPayload;

/** A log entry as rendered in the chat log (history entries flattened in). */
export type LogEntry = HistoryChatEntry | HistorySystemEntry;
