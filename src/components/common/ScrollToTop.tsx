import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Instant scroll to top on route change without animation jank
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};
