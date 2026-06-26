import { loadPlayer, savePlayer, blankStats } from '../lib/players.js';
import { sanitizeName, isValidEmail, setLoading } from '../lib/utils.js';

export function RegisterScreen({ onSuccess }) {
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
      <div class="hint" style="margin-top:10px;">
        version 1.1.2
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

  return el;
}
