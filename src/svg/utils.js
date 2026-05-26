/**
 * Utility functions for computing the heatmap grid,
 * color levels, month label positions, and text helpers.
 *
 * IMPORTANT: All date arithmetic uses UTC to match the
 * unix timestamps returned by the LeetCode API.
 */

const { THEME, DIMENSIONS } = require('./theme');

/* ────────────────────────────────────────────────────
 * Submission level mapping
 * ──────────────────────────────────────────────────── */

/**
 * Map a raw submission count to a 0–4 intensity level.
 * @param {number} count
 * @returns {number}
 */
function getSubmissionLevel(count) {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

/**
 * Return the heatmap color for a given count.
 * @param {number} count
 * @returns {string} hex color
 */
function getColor(count) {
  return THEME.heatmap[getSubmissionLevel(count)];
}

/* ────────────────────────────────────────────────────
 * Calendar grid generation (UTC-based)
 * ──────────────────────────────────────────────────── */

/**
 * Build the 53 × 7 grid of cells for a given year (fixed or rolling).
 *
 * Uses UTC dates throughout so that timestamp lookups
 * match the API's UTC-midnight unix timestamps exactly.
 *
 * @param {number|null} year — if null, generates a rolling 1-year calendar
 * @param {Object<string,number>} submissionMap  — { "unix_ts": count }
 * @returns {{ cells: Array<{x,y,date:Date,count,color,level}>, weeks: number }}
 */
function getCalendarGrid(year, submissionMap) {
  const { cellSize, cellGap } = DIMENSIONS;
  const gridOffsetX = 40;
  const gridOffsetY = 25;
  const step = cellSize + cellGap;
  const MS_PER_DAY = 86400000;

  let startMs, endMs;
  const isRolling = !year;

  if (isRolling) {
    // Rolling 1-year calendar: 53 weeks ending on the Sunday of the current week
    const now = new Date();
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const d = new Date(todayUtc);
    const day = d.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const daysToSunday = day === 0 ? 0 : 7 - day;
    endMs = todayUtc + daysToSunday * MS_PER_DAY;
    startMs = endMs - (53 * 7 - 1) * MS_PER_DAY; // starts on a Monday
  } else {
    // Fixed calendar year: Jan 1 to Dec 31
    startMs = Date.UTC(year, 0, 1);
    endMs = Date.UTC(year, 11, 31);
  }

  // dayOfWeek: 0 = Sun … 6 = Sat  →  remap to Mon-first: Mon=0 … Sun=6
  const remapDay = (d) => (d === 0 ? 6 : d - 1);

  const cells = [];
  let weekCol = 0;
  let curMs = startMs;

  while (curMs <= endMs) {
    const d = new Date(curMs);
    const dayIndex = remapDay(d.getUTCDay()); // row

    // Detect week change (every Monday after first cell)
    if (dayIndex === 0 && cells.length > 0) {
      weekCol++;
    }

    // Look up submission count — API uses seconds, not ms
    const tsSec = curMs / 1000;
    const count = submissionMap[String(tsSec)] || 0;

    cells.push({
      x: gridOffsetX + weekCol * step,
      y: gridOffsetY + dayIndex * step,
      date: d,
      count,
      color: getColor(count),
      level: getSubmissionLevel(count),
    });

    curMs += MS_PER_DAY;
  }

  return { cells, weeks: weekCol + 1 };
}

/* ────────────────────────────────────────────────────
 * Month labels
 * ──────────────────────────────────────────────────── */

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Calculate the x-position for each month label dynamically based on
 * the generated week columns and date transitions.
 *
 * @param {Array<Object>} cells — array of grid cells
 * @returns {Array<{name: string, x: number}>}
 */
function getMonthLabels(cells) {
  const { cellSize, cellGap } = DIMENSIONS;
  const gridOffsetX = 40;
  const step = cellSize + cellGap;
  const labels = [];

  // Group cells by week column
  const weeks = [];
  for (const cell of cells) {
    const weekCol = Math.round((cell.x - gridOffsetX) / step);
    if (!weeks[weekCol]) weeks[weekCol] = [];
    weeks[weekCol].push(cell);
  }

  let lastMonth = -1;
  for (let w = 0; w < weeks.length; w++) {
    if (!weeks[w] || weeks[w].length === 0) continue;
    // Look at the first cell in this week column (usually Monday)
    const date = weeks[w][0].date;
    const month = date.getUTCMonth();
    if (month !== lastMonth) {
      labels.push({
        name: MONTH_NAMES[month],
        x: weeks[w][0].x,
      });
      lastMonth = month;
    }
  }

  // Deduplicate/remove labels that are too close (within 3 columns)
  // to avoid overlapping text in the SVG
  for (let i = 1; i < labels.length; i++) {
    if (labels[i].x - labels[i - 1].x < step * 3) {
      labels.splice(i, 1);
      i--;
    }
  }

  return labels;
}

/* ────────────────────────────────────────────────────
 * Text helpers
 * ──────────────────────────────────────────────────── */

/**
 * Escape XML special characters for safe embedding in SVG.
 * @param {string} str
 * @returns {string}
 */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format a number with commas (e.g. 1234 → "1,234").
 * @param {number} n
 * @returns {string}
 */
function formatNumber(n) {
  return Number(n).toLocaleString('en-US');
}

module.exports = {
  getSubmissionLevel,
  getColor,
  getCalendarGrid,
  getMonthLabels,
  escapeXml,
  formatNumber,
};
