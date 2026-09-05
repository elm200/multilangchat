import { html } from '../html.js';
import { RoomPanel } from './RoomPanel.js';
import { ChatLog } from './ChatLog.js';
import { ChatInput } from './ChatInput.js';
import type { ComponentChildren } from 'preact';
import type { LogEntry, Occupant } from '../types.js';

interface ChatLayoutProps {
  myUserId: string | null;
  connected: boolean;
  log: LogEntry[];
  rooms: Occupant[];
  roomsReady: boolean;
  lang: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  onSend: (text: string) => void;
  onLeave: () => void;
}

export function ChatLayout({
  myUserId,
  connected,
  log,
  rooms,
  roomsReady,
  lang,
  t,
  onSend,
  onLeave,
}: ChatLayoutProps): ComponentChildren {
  return html`
    <div id="layout">
      <${RoomPanel} rooms=${rooms} loading=${!roomsReady} t=${t} />
      <div id="app">
        <div id="topbar">
          <div class="avatar">💬</div>
          <div class="info">
            <div class="title">${t('topbar.title')}</div>
            <div class="status">
              <span class="dot ${connected ? '' : 'dot-off'}"></span>${connected
                ? t('topbar.connected')
                : t('topbar.reconnecting')}
            </div>
          </div>
          <button id="leaveButton" type="button" onClick=${onLeave}>${t('topbar.leave')}</button>
        </div>
        <${ChatLog} entries=${log} myUserId=${myUserId} lang=${lang} t=${t} />
        <${ChatInput} onSend=${onSend} t=${t} />
      </div>
    </div>
  `;
}
