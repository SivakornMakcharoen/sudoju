import './styles/main.css';
import { RegisterScreen } from './screens/RegisterScreen.js';
import { LevelScreen }    from './screens/LevelScreen.js';
import { GameScreen }     from './screens/GameScreen.js';
import { saveSession, loadSession, clearSession } from './lib/players.js';

function App() {
  const root = document.getElementById('app');

  root.innerHTML = `
    <div class="wrap">
      <div class="masthead">
        <h1>Sudoku Logbook</h1>
        <span class="tag" id="masthead-tag">ลงทะเบียนผู้เล่น</span>
      </div>
      <div id="screen-host"></div>
    </div>
  `;

  const host        = root.querySelector('#screen-host');
  const mastheadTag = root.querySelector('#masthead-tag');

  function mount(el, tagText) {
    host.innerHTML = '';
    host.appendChild(el);
    mastheadTag.textContent = tagText;
  }

  function showRegister(switchPlayer = false) {
    if (switchPlayer) clearSession();   // clear เฉพาะตอน switch player จริงๆ
    // บันทึก screen ปัจจุบันไว้ใน session (ถ้ามี player อยู่แล้ว)
    const cur = loadSession();
    if (cur) saveSession({ ...cur, _screen: 'register' });

    const screen = RegisterScreen({
      onSuccess: (player) => showLevel(player),
    });
    mount(screen, 'ลงทะเบียนผู้เล่น');
  }

  function showLevel(player) {
    // บันทึกว่าอยู่หน้า level
    saveSession({ ...player, _screen: 'level' });
    const screen = LevelScreen({
      player,
      onPlay: (updatedPlayer) => showGame(updatedPlayer),
    });
    mount(screen, 'เลือกระดับความยาก');
  }

  function showGame(player) {
    // บันทึกว่าอยู่หน้า game
    saveSession({ ...player, _screen: 'game' });
    const screen = GameScreen({
      player,
      onChangeLevel:  () => showLevel(player),
      onSwitchPlayer: () => showRegister(true),
    });
    mount(screen, 'กำลังเล่น');
    screen.start();
  }

  // ── Boot: เช็ค session และ screen ก่อน ──
  const saved = loadSession();
  const screen = saved?._screen;

  if (!saved) {
    showRegister();
  } else if (screen === 'game' && saved.level) {
    showGame(saved);
  } else if (screen === 'level' || (saved && !saved.level)) {
    showLevel(saved);
  } else if (screen === 'register') {
    // ถ้า refresh ตอนอยู่หน้า register ให้กลับไปหน้านั้น
    // แต่ไม่ clear session เพราะ player อาจมีอยู่แล้ว
    showRegister();
  } else if (saved.level) {
    showGame(saved);
  } else {
    showLevel(saved);
  }
}

App();