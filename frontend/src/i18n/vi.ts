import type { Dictionary } from './index.js';

const vi: Dictionary = {
  login: {
    title: 'Chào mừng đến với Chat Room',
    subtitle: 'Nhập biệt danh để tham gia',
    namePlaceholder: 'Biệt danh',
    passphrasePlaceholder: 'Mật khẩu',
    submit: 'Tham gia',
    privacyNote: 'Tin nhắn được gửi đến một dịch vụ AI bên ngoài để dịch',
    error: {
      passphrase: 'Mật khẩu không đúng',
      generic: 'Đăng nhập thất bại',
      roomFull: 'Phòng này đã có đủ 5 ngôn ngữ, không thể tham gia bằng ngôn ngữ của bạn',
    },
  },
  topbar: {
    title: 'Chat Room',
    connected: 'Đã kết nối',
    reconnecting: 'Đang kết nối lại...',
    leave: 'Rời phòng',
  },
  room: {
    alt: 'Phòng',
    loading: 'Đang tải...',
    empty: 'Chưa có ai ở đây',
  },
  chat: {
    inputPlaceholder: 'Nhập tin nhắn...',
    send: 'Gửi',
  },
  system: {
    joined: '{name} đã vào phòng (hiện có {count} người)',
    left: '{name} đã rời phòng (hiện có {count} người)',
  },
};

export default vi;
