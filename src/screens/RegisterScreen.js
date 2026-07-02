import { loadPlayer, savePlayer, blankStats } from '../lib/players.js';
import { sanitizeName, isValidEmail, setLoading } from '../lib/utils.js';

export function RegisterScreen({ onSuccess, onGoogleLogin }) {
  const el = document.createElement('div');
  el.id = 'screen-register';
  el.innerHTML = `
    <div class="card">
      <div class="field">
        <label for="reg-email">อีเมล</label>
        <input id="reg-email" type="email" placeholder="you@example.com" autocomplete="email" maxlength="100">
      </div>
      <div class="field">
        <label for="reg-name">ชื่อที่ใช้แสดง</label>
        <input id="reg-name" type="text" placeholder="ชื่อเล่นของคุณ" autocomplete="name" maxlength="40">
      </div>
      <div class="error-msg" id="reg-error"></div>
      <button class="btn full" id="btn-start">เริ่มเล่น</button>

      <div class="or-divider"><span>หรือ</span></div>

      <button class="btn ghost full auth-btn" id="btn-google">${googleIcon()} เข้าสู่ระบบด้วย Google</button>

      <div class="hint" style="margin-top:10px;">
        version 1.2.0
      </div>
    </div>
    <div class="foot-note">
      ข้อมูลผู้เล่น (ชื่อ/อีเมล/ระดับ/สถิติ) จะถูกเก็บแบบแชร์ร่วมกัน —
      ผู้เล่นคนอื่นที่เปิดเกมนี้จะมองเห็นชื่อและสถิติของคุณใน Leaderboard ได้
    </div>
  `;

  const emailInput = el.querySelector('#reg-email');
  const nameInput  = el.querySelector('#reg-name');
  const errorEl    = el.querySelector('#reg-error');
  const btnStart   = el.querySelector('#btn-start');
  const btnGoogle  = el.querySelector('#btn-google');

  function showError(msg, isSuccess = false) {
    errorEl.style.color = isSuccess ? 'var(--success)' : 'var(--error)';
    errorEl.textContent = msg;
  }

  emailInput.addEventListener('blur', async () => {
    const email = emailInput.value.trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    const existing = await loadPlayer(email);
    if (existing) {
      nameInput.value = existing.name;
      showError('พบบัญชีเดิม — ดึงข้อมูลกลับมาให้แล้ว ✓', true);
    } else {
      showError('');
    }
  });

  btnStart.addEventListener('click', async () => {
    const email = emailInput.value.trim().toLowerCase();
    const name  = sanitizeName(nameInput.value);

    if (!name)               { showError('กรุณากรอกชื่อ'); return; }
    if (!isValidEmail(email)){ showError('กรุณากรอกอีเมลให้ถูกต้อง'); return; }

    setLoading(btnStart, true, 'กำลังโหลด...');
    let player = await loadPlayer(email);
    if (player) {
      player.name = name;
    } else {
      player = { name, email, level: null, stats: blankStats(), createdAt: Date.now() };
    }
    await savePlayer(player);
    setLoading(btnStart, false, 'เริ่มเล่น');
    onSuccess(player);
  });

  btnGoogle.addEventListener('click', onGoogleLogin);

  return el;
}

function googleIcon() {
  return `<svg width="14" height="14" viewBox="0 0 18 18" style="vertical-align:-2px;margin-right:6px;">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33z"/>
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
  </svg>`;
}