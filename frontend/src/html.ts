import { h } from 'preact';
import htm from 'htm';

/** Tagged-template hyperscript bound to Preact's `h`. */
export const html = htm.bind(h);
