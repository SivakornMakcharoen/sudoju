export const LEVEL_CLUES = { beginner: 40, intermediate: 32, advance: 26 };
export const LEVEL_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advance: 'Advance' };
export const MIN_PLAUSIBLE_SEC = { beginner: 20, intermediate: 35, advance: 60 };

function emptyGrid() {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function isSafe(grid, r, c, v) {
  for (let i = 0; i < 9; i++) {
    if (grid[r][i] === v || grid[i][c] === v) return false;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      if (grid[br + i][bc + j] === v) return false;
  return true;
}

function shuffledNums() {
  const a = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fillGrid(grid) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        for (const v of shuffledNums()) {
          if (isSafe(grid, r, c, v)) {
            grid[r][c] = v;
            if (fillGrid(grid)) return true;
            grid[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function countSolutions(grid, limit) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        let count = 0;
        for (let v = 1; v <= 9; v++) {
          if (isSafe(grid, r, c, v)) {
            grid[r][c] = v;
            count += countSolutions(grid, limit - count);
            grid[r][c] = 0;
            if (count >= limit) return count;
          }
        }
        return count;
      }
    }
  }
  return 1;
}

/**
 * Generate a puzzle for the given level.
 * @returns {{ solution: number[][], puzzle: number[][], given: boolean[][] }}
 */
export function makePuzzle(level) {
  const full = emptyGrid();
  fillGrid(full);
  const solution = full.map(row => row.slice());
  const work = full.map(row => row.slice());
  const clueTarget = LEVEL_CLUES[level] ?? 36;
  let toRemove = 81 - clueTarget;

  const positions = [];
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      positions.push([r, c]);

  // shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  let removed = 0;
  for (const [r, c] of positions) {
    if (removed >= toRemove) break;
    const backup = work[r][c];
    if (backup === 0) continue;
    work[r][c] = 0;
    const copy = work.map(row => row.slice());
    if (countSolutions(copy, 2) === 1) {
      removed++;
    } else {
      work[r][c] = backup;
    }
  }

  const given = work.map(row => row.map(v => v !== 0));
  return { solution, puzzle: work, given };
}

/** Return a conflict map: conflict[r][c] === true if that cell has a duplicate */
export function computeConflicts(puzzle) {
  const conflict = Array.from({ length: 9 }, () => Array(9).fill(false));

  for (let r = 0; r < 9; r++) {
    const seen = {};
    for (let c = 0; c < 9; c++) {
      const v = puzzle[r][c];
      if (v) (seen[v] = seen[v] || []).push(c);
    }
    Object.values(seen).forEach(cols => { if (cols.length > 1) cols.forEach(c => (conflict[r][c] = true)); });
  }

  for (let c = 0; c < 9; c++) {
    const seen = {};
    for (let r = 0; r < 9; r++) {
      const v = puzzle[r][c];
      if (v) (seen[v] = seen[v] || []).push(r);
    }
    Object.values(seen).forEach(rows => { if (rows.length > 1) rows.forEach(r => (conflict[r][c] = true)); });
  }

  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const seen = {};
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const r = br * 3 + i, c = bc * 3 + j, v = puzzle[r][c];
          if (v) (seen[v] = seen[v] || []).push([r, c]);
        }
      }
      Object.values(seen).forEach(cells => { if (cells.length > 1) cells.forEach(([r, c]) => (conflict[r][c] = true)); });
    }
  }

  return conflict;
}
