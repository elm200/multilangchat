import './styles.css';
import { render } from 'preact';
import { html } from './html.js';
import { App } from './components/App.js';

const root = document.getElementById('root');
if (root) {
  render(html`<${App} />`, root);
}
