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
/**
 * Build the hierarchical grid of cells matching LeetCode's native SVG structure.
 *
 * Uses UTC dates throughout so that timestamp lookups match the API's UTC-midnight
 * unix timestamps exactly.
 *
 * Spacing matches LeetCode's exact layout:
 * - cellSize = 8.86, cellGap = 2.66, step = 11.52
 * - month step = 15.95 (instead of 11.52)
 * - mid-week splits padded with transparent rects
 *
 * @param {number|null} year — if null, generates a rolling 1-year calendar ending today
 * @param {Object<string,number>} submissionMap  — { "unix_ts": count }
 * @returns {{ cells: Array<{date:Date,count,color,level}>, months: Array<Object> }}
 */
function getCalendarGrid(year, submissionMap) {
  const MS_PER_DAY = 86400000;
  const isRolling = !year;

  let startMs, endMs;
  if (isRolling) {
    const now = new Date();
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    endMs = todayUtc;
    startMs = todayUtc - 365 * MS_PER_DAY; // 366 days total inclusive (exactly 1 rolling year)
  } else {
    startMs = Date.UTC(year, 0, 1);
    endMs = Date.UTC(year, 11, 31);
  }

  // Generate flat array of actual days in order
  const days = [];
  let curMs = startMs;
  while (curMs <= endMs) {
    const d = new Date(curMs);
    const tsSec = curMs / 1000;
    const count = submissionMap[String(tsSec)] || 0;
    days.push({
      date: d,
      count,
      color: getColor(count),
      level: getSubmissionLevel(count),
      dayOfWeek: d.getUTCDay(),
      month: d.getUTCMonth(),
      year: d.getUTCFullYear(),
    });
    curMs += MS_PER_DAY;
  }

  // Build hierarchical Month -> Week -> Day structure
  const months = [];
  let currentMonthGroup = null;
  let currentWeekGroup = null;
  let currentX = 0;
  let lastWeekX = 0;
  let monthNum = 0;
  let weekNum = 0;

  for (let i = 0; i < days.length; i++) {
    const d = days[i];

    // 1. Detect month change
    const isNewMonth = currentMonthGroup === null ||
                       d.month !== currentMonthGroup.monthIndex ||
                       d.year !== currentMonthGroup.year;

    if (isNewMonth) {
      monthNum++;
      currentWeekGroup = null; // Close current week group
      weekNum = 0; // Reset week counter for the new month

      if (currentMonthGroup !== null) {
        // Shifting to a new month: step is 15.95 from the last week column
        currentX = lastWeekX + 15.95;
      } else {
        // Very first month starts at x = 0
        currentX = 0;
      }

      currentMonthGroup = {
        num: monthNum,
        monthIndex: d.month,
        year: d.year,
        x: currentX,
        weeks: [],
      };
      months.push(currentMonthGroup);
    }

    // 2. Detect week change
    // A week change occurs if there's no active week group, or if it's Sunday (dayOfWeek === 0)
    const isNewWeek = currentWeekGroup === null || d.dayOfWeek === 0;

    if (isNewWeek) {
      weekNum++;
      if (weekNum > 1) {
        // Same month week transition: step is 11.52
        currentX = lastWeekX + 11.52;
      }
      // Note: if weekNum === 1, currentX is already set to the month start x

      currentWeekGroup = {
        num: weekNum,
        x: currentX,
        rects: [],
      };
      currentMonthGroup.weeks.push(currentWeekGroup);
      lastWeekX = currentX; // Update last week X

      // Prepend transparent cells if the first day in this week starts mid-week
      const startDayOfWeek = d.dayOfWeek;
      for (let j = 0; j < startDayOfWeek; j++) {
        currentWeekGroup.rects.push({
          x: currentX,
          y: j * 11.52,
          fill: 'transparent',
          isTransparent: true,
        });
      }
    }

    // 3. Add actual day cell
    const dateStr = d.date.toISOString().split('T')[0];
    const tooltip = `${d.count} submission${d.count !== 1 ? 's' : ''} on ${dateStr}`;
    let fillVal = 'var(--fill-tertiary)';
    if (d.level === 1) fillVal = 'var(--green-20)';
    else if (d.level === 2) fillVal = 'var(--green-60)';
    else if (d.level >= 3) fillVal = 'var(--green-80)';

    currentWeekGroup.rects.push({
      x: currentX,
      y: d.dayOfWeek * 11.52,
      width: 8.86,
      height: 8.86,
      fill: fillVal,
      level: d.level,
      count: d.count,
      date: d.date,
      tooltip,
      isTransparent: false,
    });
  }

  return { cells: days, months };
}

/* ────────────────────────────────────────────────────
 * Month labels
 * ──────────────────────────────────────────────────── */

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Calculate the x-position for each month label dynamically based on LeetCode's formula:
 * labelX = (average x of all weeks in that month) - 8.64
 *
 * @param {Array<Object>} months — array of month groups
 * @returns {Array<{name: string, x: number}>}
 */
function getMonthLabels(months) {
  const labels = [];
  months.forEach((m) => {
    if (m.weeks.length === 0) return;
    const sumX = m.weeks.reduce((sum, w) => sum + w.x, 0);
    const avgX = sumX / m.weeks.length;
    const labelX = avgX - 8.64;

    // Only render label if it falls within the visible viewBox (x >= 0)
    if (labelX >= 0) {
      labels.push({
        name: MONTH_NAMES[m.monthIndex],
        x: labelX,
      });
    }
  });
  return labels;
}

/**
 * Calculate the maximum consecutive submission streak from grid cells.
 *
 * @param {Array<Object>} cells — array of grid cells
 * @returns {number} max streak
 */
function getMaxStreak(cells) {
  let maxStreak = 0;
  let currentStreak = 0;

  for (const cell of cells) {
    if (cell.count > 0) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
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
  getMaxStreak,
  escapeXml,
  formatNumber,
};
