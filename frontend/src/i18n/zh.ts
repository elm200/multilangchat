import type { Dictionary } from './index.js';

const zh: Dictionary = {
  login: {
    title: '欢迎来到 Chat Room',
    subtitle: '输入昵称即可加入',
    namePlaceholder: '昵称',
    passphrasePlaceholder: '暗号',
    submit: '加入',
    privacyNote: '消息会发送至外部 AI 服务以进行翻译',
    error: {
      passphrase: '暗号不正确',
      generic: '登录失败',
      roomFull: '此聊天室已使用5种语言，无法再加入您的语言',
    },
  },
  topbar: {
    title: 'Chat Room',
    connected: '已连接',
    reconnecting: '重新连接中...',
    leave: '退出',
  },
  room: {
    alt: '房间',
    loading: '加载中...',
    empty: '还没有人在',
  },
  chat: {
    inputPlaceholder: '输入消息...',
    send: '发送',
  },
  system: {
    joined: '{name} 加入了聊天室（当前 {count} 人）',
    left: '{name} 退出了聊天室（当前 {count} 人）',
  },
};

export default zh;
