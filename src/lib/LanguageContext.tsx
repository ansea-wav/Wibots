'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type LanguageCode = 'en' | 'id' | 'es' | 'ru' | 'zh' | 'ms' | 'fil' | 'ko' | 'ar';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const dictionaries: Record<LanguageCode, Record<string, string>> = {
  en: {
    'appearance': 'Appearance',
    'theme': 'Theme',
    'task_manager': 'Task Manager',
    'monitor_processes': 'Monitor open windows & processes',
    'subscription': 'Subscription',
    'extend_plan': 'Extend your subscription plan',
    'log_out': 'Log out',
    'sign_out': 'Sign out of your session',
    'app_store': 'App Store',
    'discover_modules': 'Discover and install powerful modules for your OS.',
    'loading_catalog': 'Loading catalog...',
    'released': 'Released',
    'installed': 'Installed',
    'get_install': 'Get / Install',
    'installing': 'Installing...',
    'pinned_apps': 'PINNED APPS',
    'menu': 'MENU',
  },
  id: {
    'appearance': 'Tampilan',
    'theme': 'Tema',
    'task_manager': 'Manajer Tugas',
    'monitor_processes': 'Pantau proses & jendela terbuka',
    'subscription': 'Perpanjang Langganan',
    'extend_plan': 'Perpanjang paket langganan kamu',
    'log_out': 'Keluar',
    'sign_out': 'Keluar dari sesi kamu',
    'app_store': 'Toko Aplikasi',
    'discover_modules': 'Temukan dan pasang modul hebat untuk OS kamu.',
    'loading_catalog': 'Memuat katalog...',
    'released': 'Dirilis',
    'installed': 'Terpasang',
    'get_install': 'Pasang',
    'installing': 'Memasang...',
    'pinned_apps': 'APLIKASI TERSEMAT',
    'menu': 'MENU',
  },
  es: {
    'appearance': 'Apariencia',
    'theme': 'Tema',
    'task_manager': 'Administrador de Tareas',
    'monitor_processes': 'Monitorear procesos y ventanas abiertas',
    'subscription': 'Suscripción',
    'extend_plan': 'Extiende tu plan de suscripción',
    'log_out': 'Cerrar sesión',
    'sign_out': 'Cierra sesión en tu cuenta',
    'app_store': 'Tienda de Apps',
    'discover_modules': 'Descubre e instala módulos potentes.',
    'loading_catalog': 'Cargando catálogo...',
    'released': 'Lanzamiento',
    'installed': 'Instalado',
    'get_install': 'Instalar',
    'installing': 'Instalando...',
    'pinned_apps': 'APPS FIJADAS',
    'menu': 'MENÚ',
  },
  ru: {
    'appearance': 'Внешний вид',
    'theme': 'Тема',
    'task_manager': 'Диспетчер задач',
    'monitor_processes': 'Мониторинг открытых окон и процессов',
    'subscription': 'Подписка',
    'extend_plan': 'Продлить подписку',
    'log_out': 'Выйти',
    'sign_out': 'Выйти из сеанса',
    'app_store': 'Магазин приложений',
    'discover_modules': 'Откройте для себя и установите мощные модули.',
    'loading_catalog': 'Загрузка каталога...',
    'released': 'Выпущено',
    'installed': 'Установлено',
    'get_install': 'Установить',
    'installing': 'Установка...',
    'pinned_apps': 'ЗАКРЕПЛЕННЫЕ ПРИЛОЖЕНИЯ',
    'menu': 'МЕНЮ',
  },
  zh: {
    'appearance': '外观',
    'theme': '主题',
    'task_manager': '任务管理器',
    'monitor_processes': '监控打开的窗口和进程',
    'subscription': '订阅',
    'extend_plan': '延长您的订阅计划',
    'log_out': '登出',
    'sign_out': '退出您的会话',
    'app_store': '应用商店',
    'discover_modules': '发现并安装强大的模块。',
    'loading_catalog': '正在加载目录...',
    'released': '发布日期',
    'installed': '已安装',
    'get_install': '获取/安装',
    'installing': '安装中...',
    'pinned_apps': '固定的应用程序',
    'menu': '菜单',
  },
  ms: {
    'appearance': 'Penampilan',
    'theme': 'Tema',
    'task_manager': 'Pengurus Tugas',
    'monitor_processes': 'Pantau tetingkap & proses terbuka',
    'subscription': 'Langganan',
    'extend_plan': 'Lanjutkan pelan langganan anda',
    'log_out': 'Log keluar',
    'sign_out': 'Log keluar dari sesi anda',
    'app_store': 'Kedai Aplikasi',
    'discover_modules': 'Cari dan pasang modul berkuasa.',
    'loading_catalog': 'Memuatkan katalog...',
    'released': 'Dikeluarkan',
    'installed': 'Dipasang',
    'get_install': 'Pasang',
    'installing': 'Memasang...',
    'pinned_apps': 'APLIKASI DIPINKAN',
    'menu': 'MENU',
  },
  fil: {
    'appearance': 'Hitsura',
    'theme': 'Tema',
    'task_manager': 'Tagapamahala ng Gawain',
    'monitor_processes': 'Subaybayan ang mga proseso',
    'subscription': 'Suskripsyon',
    'extend_plan': 'Pahabain ang iyong plano',
    'log_out': 'Mag-log out',
    'sign_out': 'Mag-sign out sa iyong session',
    'app_store': 'Tindahan ng App',
    'discover_modules': 'Tuklasin at i-install ang mga module.',
    'loading_catalog': 'Naglo-load ng katalogo...',
    'released': 'Inilabas',
    'installed': 'Nai-install na',
    'get_install': 'I-install',
    'installing': 'Nag-i-install...',
    'pinned_apps': 'NAKA-PIN NA APPS',
    'menu': 'MENU',
  },
  ko: {
    'appearance': '모양',
    'theme': '테마',
    'task_manager': '작업 관리자',
    'monitor_processes': '열린 창 및 프로세스 모니터링',
    'subscription': '구독',
    'extend_plan': '구독 계획 연장',
    'log_out': '로그아웃',
    'sign_out': '세션에서 로그아웃',
    'app_store': '앱 스토어',
    'discover_modules': '강력한 모듈을 발견하고 설치하세요.',
    'loading_catalog': '카탈로그 로드 중...',
    'released': '출시일',
    'installed': '설치됨',
    'get_install': '설치',
    'installing': '설치 중...',
    'pinned_apps': '고정된 앱',
    'menu': '메뉴',
  },
  ar: {
    'appearance': 'المظهر',
    'theme': 'السمة',
    'task_manager': 'مدير المهام',
    'monitor_processes': 'مراقبة العمليات',
    'subscription': 'الاشتراك',
    'extend_plan': 'تمديد خطة الاشتراك الخاصة بك',
    'log_out': 'تسجيل الخروج',
    'sign_out': 'تسجيل الخروج من جلستك',
    'app_store': 'متجر التطبيقات',
    'discover_modules': 'اكتشف وقم بتثبيت وحدات قوية.',
    'loading_catalog': 'جارٍ تحميل الكتالوج...',
    'released': 'تم الإصدار',
    'installed': 'مُثبت',
    'get_install': 'تثبيت',
    'installing': 'جارٍ التثبيت...',
    'pinned_apps': 'التطبيقات المثبتة',
    'menu': 'قائمة',
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>('en');

  useEffect(() => {
    const saved = localStorage.getItem('yay_language') as LanguageCode;
    if (saved && dictionaries[saved]) {
      setLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: LanguageCode) => {
    setLanguage(lang);
    localStorage.setItem('yay_language', lang);
  };

  const t = (key: string) => {
    return dictionaries[language]?.[key] || dictionaries['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
