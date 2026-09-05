import { useState, useEffect } from 'preact/hooks';
import { html } from '../html.js';
import { SUPPORTED_LANGS, LANGUAGE_NAMES, makeTranslator } from '../i18n/index.js';
import type { ComponentChildren, JSX } from 'preact';
import type { Lang } from '../i18n/index.js';

interface LoginProps {
  onLogin: (name: string, passphrase: string, lang: Lang) => void;
  error: string | null;
  initialLang: Lang;
}

export function Login({ onLogin, error, initialLang }: LoginProps): ComponentChildren {
  const [name, setName] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [passphraseRequired, setPassphraseRequired] = useState(false);
  const [lang, setLang] = useState(initialLang);
  const t = makeTranslator(lang);

  useEffect(() => {
    let cancelled = false;
    fetch('/config')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setPassphraseRequired(Boolean(data.passphraseRequired));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = (e: JSX.TargetedSubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onLogin(trimmed, passphrase, lang);
  };

  return html`
    <div id="login">
      <div class="logo">💬</div>
      <h1>${t('login.title')}</h1>
      <p>${t('login.subtitle')}</p>
      <form onSubmit=${handleSubmit}>
        <input
          id="name"
          type="text"
          maxlength="20"
          autocomplete="off"
          placeholder=${t('login.namePlaceholder')}
          required
          value=${name}
          onInput=${(e: JSX.TargetedEvent<HTMLInputElement>) => setName(e.currentTarget.value)}
        />
        <select
          id="lang"
          value=${lang}
          onChange=${(e: JSX.TargetedEvent<HTMLSelectElement>) => setLang(e.currentTarget.value as Lang)}
        >
          ${SUPPORTED_LANGS.map((code) => html`<option value=${code}>${LANGUAGE_NAMES[code]}</option>`)}
        </select>
        ${passphraseRequired &&
        html`
          <input
            id="passphrase"
            type="password"
            autocomplete="off"
            placeholder=${t('login.passphrasePlaceholder')}
            required
            value=${passphrase}
            onInput=${(e: JSX.TargetedEvent<HTMLInputElement>) => setPassphrase(e.currentTarget.value)}
          />
        `}
        ${error && html`<p class="login-error">${error}</p>`}
        <button type="submit">${t('login.submit')}</button>
      </form>
      <p class="privacy-note">${t('login.privacyNote')}</p>
    </div>
  `;
}
