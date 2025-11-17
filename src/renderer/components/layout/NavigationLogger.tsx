import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * NavigationLogger tracks and logs all route changes in the application.
 * Logs navigation in the format: "Navigation: /from/path → /to/path"
 */
export function NavigationLogger() {
  const location = useLocation();
  const previousLocation = useRef<string | null>(null);

  useEffect(() => {
    const currentPath = location.pathname + location.search + location.hash;

    if (previousLocation.current !== null && previousLocation.current !== currentPath) {
      console.log(
        `%c🧭 Navigation: %c${previousLocation.current} %c→ %c${currentPath}`,
        'color: #3b82f6; font-weight: bold',
        'color: #ef4444; font-weight: normal',
        'color: #6b7280; font-weight: bold',
        'color: #10b981; font-weight: normal'
      );
    } else if (previousLocation.current === null) {
      console.log(
        `%c🧭 Initial Route: %c${currentPath}`,
        'color: #3b82f6; font-weight: bold',
        'color: #10b981; font-weight: normal'
      );
    }

    previousLocation.current = currentPath;
  }, [location]);

  return null;
}
