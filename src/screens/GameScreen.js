import { makePuzzle, LEVEL_LABEL, MIN_PLAUSIBLE_SEC } from '../lib/puzzle.js';
import { savePlayer } from '../lib/players.js';
import { fmtTime } from '../lib/utils.js';
import { Board } from '../components/Board.js';
import { LeaderboardModal } from '../components/LeaderboardModal.js';

export function GameScreen({ player, onChangeLevel, onSwitchPlayer }) {
  let puzzle = [];
  let solution = [];
  let given = [];
  let selected = null;
  let timerSec = 0;
  let timerHandle = null;
  let history = [];
  let notes = {};

  // ── DOM skeleton ──────────────────────────────────────────────
  const el = document.createElement('div');
  el.id = 'screen-game';
  el.innerHTML = `
    <div class="topbar">
      <div class="player-chip">
        <div>
          <div class="player-name" id="game-player-name"></div>
          <span class="badge" id="game-player-badge"></span>
        </div>
      </div>
      <div class="stat-row">
        <div><span class="lbl">เวลา</span><span id="stat-timer">00:00</span></div>
      </div>
    </div>
    <div class="card">
      <div id="board-host"></div>
      <div class="numpad" id="numpad"></div>
      <div class="controls">
        <button class="btn ghost small" id="btn-new">new game</button>
        <button class="btn ghost small" id="btn-change-level">change level</button>
        <button class="btn ghost small" id="btn-switch">switch player</button>
      </div>
    </div>

    <!-- win modal -->
    <div class="overlay" id="overlay-win">
      <div class="modal">
        <h2>Congratulations!</h2>
        <p id="win-text" style="font-size:14px;color:var(--ink-soft);"></p>
        <button class="btn full" id="btn-win-close">Play Again</button>
      </div>
    </div>
  `;

  // ── Board component ──────────────────────────────────────────
  const board = Board({
    getPuzzle:   () => puzzle,
    getGiven:    () => given,
    getSelected: () => selected,
    getNotes:    () => notes,
    onSelect:    (r, c) => { selected = { r, c }; board.refresh(); },
  });
  el.querySelector('#board-host').replaceWith(board);

  // ── Leaderboard modal ────────────────────────────────────────
  const lbModal = LeaderboardModal({ getCurrentPlayer: () => player });
  el.appendChild(lbModal);

  // ── Refs ──────────────────────────────────────────────────────
  const timerEl   = el.querySelector('#stat-timer');
  const nameEl    = el.querySelector('#game-player-name');
  const badgeEl   = el.querySelector('#game-player-badge');
  const numpadEl  = el.querySelector('#numpad');
  const winOverlay = el.querySelector('#overlay-win');
  const winText    = el.querySelector('#win-text');

  // ── Timer ─────────────────────────────────────────────────────
  function startTimer() {
    stopTimer();
    timerSec = 0;
    timerHandle = setInterval(() => { timerSec++; timerEl.textContent = fmtTime(timerSec); }, 1000);
  }
  function stopTimer() {
    if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
  }

  // ── Numpad ────────────────────────────────────────────────────
  function buildNumpad() {
    numpadEl.innerHTML = '';
    for (let n = 1; n <= 9; n++) {
      const b = document.createElement('button');
      b.className = 'num-btn';
      b.textContent = n;
      b.addEventListener('click', () => placeNumber(n));
      numpadEl.appendChild(b);
    }

    const erase = document.createElement('button');
    erase.className = 'num-btn erase';
    erase.textContent = 'Del';
    erase.addEventListener('click', () => placeNumber(0));
    numpadEl.appendChild(erase);

    const undo = document.createElement('button');
    undo.className = 'num-btn erase';
    undo.textContent = 'Undo';
    undo.addEventListener('click', () => {
      if (!history.length) return;
      const { r, c, prevPuzzle, prevNotes } = history.pop();
      const key = `${r},${c}`;
      puzzle[r][c] = prevPuzzle;
      notes[key] = prevNotes;
      board.refresh();
    });
    numpadEl.appendChild(undo);
  }

  // ── Game logic ────────────────────────────────────────────────
  function placeNumber(v) {
    if (!selected) return;
    const { r, c } = selected;
    if (given[r][c]) return;

    const key = `${r},${c}`;
    const cellNotes = notes[key] || [];

    if (v === 0) {
      // Del: ลบ note ล่าสุด ถ้าไม่มี note ค่อยลบเลขจริง
      if (cellNotes.length > 0) {
        history.push({ r, c, prevPuzzle: puzzle[r][c], prevNotes: [...cellNotes] });
        notes[key] = cellNotes.slice(0, -1);
      } else if (puzzle[r][c] !== 0) {
        history.push({ r, c, prevPuzzle: puzzle[r][c], prevNotes: [] });
        puzzle[r][c] = 0;
      }
    } else if (cellNotes.length > 0) {
      // มี notes อยู่แล้ว → เพิ่ม note (ถ้าไม่ซ้ำและไม่เกิน 5)
      if (cellNotes.length >= 5 || cellNotes.includes(v)) return;
      history.push({ r, c, prevPuzzle: 0, prevNotes: [...cellNotes] });
      notes[key] = [...cellNotes, v];
    } else if (puzzle[r][c] !== 0) {
      // มีเลขจริงอยู่แล้ว กดเลขใหม่ → convert เป็น notes
      history.push({ r, c, prevPuzzle: puzzle[r][c], prevNotes: [] });
      notes[key] = [puzzle[r][c], v];
      puzzle[r][c] = 0;
    } else {
      // ช่องว่าง กดเลขครั้งแรก → เลขจริง
      history.push({ r, c, prevPuzzle: 0, prevNotes: [] });
      puzzle[r][c] = v;
    }

    board.refresh();
    checkWin();
  }

  function checkWin() {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (puzzle[r][c] !== solution[r][c]) return;
    stopTimer();
    handleWin();
  }

  async function handleWin() {
    const level = player.level;
    const stats = player.stats[level];
    stats.played = (stats.played || 0) + 1;
    const minOk = MIN_PLAUSIBLE_SEC[level] ?? 0;
    let recorded = true;

    if (timerSec < minOk) {
      recorded = false;
    } else if (stats.best === null || timerSec < stats.best) {
      stats.best = timerSec;
    }

    await savePlayer(player);
    winText.textContent = recorded
      ? `จบเกมระดับ ${LEVEL_LABEL[level]} ด้วยเวลา ${fmtTime(timerSec)}`
      : `จบเกมระดับ ${LEVEL_LABEL[level]} ด้วยเวลา ${fmtTime(timerSec)} (เวลานี้เร็วผิดปกติ จึงไม่นับขึ้นอันดับ)`;
    winOverlay.classList.add('show');
  }

  function newGame() {
    const g = makePuzzle(player.level);
    solution = g.solution;
    puzzle   = g.puzzle.map(row => row.slice());
    given    = g.given;
    selected = null;
    notes    = {};
    history  = [];
    timerEl.textContent = '00:00';
    startTimer();
    board.refresh();
  }

  // ── Header info ───────────────────────────────────────────────
  function updateHeader() {
    nameEl.textContent  = player.name;
    badgeEl.textContent = LEVEL_LABEL[player.level];
    badgeEl.className   = `badge ${player.level}`;
  }

  // ── Event wiring ──────────────────────────────────────────────
  el.querySelector('#btn-new').addEventListener('click', newGame);
  el.querySelector('#btn-change-level').addEventListener('click', () => { stopTimer(); onChangeLevel(); });
  el.querySelector('#btn-switch').addEventListener('click', () => { stopTimer(); onSwitchPlayer(); });
  el.querySelector('#btn-win-close').addEventListener('click', () => winOverlay.classList.remove('show'));

  document.addEventListener('keydown', (e) => {
    if (!el.isConnected || !selected) return;
    if (e.key >= '1' && e.key <= '9') placeNumber(parseInt(e.key, 10));
    if (['Backspace', 'Delete', '0'].includes(e.key)) placeNumber(0);
  });

  // ── Init ──────────────────────────────────────────────────────
  el.start = () => {
    updateHeader();
    buildNumpad();
    newGame();
  };

  return el;
}