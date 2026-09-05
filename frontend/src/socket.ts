import { useState, useRef, useCallback, useEffect } from 'preact/hooks';
import { resolveLang, resolveInitialLang, makeTranslator } from './i18n/index.js';
import type { Lang } from './i18n/index.js';
import type { LogEntry, Occupant, ServerPayload, StoredIdentity } from './types.js';

export interface ChatConnection {
  phase: 'pre' | 'in';
  myName: string | null;
  myUserId: string | null;
  connected: boolean;
  loginError: string | null;
  log: LogEntry[];
  rooms: Occupant[];
  roomsReady: boolean;
  lang: Lang;
  t: (key: string, params?: Record<string, string | number>) => string;
  login: (name: string, passphrase: string, lang: Lang) => void;
  leave: () => void;
  sendMessage: (text: string) => void;
}

const STORAGE_KEY = 'chat-room-identity';
const MAX_RECONNECT_DELAY_MS = 15000;

function readIdentity(): StoredIdentity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.userId === 'string' && typeof parsed.token === 'string' && typeof parsed.name === 'string') {
      return parsed;
    }
  } catch {
    // 壊れた保存内容は無視して未ログイン扱いにする。
  }
  return null;
}

function writeIdentity(identity: StoredIdentity): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}

function clearIdentity(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function wsUrl(): string {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}/ws`;
}

function parsePayload(raw: string): ServerPayload | null {
  try {
    return JSON.parse(raw) as ServerPayload;
  } catch {
    return null;
  }
}

/**
 * 同じidのエントリを更新、無ければ追加する(id発番はchat/system共通なので衝突しない)。
 * 再接続時のhistory再送での重複表示と、自分の発言の即時エコー→翻訳後更新を両方吸収する。
 */
function mergeEntry(prev: LogEntry[], entry: LogEntry): LogEntry[] {
  const idx = prev.findIndex((e) => e.id === entry.id);
  if (idx !== -1) {
    const next = [...prev];
    next[idx] = entry;
    return next;
  }
  return [...prev, entry];
}

/**
 * Owns the WebSocket connection lifecycle and the User ID/Token identity that
 * survives page reloads (but not an explicit leave, which discards it both
 * here and on the server).
 */
export function useChatConnection(): ChatConnection {
  const [identity, setIdentity] = useState(() => readIdentity());
  // ログイン画面の初期言語(?lang→ブラウザ既定→英語)。ページ生存中は変わらない。
  const [initialLang] = useState(() => resolveInitialLang());
  // ログイン済みならユーザーに紐づいた言語を使う(旧データでlang未設定なら既定言語)。
  const lang = identity ? resolveLang(identity.lang) : initialLang;
  const t = makeTranslator(lang);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [rooms, setRooms] = useState<Occupant[]>([]);
  const [connected, setConnected] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  // 「まだ最初の在室状況を受け取っていない」と「本当に誰もいない」を区別するためのフラグ。
  const [roomsReady, setRoomsReady] = useState(false);

  const identityRef = useRef(identity);
  const wsRef = useRef<WebSocket | null>(null);
  const leavingRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(1000);

  useEffect(() => {
    identityRef.current = identity;
  }, [identity]);

  const handlePayload = useCallback((payload: ServerPayload) => {
    if (payload.type === 'history') {
      setLog((prev) => payload.messages.reduce(mergeEntry, prev));
      return;
    }
    if (payload.type === 'chat' || payload.type === 'system') {
      const { rooms: nextRooms, ...entry } = payload;
      setLog((prev) => mergeEntry(prev, entry));
      setRooms(nextRooms);
      setRoomsReady(true);
    }
  }, []);

  const resetToLoggedOut = useCallback(() => {
    clearIdentity();
    identityRef.current = null;
    setIdentity(null);
    setConnected(false);
    setLog([]);
    setRooms([]);
    setRoomsReady(false);
  }, []);

  // resumeとscheduleReconnectは相互参照だが、setTimeoutは非同期呼び出しなので宣言順は問題ない。
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) return;
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      if (identityRef.current) resume(identityRef.current);
    }, reconnectDelayRef.current);
    reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, MAX_RECONNECT_DELAY_MS);
  }, []);

  /** 保存済みのUser ID/Tokenで接続を(再)開する。新規タブ・リロード・自動再接続で使う。 */
  const resume = useCallback(
    (id: StoredIdentity) => {
      const ws = new WebSocket(wsUrl());
      wsRef.current = ws;
      let settled = false;
      ws.onopen = () => ws.send(JSON.stringify({ type: 'resume', userId: id.userId, token: id.token }));
      ws.onmessage = (event) => {
        const payload = parsePayload(event.data);
        if (!payload) return;
        if (payload.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }
        if (!settled) {
          settled = true;
          if (payload.type === 'resume_ok') {
            setConnected(true);
            setRooms(payload.rooms);
            setRoomsReady(true);
            reconnectDelayRef.current = 1000;
            return;
          }
          if (payload.type === 'resume_error') {
            // サーバー再起動等でTokenが失効している。ログイン画面に戻す。
            resetToLoggedOut();
            return;
          }
        }
        handlePayload(payload);
      };
      ws.onclose = () => {
        setConnected(false);
        if (identityRef.current && !leavingRef.current) scheduleReconnect();
      };
    },
    [handlePayload, resetToLoggedOut, scheduleReconnect],
  );

  const login = useCallback(
    (name: string, passphrase: string, lang: Lang) => {
      leavingRef.current = false;
      setLoginError(null);
      const ws = new WebSocket(wsUrl());
      wsRef.current = ws;
      let settled = false;
      ws.onopen = () => ws.send(JSON.stringify({ type: 'login', name, passphrase, lang }));
      ws.onmessage = (event) => {
        const payload = parsePayload(event.data);
        if (!payload) return;
        if (payload.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }
        if (!settled) {
          settled = true;
          if (payload.type === 'login_ok') {
            const id = { userId: payload.userId, token: payload.token, name, lang };
            writeIdentity(id);
            identityRef.current = id;
            setIdentity(id);
            setConnected(true);
            setRooms(payload.rooms);
            setRoomsReady(true);
            reconnectDelayRef.current = 1000;
            return;
          }
          if (payload.type === 'login_error') {
            const loginT = makeTranslator(lang);
            const key =
              payload.reason === 'passphrase'
                ? 'login.error.passphrase'
                : payload.reason === 'room_full_langs'
                  ? 'login.error.roomFull'
                  : 'login.error.generic';
            setLoginError(loginT(key));
            return;
          }
        }
        handlePayload(payload);
      };
      ws.onclose = () => {
        setConnected(false);
        if (identityRef.current && !leavingRef.current) scheduleReconnect();
      };
    },
    [handlePayload, scheduleReconnect],
  );

  const leave = useCallback(() => {
    leavingRef.current = true;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'leave' }));
    }
    resetToLoggedOut();
  }, [resetToLoggedOut]);

  const sendMessage = useCallback((text: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'chat', text }));
  }, []);

  useEffect(() => {
    // 保存済みのUser ID/Tokenがあれば自動で再開する。
    if (identityRef.current) resume(identityRef.current);
    // マウント時に一度だけ実行する(resumeは依存に含めない)。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    phase: identity ? 'in' : 'pre',
    myName: identity?.name ?? null,
    myUserId: identity?.userId ?? null,
    connected,
    loginError,
    log,
    rooms,
    roomsReady,
    lang,
    t,
    login,
    leave,
    sendMessage,
  };
}
