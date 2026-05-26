/**
 * SVG Generator — renders LeetCode SVGs.
 *
 * Produces two distinct SVG cards:
 *   1. generateSvg: Compact contribution heatmap grid (width 790px, height 130px).
 *   2. generateStatsSvg: Dedicated active days & streak card (width 380px, height 100px).
 */

const { THEME, DIMENSIONS, FONTS } = require('./theme');
const {
  getCalendarGrid,
  getMonthLabels,
  escapeXml,
  formatNumber,
} = require('./utils');

/* ────────────────────────────────────────────────────
 * Main Contribution Heatmap Grid
 * ──────────────────────────────────────────────────── */

/**
 * Generate the compact heatmap grid SVG string.
 * Contains only month labels, day labels, and cells.
 *
 * Dimensions: 790px × 130px
 *
 * @param {Object} data
 * @param {number|null} data.year
 * @param {Object} data.submissionMap
 * @returns {string} SVG markup
 */
function generateSvg(data) {
  const { year, submissionMap } = data;

  const width = 790;
  const height = 130;
  const borderRadius = 12;

  const { cells } = getCalendarGrid(year, submissionMap);
  const monthLabels = getMonthLabels(cells);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <!-- Background card -->
  <rect width="${width}" height="${height}" rx="${borderRadius}" fill="${THEME.bg}" stroke="${THEME.cardBorder}" stroke-width="1"/>

  <!-- Month labels -->
  ${renderMonthLabels(monthLabels)}

  <!-- Day-of-week labels -->
  ${renderDayLabels()}

  <!-- Heatmap grid -->
  ${renderGrid(cells)}
</svg>`;
}

function renderMonthLabels(labels) {
  const { fontMonth } = DIMENSIONS;
  const y = 17; // Align nicely above the grid cells (gridOffsetY = 25)

  return labels
    .map(
      (l) =>
        `<text x="${l.x}" y="${y}" fill="${THEME.textMuted}" font-size="${fontMonth}" font-family="${FONTS.main}">${l.name}</text>`
    )
    .join('\n  ');
}

function renderDayLabels() {
  const { cellSize, cellGap, fontDay } = DIMENSIONS;
  const gridOffsetX = 40;
  const gridOffsetY = 25;
  const step = cellSize + cellGap;
  const days = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

  return days
    .map((d, i) => {
      if (!d) return '';
      const y = gridOffsetY + i * step + cellSize - 1;
      return `<text x="${gridOffsetX - 8}" y="${y}" text-anchor="end" fill="${THEME.textMuted}" font-size="${fontDay}" font-family="${FONTS.main}">${d}</text>`;
    })
    .filter(Boolean)
    .join('\n  ');
}

function renderGrid(cells) {
  const { cellSize, cellRadius } = DIMENSIONS;

  return cells
    .map((c) => {
      const dateStr = c.date.toISOString().split('T')[0];
      const title = `${c.count} submission${c.count !== 1 ? 's' : ''} on ${dateStr}`;
      return `<rect x="${c.x}" y="${c.y}" width="${cellSize}" height="${cellSize}" rx="${cellRadius}" fill="${c.color}"><title>${title}</title></rect>`;
    })
    .filter(Boolean)
    .join('\n  ');
}

/* ────────────────────────────────────────────────────
 * Dedicated Streak & Active Days Card
 * ──────────────────────────────────────────────────── */

/**
 * Generate a separate premium stats card SVG showing streak and active days.
 *
 * Dimensions: 380px × 100px
 *
 * @param {Object} data
 * @param {number|null} data.year
 * @param {Object} data.submissionMap
 * @param {number} data.streak
 * @param {number} data.totalActiveDays
 * @returns {string} SVG markup
 */
function generateStatsSvg(data) {
  const { year, submissionMap, streak, totalActiveDays } = data;

  const width = 380;
  const height = 100;
  const borderRadius = 12;

  // Compute active days from cells if rolling calendar, else use totalActiveDays
  let activeDays = totalActiveDays;
  if (!year) {
    const { cells } = getCalendarGrid(year, submissionMap);
    activeDays = cells.filter((c) => c.count > 0).length;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <!-- Background card -->
  <rect width="${width}" height="${height}" rx="${borderRadius}" fill="${THEME.bg}" stroke="${THEME.cardBorder}" stroke-width="1"/>

  <!-- Left Column: Active Days -->
  <g transform="translate(15, 0)">
    <!-- Calendar Icon -->
    <g transform="translate(25, 38)">
      <rect x="0" y="2" width="16" height="16" rx="3" fill="none" stroke="${THEME.activeDays}" stroke-width="1.8"/>
      <line x1="0" y1="8" x2="16" y2="8" stroke="${THEME.activeDays}" stroke-width="1.8"/>
      <line x1="4" y1="0" x2="4" y2="4" stroke="${THEME.activeDays}" stroke-width="1.8"/>
      <line x1="12" y1="0" x2="12" y2="4" stroke="${THEME.activeDays}" stroke-width="1.8"/>
    </g>
    <!-- Stats text -->
    <text x="52" y="47" fill="${THEME.activeDays}" font-size="24" font-weight="700" font-family="${FONTS.main}">${formatNumber(activeDays)}</text>
    <text x="52" y="66" fill="${THEME.textMuted}" font-size="12" font-weight="500" font-family="${FONTS.main}">Active Days</text>
  </g>

  <!-- Divider -->
  <line x1="190" y1="20" x2="190" y2="80" stroke="${THEME.cardBorder}" stroke-width="1"/>

  <!-- Right Column: Streak -->
  <g transform="translate(195, 0)">
    <!-- Fire Icon -->
    <g transform="translate(25, 36)" fill="${THEME.streak}">
      <path d="M8 0C8 0 13.5 4.5 13.5 8.5C13.5 11.5 11 14 8 14C5 14 2.5 11.5 2.5 8.5C2.5 5 8 0 8 0Z"/>
      <path d="M8 4.5C8 4.5 10.5 7.5 10.5 9.5C10.5 11 9.5 12 8 12C6.5 12 5.5 11 5.5 9.5C5.5 8 8 4.5 8 4.5Z" fill="${THEME.medium}"/>
    </g>
    <!-- Stats text -->
    <text x="52" y="47" fill="${THEME.streak}" font-size="24" font-weight="700" font-family="${FONTS.main}">${formatNumber(streak)}</text>
    <text x="52" y="66" fill="${THEME.textMuted}" font-size="12" font-weight="500" font-family="${FONTS.main}">Current Streak</text>
  </g>
</svg>`;
}

/* ────────────────────────────────────────────────────
 * Error SVG
 * ──────────────────────────────────────────────────── */

/**
 * Generate a styled error SVG instead of a broken image.
 *
 * Dimensions: 790px × 120px
 *
 * @param {string} message
 * @returns {string}
 */
function generateErrorSvg(message) {
  const width = 790;
  const h = 120;
  const borderRadius = 12;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${h}" viewBox="0 0 ${width} ${h}" fill="none">
  <rect width="${width}" height="${h}" rx="${borderRadius}" fill="${THEME.bg}" stroke="${THEME.hard}" stroke-width="1"/>
  <text x="${width / 2}" y="45" text-anchor="middle" fill="${THEME.hard}" font-size="16" font-weight="600" font-family="${FONTS.main}">⚠ Error</text>
  <text x="${width / 2}" y="75" text-anchor="middle" fill="${THEME.textMuted}" font-size="13" font-family="${FONTS.main}">${escapeXml(message)}</text>
</svg>`;
}

module.exports = { generateSvg, generateStatsSvg, generateErrorSvg };
