import './styles/main.css';
import { db } from './lib/supabase.js';
import { RegisterScreen } from './screens/RegisterScreen.js';
import { LevelScreen }    from './screens/LevelScreen.js';
import { GameScreen }     from './screens/GameScreen.js';
import { loadPlayer, savePlayer, blankStats, saveSession, loadSession, clearSession } from './lib/players.js';

function App() {
  const root = document.getElementById('app');

  root.innerHTML = `
    <div class="wrap">
      <div class="masthead">
        <div class="masthead-title">
          <h1>Sudoku Logbook</h1>
          <span class="tag" id="masthead-tag">กำลังโหลด...</span>
        </div>
        <div id="auth-area"></div>
      </div>
      <div id="screen-host"></div>
    </div>
  `;

  const host        = root.querySelector('#screen-host');
  const mastheadTag = root.querySelector('#masthead-tag');
  const authArea    = root.querySelector('#auth-area');

  function mount(el, tagText) {
    host.innerHTML = '';
    host.appendChild(el);
    mastheadTag.textContent = tagText;
  }

  // ── Top-right auth control ──────────────────────────────────────
  function renderAuthArea(player /* null when signed out */) {
    authArea.innerHTML = '';

    if (!player) {
      const btn = document.createElement('button');
      btn.className = 'btn ghost small auth-btn';
      btn.innerHTML = `${googleIcon()} เข้าสู่ระบบด้วย Google`;
      btn.addEventListener('click', loginWithGoogle);
      authArea.appendChild(btn);
      return;
    }

    const chip = document.createElement('div');
    chip.className = 'auth-chip';
    chip.innerHTML = `
      <span class="auth-chip-name">${escapeHtmlLocal(player.name)}</span>
      <button class="btn ghost small" id="btn-logout">ออกจากระบบ</button>
    `;
    authArea.appendChild(chip);
    chip.querySelector('#btn-logout').addEventListener('click', logout);
  }

  function escapeHtmlLocal(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function googleIcon() {
    return `<svg width="14" height="14" viewBox="0 0 18 18" style="vertical-align:-2px;margin-right:6px;">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
    </svg>`;
  }

  async function loginWithGoogle() {
    const { error } = await db.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      mastheadTag.textContent = `เข้าสู่ระบบไม่สำเร็จ: ${error.message}`;
    }
    // Browser navigates away to Google's consent screen; execution
    // resumes on redirect back, handled by onAuthStateChange below.
  }

  async function logout() {
    clearSession();
    await db.auth.signOut();
    renderAuthArea(null);
    showWelcome();
  }

  // ── Screens ───────────────────────────────────────────────────
  function showWelcome() {
    const screen = RegisterScreen({
      onSuccess:     (player) => showLevel(player),
      onGoogleLogin: loginWithGoogle,
    });
    mount(screen, 'ลงทะเบียนผู้เล่น');
  }

  function showLevel(player) {
    saveSession({ ...player, _screen: 'level' });
    renderAuthArea(player);
    const screen = LevelScreen({
      player,
      onPlay: (updatedPlayer) => showGame(updatedPlayer),
    });
    mount(screen, 'เลือกระดับความยาก');
  }

  function showGame(player) {
    saveSession({ ...player, _screen: 'game' });
    renderAuthArea(player);
    const screen = GameScreen({
      player,
      onChangeLevel:  () => showLevel(player),
      onSwitchPlayer: () => logout(),
    });
    mount(screen, 'กำลังเล่น');
    screen.start();
  }

  // ── Turn a signed-in Google session into a player row ───────────
  async function handleSignedIn(session) {
    const email = session.user.email;
    const googleName =
      session.user.user_metadata?.full_name ||
      session.user.user_metadata?.name ||
      email.split('@')[0];

    let player = await loadPlayer(email);
    if (!player) {
      player = { name: googleName, email, level: null, stats: blankStats(), createdAt: Date.now() };
      await savePlayer(player);
    }

    renderAuthArea(player);

    const saved = loadSession();
    if (saved?._screen === 'game' && saved.email === player.email && player.level) {
      showGame(player);
    } else {
      showLevel(player);
    }
  }

  // ── Auth bootstrap ───────────────────────────────────────────────
  async function bootstrap() {
    const { data: { session } } = await db.auth.getSession();
    if (session?.user?.email) {
      await handleSignedIn(session);
    } else {
      renderAuthArea(null);
      showWelcome();
    }
  }

  db.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user?.email) {
      handleSignedIn(session);
    }
    if (event === 'SIGNED_OUT') {
      clearSession();
      renderAuthArea(null);
      showWelcome();
    }
  });

  bootstrap();
}

App();