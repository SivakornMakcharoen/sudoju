const EMAIL_RE = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;

export const sanitizeName  = raw => raw.trim().replace(/[<>]/g, '').slice(0, 40);
export const isValidEmail  = raw => EMAIL_RE.test(raw) && raw.length <= 100;
export const escapeHtml    = str => { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; };
export const fmtTime       = sec => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

export function setLoading(btn, loading, text) {
  btn.disabled   = loading;
  btn.innerHTML  = loading ? `<span class="spinner"></span>${text}` : text;
}
