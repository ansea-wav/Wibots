'use client';
import { useEffect, useRef } from 'react';
import type { ClientRegistry } from '@/lib/api';
import { toast } from './DynamicIsland';
import { useLanguage } from '@/lib/LanguageContext';

interface NotificationEngineProps {
  client: ClientRegistry;
}

export default function NotificationEngine({ client }: NotificationEngineProps) {
  const { t } = useLanguage();
  const hasTriggeredToday = useRef<string | null>(null);

  useEffect(() => {
    // 1. Request Permission on Mount "jika dibutuhkan"
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    // 2. Setup the 00:00 Checker
    const checkTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const todayStr = now.toDateString();

      // Check if it's 00:00 (within the first minute of midnight)
      if (hours === 0 && minutes === 0) {
        // Prevent triggering multiple times in the same day
        if (hasTriggeredToday.current !== todayStr) {
          hasTriggeredToday.current = todayStr;
          
          const serverResetMsg = t('server_reset') || 'Server reset';
          
          // Fire In-App Toast
          toast(serverResetMsg, 'info');
          
          // Fire Native Browser Notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('YAY by netals', {
              body: serverResetMsg,
              icon: '/icons/icon-192x192.png'
            });
          }

          // Check Subscription Warning (3 days or less)
          const daysLeft = client.Days_Left || 0;
          if (daysLeft <= 3) {
            const warningMsg = (t('subscription_warning') || 'Warning: Your subscription has only {days} days left!').replace('{days}', daysLeft.toString());
            
            // Fire In-App Toast with delay so it doesn't overlap perfectly
            setTimeout(() => {
              toast(warningMsg, 'error');
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('YAY Subscription', {
                  body: warningMsg,
                  icon: '/icons/icon-192x192.png'
                });
              }
            }, 1000);
          }
        }
      } else {
        // Reset the trigger flag if it's no longer midnight (so it can fire tomorrow)
        if (hours > 0 && hasTriggeredToday.current !== todayStr) {
           hasTriggeredToday.current = null;
        }
      }
    };

    // Check immediately, then every 30 seconds
    checkTime();
    const interval = setInterval(checkTime, 30000);

    return () => clearInterval(interval);
  }, [client.Days_Left, t]);

  return null; // Headless component
}
