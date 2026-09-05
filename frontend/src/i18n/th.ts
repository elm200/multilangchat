import type { Dictionary } from './index.js';

const th: Dictionary = {
  login: {
    title: 'ยินดีต้อนรับสู่ Chat Room',
    subtitle: 'กรอกชื่อเล่นเพื่อเข้าร่วม',
    namePlaceholder: 'ชื่อเล่น',
    passphrasePlaceholder: 'รหัสผ่าน',
    submit: 'เข้าร่วม',
    privacyNote: 'ข้อความจะถูกส่งไปยังบริการ AI ภายนอกเพื่อการแปล',
    error: {
      passphrase: 'รหัสผ่านไม่ถูกต้อง',
      generic: 'เข้าสู่ระบบไม่สำเร็จ',
      roomFull: 'ห้องนี้มีภาษาที่ใช้งานครบ 5 ภาษาแล้ว ไม่สามารถเข้าร่วมได้',
    },
  },
  topbar: {
    title: 'Chat Room',
    connected: 'เชื่อมต่อแล้ว',
    reconnecting: 'กำลังเชื่อมต่อใหม่...',
    leave: 'ออกจากห้อง',
  },
  room: {
    alt: 'ห้อง',
    loading: 'กำลังโหลด...',
    empty: 'ยังไม่มีใครอยู่ที่นี่',
  },
  chat: {
    inputPlaceholder: 'พิมพ์ข้อความ...',
    send: 'ส่ง',
  },
  system: {
    joined: '{name} เข้าร่วมห้องแล้ว (ตอนนี้ {count} คน)',
    left: '{name} ออกจากห้องแล้ว (ตอนนี้ {count} คน)',
  },
};

export default th;
