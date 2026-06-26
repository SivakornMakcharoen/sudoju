import { fetchAllPlayers, topForLevel } from '../lib/players.js';
import { LEVEL_LABEL } from '../lib/puzzle.js';
import { escapeHtml, fmtTime } from '../lib/utils.js';

export function LeaderboardModal({ getCurrentPlayer }) {
  const el = document.createElement('div');
  el.className = 'overlay';
  el.id = 'overlay-lb';
  el.innerHTML = `
    <div class="modal">
      <h2>Leaderboard</h2>
      <div id="lb-body"><div class="empty-msg">กำลังโหลด...</div></div>
      <button class="btn ghost full" id="btn-lb-close" style="margin-top:16px;">ปิด</button>
    </div>
  `;

  const body    = el.querySelector('#lb-body');
  const btnClose= el.querySelector('#btn-lb-close');

  btnClose.addEventListener('click', () => el.classList.remove('show'));

  el.open = async () => {
    body.innerHTML = '<div class="empty-msg"><span class="spinner"></span>กำลังโหลด...</div>';
    el.classList.add('show');

    try {
      const players     = await fetchAllPlayers();
      const currentPlayer = getCurrentPlayer();
      const medals      = ['🥇', '🥈', '🥉'];
      const levels      = ['beginner', 'intermediate', 'advance'];

      body.innerHTML = levels.map(level => {
        const top = topForLevel(players, level, 3);
        const rows = top.length
          ? top.map((row, i) => {
              const isMe = currentPlayer && row.email === currentPlayer.email;
              return `<div class="lb-row">
                <span class="lb-name">${medals[i]} ${escapeHtml(row.name)}${isMe ? ' (คุณ)' : ''}</span>
                <span class="lb-time">${fmtTime(row.best)}</span>
              </div>`;
            }).join('')
          : '<div class="empty-msg">ยังไม่มีใครจบเกมระดับนี้</div>';

        return `<div style="margin-bottom:16px;">
          <div class="badge ${level}" style="margin-bottom:8px;">${LEVEL_LABEL[level]}</div>
          ${rows}
        </div>`;
      }).join('');
    } catch {
      body.innerHTML = '<div class="empty-msg">โหลดข้อมูลไม่สำเร็จ</div>';
    }
  };

  return el;
}
