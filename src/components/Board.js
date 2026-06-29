import { computeConflicts } from '../lib/puzzle.js';

export function Board({ getPuzzle, getGiven, getSelected, getNotes, onSelect }) {  const el = document.createElement('div');
  el.className = 'board';

  function render() {
    const puzzle   = getPuzzle();
    const given    = getGiven();
    const selected = getSelected();
    const notes    = getNotes();
    const conflicts = computeConflicts(puzzle);
    const selVal   = selected ? puzzle[selected.r][selected.c] : 0;

    el.innerHTML = '';

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';

        if ((c + 1) % 3 === 0 && c !== 8) cell.classList.add('border-r');
        if ((r + 1) % 3 === 0 && r !== 8) cell.classList.add('border-b');

        const key = `${r},${c}`;
        const cellNotes = notes[key] || [];
        const v = puzzle[r][c];

        if (cellNotes.length > 0) {
          cell.classList.add('has-notes');
          const noteEl = document.createElement('div');
          noteEl.className = 'notes-grid';
          // แสดงทีละแถว 3 ตัว
          for (let i = 0; i < cellNotes.length; i += 3) {
            const row = document.createElement('div');
            row.className = 'notes-row';
            row.textContent = cellNotes.slice(i, i + 3).join(' ');
            noteEl.appendChild(row);
          }
          cell.appendChild(noteEl);
        } else {
          if (v !== 0) cell.textContent = v;
          if (given[r][c]) cell.classList.add('given');
          else if (v !== 0) cell.classList.add('user');
          if (conflicts[r][c] && !given[r][c]) cell.classList.add('error');
        }

        if (selected) {
          const { r: sr, c: sc } = selected;
          const sameBox = Math.floor(r/3) === Math.floor(sr/3) && Math.floor(c/3) === Math.floor(sc/3);
          if (r === sr && c === sc) cell.classList.add('selected');
          else if (r === sr || c === sc || sameBox) cell.classList.add('peer');
        }

        if (selVal !== 0 && v === selVal && !(selected?.r === r && selected?.c === c))
          cell.classList.add('same-num');

        cell.addEventListener('click', () => onSelect(r, c));
        el.appendChild(cell);
      }
    }
  }

  el.refresh = render;
  return el;
}