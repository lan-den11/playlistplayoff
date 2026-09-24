// Minimal light/dark theme switch — no React context needed since there's
// only one piece of state and every consumer (toggle button, PageBackground)
// can read/write it directly. Dark is ALWAYS the default: a visitor who has
// never toggled, or whose browser blocks storage, gets dark regardless of
// their OS preference — this only ever becomes light through an explicit
// click, persisted for next time.
const STORAGE_KEY = 'pp-theme';
const CHANGE_EVENT = 'pp-theme-change';

export function getTheme() {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function setTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark';
  if (next === 'dark') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = 'light';
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // storage unavailable — theme still applies for this page view
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
}

export function toggleTheme() {
  setTheme(getTheme() === 'light' ? 'dark' : 'light');
}

// Fires immediately with the current theme, then again on every change.
// Returns an unsubscribe function.
export function subscribeTheme(callback) {
  callback(getTheme());
  const handler = (e) => callback(e.detail);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

// The exact source used by the inline no-flash script in app/layout.jsx —
// kept here too so the two never drift apart.
export const NO_FLASH_SCRIPT = `try{if(localStorage.getItem('${STORAGE_KEY}')==='light'){document.documentElement.dataset.theme='light'}}catch(e){}`;
