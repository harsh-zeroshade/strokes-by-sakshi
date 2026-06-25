import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    // Default is ALWAYS light — only go dark if user explicitly chose it
    return saved === 'dark';
  });

  // Apply/remove 'dark' class on <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const toggle = () => setDark(p => !p);
  const setLight = () => setDark(false);
  const setDarkMode = () => setDark(true);

  return (
    <ThemeContext.Provider value={{ dark, toggle, setLight, setDark: setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
