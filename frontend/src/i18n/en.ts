import type { Dictionary } from './index.js';

const en: Dictionary = {
  login: {
    title: 'Welcome to Chat Room',
    subtitle: 'Enter a nickname to join',
    namePlaceholder: 'Nickname',
    passphrasePlaceholder: 'Passphrase',
    submit: 'Join',
    privacyNote: 'Messages are sent to an external AI service for translation.',
    error: {
      passphrase: 'Incorrect passphrase',
      generic: 'Failed to log in',
      roomFull: 'This room already has 5 languages in use and cannot accept yours',
    },
  },
  topbar: {
    title: 'Chat Room',
    connected: 'Connected',
    reconnecting: 'Reconnecting...',
    leave: 'Leave',
  },
  room: {
    alt: 'Room',
    loading: 'Loading...',
    empty: 'No one is here yet',
  },
  chat: {
    inputPlaceholder: 'Type a message...',
    send: 'Send',
  },
  system: {
    joined: '{name} joined the room (now {count} people)',
    left: '{name} left the room (now {count} people)',
  },
};

export default en;
