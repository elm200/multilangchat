import { Fragment } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { html } from '../html.js';
import { flagSpriteOffsetPx } from '../i18n/index.js';
import type { ComponentChildren, JSX } from 'preact';
import type { LogEntry } from '../types.js';

const TOOLTIP_GAP = 8;
// 下に出す余白がこれ未満なら上に出す(概算値。実際の高さは内容次第で変わる)。
const TOOLTIP_EST_HEIGHT = 70;
const TOOLTIP_MAX_WIDTH = 220;

function flagStyle(lang: string): string {
  return `background-position: -${flagSpriteOffsetPx(lang)}px 0;`;
}

interface ChatLogProps {
  entries: LogEntry[];
  myUserId: string | null;
  lang: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}

interface Tip {
  x: number;
  y: number;
  align: 'left' | 'right';
  dir: 'up' | 'down';
  text: string;
}

export function ChatLog({ entries, myUserId, lang, t }: ChatLogProps): ComponentChildren {
  const ref = useRef<HTMLDivElement | null>(null);
  // #log内でCSSだけのツールチップだとoverflow-yでクリップされるため、position:fixedにして
  // ホバー時の実座標(getBoundingClientRect)から出す方向を決める。
  const [tip, setTip] = useState<Tip | null>(null);

  // 翻訳バッジが後から付く更新はentries.lengthが変わらないため、バッジ数も依存値に入れて
  // その時点で再スクロールする。
  const translationBadgeCount = entries.reduce(
    (sum, entry) => sum + (entry.type === 'chat' ? Object.keys(entry.translations).length : 0),
    0,
  );

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries.length, translationBadgeCount]);

  const showTip = (e: JSX.TargetedMouseEvent<HTMLSpanElement>, text: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const align = rect.left + TOOLTIP_MAX_WIDTH > window.innerWidth ? 'right' : 'left';
    const dir = window.innerHeight - rect.bottom < TOOLTIP_EST_HEIGHT ? 'up' : 'down';
    setTip({
      x: align === 'left' ? rect.left : rect.right,
      y: dir === 'down' ? rect.bottom + TOOLTIP_GAP : rect.top - TOOLTIP_GAP,
      align,
      dir,
      text,
    });
  };
  const hideTip = () => setTip(null);

  const renderBadge = (badgeLang: string, text: string) => html`
    <span
      class="badge lang"
      aria-label=${text}
      onMouseEnter=${(e: JSX.TargetedMouseEvent<HTMLSpanElement>) => showTip(e, text)}
      onMouseLeave=${hideTip}
      key=${badgeLang}
    >
      <span class="flag" style=${flagStyle(badgeLang)}></span>${badgeLang.toUpperCase()}
    </span>
  `;

  return html`
    <${Fragment}>
      <div id="log" ref=${ref}>
        ${entries.map((entry, i) => {
          if (entry.type === 'system') {
            return html`<div class="sysrow" key=${i}>${t(`system.${entry.event}`, { name: entry.name, count: entry.count })}</div>`;
          }
          const isOwn = entry.userId === myUserId;
          // 自分の発言は常に原文(自分の言語)。他人の発言は自分の言語への訳文があれば
          // それを、無ければ(自分の言語が原語と同じ、または翻訳未着)原文にフォールバック。
          const displayText = isOwn ? entry.text : entry.lang === lang ? entry.text : (entry.translations[lang] ?? entry.text);
          const badges = isOwn
            ? Object.entries(entry.translations).map(([badgeLang, text]) => renderBadge(badgeLang, text))
            : [renderBadge(entry.lang, entry.text)];
          return html`
            <div class="row ${isOwn ? 'self' : 'other'}" key=${i}>
              <div class="meta">${entry.name} · ${entry.time}</div>
              <div class="bubble">${displayText}</div>
              ${badges.length > 0 ? html`<div class="badges">${badges}</div>` : null}
            </div>
          `;
        })}
      </div>
      ${tip &&
      html`
        <div
          class="chat-tooltip ${tip.align === 'right' ? 'align-right' : ''} ${tip.dir === 'up' ? 'dir-up' : ''}"
          style=${`left:${tip.x}px; top:${tip.y}px;`}
        >
          ${tip.text}
        </div>
      `}
    <//>
  `;
}
