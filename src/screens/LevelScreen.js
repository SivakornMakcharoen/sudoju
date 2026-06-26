import { fetchAllPlayers, topForLevel } from '../lib/players.js';
import { savePlayer } from '../lib/players.js';
import { LEVEL_LABEL } from '../lib/puzzle.js';
import { escapeHtml, fmtTime } from '../lib/utils.js';

export function LevelScreen({ player, onPlay }) {
  let allPlayers    = [];
  let sessionLevel  = player.level ?? null;

  const el = document.createElement('div');
  el.id = 'screen-level';
  el.innerHTML = `
    <div class="card">
      <div class="field">
        <label>เลือกระดับความยาก</label>
        <div class="level-row" id="level-stamps">
          <div class="stamp" data-level="beginner">Beginner</div>
          <div class="stamp" data-level="intermediate">Intermediate</div>
          <div class="stamp" data-level="advance">Advance</div>
        </div>
      </div>
      <div class="error-msg" id="level-error"></div>
      <button class="btn full" id="btn-to-game">เริ่มเล่น</button>
    </div>
    <div class="card">
      <div class="field" style="margin-bottom:10px;">
        <label>อันดับท็อป 3 — <span id="rank-preview-level">เลือกระดับด้านบน</span></label>
      </div>
      <div id="rank-preview-body"><div class="empty-msg">เลือกระดับด้านบนเพื่อดูอันดับ</div></div>
    </div>
  `;

  const stamps      = el.querySelectorAll('.stamp');
  const errorEl     = el.querySelector('#level-error');
  const rankTitle   = el.querySelector('#rank-preview-level');
  const rankBody    = el.querySelector('#rank-preview-body');
  const btnToGame   = el.querySelector('#btn-to-game');

  function renderRankPreview(level) {
    rankTitle.textContent = LEVEL_LABEL[level];
    const top = topForLevel(allPlayers, level, 3);
    if (!top.length) {
      rankBody.innerHTML = '<div class="empty-msg">ยังไม่มีใครจบเกมระดับนี้ — เป็นคนแรกเลย!</div>';
      return;
    }
    const medals = ['🥇', '🥈', '🥉'];
    rankBody.innerHTML = top.map((row, i) => {
      const isMe = row.email === player.email;
      return `<div class="lb-row">
        <span class="lb-name">${medals[i]} ${escapeHtml(row.name)}${isMe ? ' (คุณ)' : ''}</span>
        <span class="lb-time">${fmtTime(row.best)}</span>
      </div>`;
    }).join('');
  }

  function updateStamps() {
    stamps.forEach(s => s.classList.toggle('active', s.dataset.level === sessionLevel));
    if (sessionLevel) renderRankPreview(sessionLevel);
  }

  stamps.forEach(s => {
    s.addEventListener('click', () => {
      sessionLevel = s.dataset.level;
      errorEl.textContent = '';
      updateStamps();
    });
  });

  btnToGame.addEventListener('click', async () => {
    if (!sessionLevel) { errorEl.textContent = 'กรุณาเลือกระดับความยาก'; return; }
    player.level = sessionLevel;
    await savePlayer(player);
    onPlay(player);
  });

  // Load leaderboard data async
  rankBody.innerHTML = '<div class="empty-msg"><span class="spinner"></span>กำลังโหลด...</div>';
  fetchAllPlayers().then(data => {
    allPlayers = data;
    updateStamps();
    if (!sessionLevel) rankBody.innerHTML = '<div class="empty-msg">เลือกระดับด้านบนเพื่อดูอันดับ</div>';
  });

  return el;
}
