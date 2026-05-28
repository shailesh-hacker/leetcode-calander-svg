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
  getMaxStreak,
  escapeXml,
  formatNumber,
} = require('./utils');

/* ────────────────────────────────────────────────────
 * Main Contribution Heatmap Grid
 * ──────────────────────────────────────────────────── */

/**
 * Generate the compact heatmap grid SVG string matching LeetCode's native specifications.
 * Contains only month/week grouped cells and month labels.
 *
 * Dimensions: dynamic width (default 764.74px) × 104.64px
 *
 * @param {Object} data
 * @param {number|null} data.year
 * @param {Object} data.submissionMap
 * @returns {string} SVG markup
 */
function generateSvg(data) {
  const { year, submissionMap } = data;

  const { cells, months } = getCalendarGrid(year, submissionMap);
  const monthLabels = getMonthLabels(months);

  // Find the maximum x coordinate to determine the SVG viewBox width dynamically
  let maxWeekX = 0;
  months.forEach(m => {
    m.weeks.forEach(w => {
      if (w.x > maxWeekX) {
        maxWeekX = w.x;
      }
    });
  });
  const viewBoxWidth = maxWeekX + 8.86; // cell size 8.86

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxWidth} 104.64" width="694" fill="none">
  <style>
    svg {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    :root {
      --fill-tertiary: rgba(255, 255, 255, 0.08);
      --green-20: #1e3a27;
      --green-60: #15803d;
      --green-80: #22c55e;
      --text-muted: #8b949e;
    }
    @media (prefers-color-scheme: light) {
      :root {
        --fill-tertiary: rgba(0, 0, 0, 0.06);
        --green-20: #dcfce7;
        --green-60: #4ade80;
        --green-80: #16a34a;
        --text-muted: #57606a;
      }
    }
    .cursor-pointer {
      cursor: pointer;
    }
  </style>

  <!-- Heatmap grid -->
  ${renderGrid(months)}

  <!-- Month labels -->
  ${renderMonthLabels(monthLabels)}
</svg>`;
}

function renderMonthLabels(labels) {
  return labels
    .map(
      (l) =>
        `<text x="${l.x}" y="97.14" fill="var(--text-muted, #AFB4BD)" font-size="14px" class="font-xs">${l.name}</text>`
    )
    .join('\n  ');
}

function renderGrid(months) {
  return months
    .map((m) => {
      const weeksStr = m.weeks
        .map((w) => {
          const rectsStr = w.rects
            .map((r) => {
              if (r.isTransparent) {
                return `<rect x="${r.x}" y="${r.y}" width="8.86" height="8.86" fill="transparent" rx="2" ry="2"></rect>`;
              }
              const titleTag = `<title>${r.tooltip}</title>`;
              return `<rect x="${r.x}" y="${r.y}" width="8.86" height="8.86" fill="${r.fill}" rx="2" ry="2" class="cursor-pointer" data-state="closed">${titleTag}</rect>`;
            })
            .join('');
          return `<g x="${w.x}" y="0" class="week ${w.num}">${rectsStr}</g>`;
        })
        .join('');
      return `<g x="${m.x}" y="0" class="month ${m.num}">${weeksStr}</g>`;
    })
    .join('');
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

  const { cells } = getCalendarGrid(year, submissionMap);

  // Compute active days from cells if rolling calendar, else use totalActiveDays
  let activeDays = totalActiveDays;
  if (!year) {
    activeDays = cells.filter((c) => c.count > 0).length;
  }

  // Calculate maximum streak dynamically from grid cells and current streak
  const maxStreak = Math.max(streak, getMaxStreak(cells));

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
    <text x="52" y="47" fill="${THEME.streak}" font-size="24" font-weight="700" font-family="${FONTS.main}">${formatNumber(maxStreak)}</text>
    <text x="52" y="66" fill="${THEME.textMuted}" font-size="12" font-weight="500" font-family="${FONTS.main}">Max Streak</text>
  </g>
</svg>`;
}

/* ────────────────────────────────────────────────────
 * Solved Problems Stats Card
 * ──────────────────────────────────────────────────── */

/**
 * Generate a premium stats card SVG showing solved problem counts
 * broken down by difficulty (Easy, Medium, Hard) with progress bars.
 *
 * Dimensions: 380px × 130px
 *
 * @param {Object} data
 * @param {number} data.solvedProblem
 * @param {number} data.easySolved
 * @param {number} data.mediumSolved
 * @param {number} data.hardSolved
 * @returns {string} SVG markup
 */
function generateProblemsSvg(data) {
  const {
    solvedProblem,
    easySolved,
    mediumSolved,
    hardSolved,
    totalEasy = 850,
    totalMedium = 1800,
    totalHard = 800
  } = data;

  const width = 380;
  const height = 100;
  const borderRadius = 12;

  const totalProblems = totalEasy + totalMedium + totalHard;

  // Progress calculations
  const easyPct = Math.min((easySolved / totalEasy) * 100, 100);
  const medPct = Math.min((mediumSolved / totalMedium) * 100, 100);
  const hardPct = Math.min((hardSolved / totalHard) * 100, 100);
  const overallPct = Math.min((solvedProblem / totalProblems) * 100, 100);

  // Layout geometry
  const barWidth = 210;
  const barHeight = 4;
  const barX = 145;
  const barRadius = 2;

  const easyFill = (easyPct / 100) * barWidth;
  const medFill = (medPct / 100) * barWidth;
  const hardFill = (hardPct / 100) * barWidth;

  // Circular gauge geometry
  const circleRadius = 28;
  const circumference = 2 * Math.PI * circleRadius; // ~175.93
  const strokeDashoffset = circumference - (overallPct / 100) * circumference;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <!-- Gradient for circular progress -->
  <defs>
    <linearGradient id="solvedGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00b8a3" />
      <stop offset="100%" stop-color="#00f2fe" />
    </linearGradient>
  </defs>

  <!-- Background card -->
  <rect width="${width}" height="${height}" rx="${borderRadius}" fill="${THEME.bg}" stroke="${THEME.cardBorder}" stroke-width="1"/>

  <!-- Left Column: Circular Progress Ring -->
  <g transform="translate(0, 0)">
    <!-- Background circle track -->
    <circle cx="65" cy="50" r="${circleRadius}" stroke="${THEME.cardBorder}" stroke-width="5" fill="none" />
    <!-- Foreground progress ring -->
    <circle cx="65" cy="50" r="${circleRadius}" stroke="url(#solvedGrad)" stroke-width="5" fill="none" 
            stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${strokeDashoffset.toFixed(2)}" 
            stroke-linecap="round" transform="rotate(-90 65 50)" />
    
    <!-- Text inside the circle -->
    <text x="65" y="47" fill="${THEME.text}" font-size="16" font-weight="700" font-family="${FONTS.main}" text-anchor="middle">${formatNumber(solvedProblem)}</text>
    <text x="65" y="60" fill="${THEME.textMuted}" font-size="8" font-weight="600" font-family="${FONTS.main}" text-anchor="middle" letter-spacing="0.5">SOLVED</text>
  </g>

  <!-- Divider -->
  <line x1="125" y1="15" x2="125" y2="85" stroke="${THEME.cardBorder}" stroke-width="1"/>

  <!-- Right Column: Difficulty Breakdown -->
  <g>
    <!-- Easy Row -->
    <g transform="translate(0, 0)">
      <text x="${barX}" y="24" fill="${THEME.easy}" font-size="12" font-weight="600" font-family="${FONTS.main}">Easy</text>
      <text x="355" y="24" text-anchor="end" font-family="${FONTS.main}" font-size="12">
        <tspan fill="${THEME.text}" font-weight="600">${easySolved}</tspan>
        <tspan fill="${THEME.textMuted}" font-weight="400">/${totalEasy}</tspan>
      </text>
      <rect x="${barX}" y="31" width="${barWidth}" height="${barHeight}" rx="${barRadius}" fill="rgba(0, 184, 163, 0.1)"/>
      <rect x="${barX}" y="31" width="${Math.max(easyFill, 2)}" height="${barHeight}" rx="${barRadius}" fill="${THEME.easy}"/>
    </g>

    <!-- Medium Row -->
    <g transform="translate(0, 0)">
      <text x="${barX}" y="50" fill="${THEME.medium}" font-size="12" font-weight="600" font-family="${FONTS.main}">Medium</text>
      <text x="355" y="50" text-anchor="end" font-family="${FONTS.main}" font-size="12">
        <tspan fill="${THEME.text}" font-weight="600">${mediumSolved}</tspan>
        <tspan fill="${THEME.textMuted}" font-weight="400">/${totalMedium}</tspan>
      </text>
      <rect x="${barX}" y="57" width="${barWidth}" height="${barHeight}" rx="${barRadius}" fill="rgba(255, 192, 30, 0.1)"/>
      <rect x="${barX}" y="57" width="${Math.max(medFill, 2)}" height="${barHeight}" rx="${barRadius}" fill="${THEME.medium}"/>
    </g>

    <!-- Hard Row -->
    <g transform="translate(0, 0)">
      <text x="${barX}" y="76" fill="${THEME.hard}" font-size="12" font-weight="600" font-family="${FONTS.main}">Hard</text>
      <text x="355" y="76" text-anchor="end" font-family="${FONTS.main}" font-size="12">
        <tspan fill="${THEME.text}" font-weight="600">${hardSolved}</tspan>
        <tspan fill="${THEME.textMuted}" font-weight="400">/${totalHard}</tspan>
      </text>
      <rect x="${barX}" y="83" width="${barWidth}" height="${barHeight}" rx="${barRadius}" fill="rgba(255, 55, 95, 0.1)"/>
      <rect x="${barX}" y="83" width="${Math.max(hardFill, 2)}" height="${barHeight}" rx="${barRadius}" fill="${THEME.hard}"/>
    </g>
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

module.exports = { generateSvg, generateStatsSvg, generateProblemsSvg, generateErrorSvg };
