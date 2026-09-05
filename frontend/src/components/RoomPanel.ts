import { html } from '../html.js';
import { flagSpriteOffsetPx } from '../i18n/index.js';
import type { ComponentChildren } from 'preact';
import type { Occupant } from '../types.js';

// 部屋表示: 3x3。スプライトシートは9列x6行で、各部屋に3列x2行=6ポーズを割り当てる。
const ROOM_COUNT = 9;

// 言語バッジの国旗スプライト(/assets/flags.png、SUPPORTED_LANGSの並びで1コマ20px)は
// flag-icons(MIT License, https://github.com/lipis/flag-icons)のSVGを合成して作成。
// 絵文字国旗は環境依存で崩れることがあるため画像にしている。

interface RoomPanelProps {
  rooms: Occupant[];
  loading: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function RoomPanel({ rooms, loading, t }: RoomPanelProps): ComponentChildren {
  const byRoom = new Map(rooms.map((o) => [o.room, o]));

  return html`
    <div id="roomPanel">
      <div id="roomView">
        <img id="roomImage" src="/assets/room-image-1.png" alt=${t('room.alt')} />
        <div id="roomOverlay">
          ${Array.from({ length: ROOM_COUNT }, (_, i) => {
            const room = i + 1;
            const occupant = byRoom.get(room);
            if (!occupant) return html`<div class="cell" key=${room}></div>`;

            const col = ((room - 1) % 3) * 3 + occupant.pose;
            const row = Math.floor((room - 1) / 3) * 2;
            const style = `background-position: ${(col / 8) * 100}% ${(row / 5) * 100}%; animation-delay: ${(room * 0.3) % 2}s;`;
            const flagStyle = `background-position: -${flagSpriteOffsetPx(occupant.lang)}px 0;`;

            return html`
              <div class="cell" key=${room}>
                <div class="chara" style=${style}></div>
                <div class="badges">
                  <span class="badge name">${occupant.name}</span>
                  <span class="badge lang" title=${occupant.lang}>
                    <span class="flag" style=${flagStyle}></span>${occupant.lang.toUpperCase()}
                  </span>
                </div>
              </div>
            `;
          })}
        </div>
        <div id="roomLoading" hidden=${!loading}><span>${t('room.loading')}</span></div>
        <div id="roomEmpty" hidden=${loading || rooms.length > 0}>${t('room.empty')}</div>
      </div>
    </div>
  `;
}
