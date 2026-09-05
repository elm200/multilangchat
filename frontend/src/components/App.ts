import { html } from '../html.js';
import { useChatConnection } from '../socket.js';
import { Login } from './Login.js';
import { ChatLayout } from './ChatLayout.js';
import type { ComponentChildren } from 'preact';

export function App(): ComponentChildren {
  const { phase, myUserId, connected, loginError, log, rooms, roomsReady, lang, t, login, leave, sendMessage } =
    useChatConnection();

  if (phase !== 'in') {
    return html`<${Login} onLogin=${login} error=${loginError} initialLang=${lang} />`;
  }
  return html`
    <${ChatLayout}
      myUserId=${myUserId}
      connected=${connected}
      log=${log}
      rooms=${rooms}
      roomsReady=${roomsReady}
      lang=${lang}
      t=${t}
      onSend=${sendMessage}
      onLeave=${leave}
    />
  `;
}
