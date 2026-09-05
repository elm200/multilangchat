import type { Dictionary } from './index.js';

const ja: Dictionary = {
  login: {
    title: 'Chat Room へようこそ',
    subtitle: 'ニックネームを入力して参加しましょう',
    namePlaceholder: 'ニックネーム',
    passphrasePlaceholder: '合言葉',
    submit: '参加する',
    privacyNote: 'メッセージは翻訳のため外部のAIサービスに送信されます',
    error: {
      passphrase: '合言葉が違います',
      generic: 'ログインに失敗しました',
      roomFull: 'この部屋はすでに5つの言語が使われており、これ以上参加できません',
    },
  },
  topbar: {
    title: 'Chat Room',
    connected: '接続中',
    reconnecting: '再接続中...',
    leave: '退室',
  },
  room: {
    alt: 'ルーム',
    loading: '読み込み中...',
    empty: 'まだ誰もいません',
  },
  chat: {
    inputPlaceholder: 'メッセージを入力...',
    send: '送信',
  },
  system: {
    joined: '{name} さんが入室しました（現在 {count} 人）',
    left: '{name} さんが退室しました（現在 {count} 人）',
  },
};

export default ja;
