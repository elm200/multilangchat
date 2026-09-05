import { useState, useRef, useEffect } from 'preact/hooks';
import { html } from '../html.js';
import type { ComponentChildren, JSX } from 'preact';

interface ChatInputProps {
  onSend: (text: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function ChatInput({ onSend, t }: ChatInputProps): ComponentChildren {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: JSX.TargetedSubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue('');
  };

  return html`
    <form id="chat-form" onSubmit=${handleSubmit}>
      <input
        id="msg"
        ref=${inputRef}
        type="text"
        maxlength="300"
        autocomplete="off"
        placeholder=${t('chat.inputPlaceholder')}
        required
        value=${value}
        onInput=${(e: JSX.TargetedEvent<HTMLInputElement>) => setValue(e.currentTarget.value)}
      />
      <button type="submit" aria-label=${t('chat.send')}>➤</button>
    </form>
  `;
}
