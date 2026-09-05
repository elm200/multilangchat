import type { Dictionary } from './index.js';

const es: Dictionary = {
  login: {
    title: 'Bienvenido a Chat Room',
    subtitle: 'Introduce un apodo para unirte',
    namePlaceholder: 'Apodo',
    passphrasePlaceholder: 'Contraseña',
    submit: 'Unirse',
    privacyNote: 'Los mensajes se envían a un servicio de IA externo para traducirlos',
    error: {
      passphrase: 'Contraseña incorrecta',
      generic: 'Error al iniciar sesión',
      roomFull: 'Esta sala ya tiene 5 idiomas en uso y no puede aceptar el tuyo',
    },
  },
  topbar: {
    title: 'Chat Room',
    connected: 'Conectado',
    reconnecting: 'Reconectando...',
    leave: 'Salir',
  },
  room: {
    alt: 'Sala',
    loading: 'Cargando...',
    empty: 'Todavía no hay nadie',
  },
  chat: {
    inputPlaceholder: 'Escribe un mensaje...',
    send: 'Enviar',
  },
  system: {
    joined: '{name} se ha unido a la sala (ahora {count} personas)',
    left: '{name} ha salido de la sala (ahora {count} personas)',
  },
};

export default es;
