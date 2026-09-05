import type { Dictionary } from './index.js';

const ko: Dictionary = {
  login: {
    title: 'Chat Room에 오신 것을 환영합니다',
    subtitle: '닉네임을 입력하고 참여하세요',
    namePlaceholder: '닉네임',
    passphrasePlaceholder: '암호',
    submit: '참여하기',
    privacyNote: '메시지는 번역을 위해 외부 AI 서비스로 전송됩니다',
    error: {
      passphrase: '암호가 올바르지 않습니다',
      generic: '로그인에 실패했습니다',
      roomFull: '이 방은 이미 5개 언어가 사용 중이라 참여할 수 없습니다',
    },
  },
  topbar: {
    title: 'Chat Room',
    connected: '연결됨',
    reconnecting: '재연결 중...',
    leave: '퇴장',
  },
  room: {
    alt: '방',
    loading: '불러오는 중...',
    empty: '아직 아무도 없습니다',
  },
  chat: {
    inputPlaceholder: '메시지를 입력하세요...',
    send: '보내기',
  },
  system: {
    joined: '{name}님이 입장했습니다 (현재 {count}명)',
    left: '{name}님이 퇴장했습니다 (현재 {count}명)',
  },
};

export default ko;
