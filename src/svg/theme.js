/**
 * Dark theme color palette and dimension constants
 * for the LeetCode Calendar SVG generator.
 */

const THEME = {
  // ── Background & surfaces ──
  bg: '#0d1117',
  cardBg: '#161b22',
  cardBorder: '#30363d',

  // ── Text ──
  text: '#c9d1d9',
  textMuted: '#8b949e',
  textAccent: '#58a6ff',

  // ── Heatmap color scale (5 levels) ──
  heatmap: [
    '#161b22',   // 0  — no submissions
    '#0e4429',   // 1  — low  (1–2)
    '#006d32',   // 2  — med  (3–5)
    '#26a641',   // 3  — high (6–9)
    '#39d353',   // 4  — max  (10+)
  ],

  // ── LeetCode difficulty colors ──
  easy: '#00b8a3',
  medium: '#ffc01e',
  hard: '#ff375f',

  // ── Accent / decorative ──
  streak: '#ff9500',
  activeDays: '#58a6ff',
};

const DIMENSIONS = {
  // ── Overall card ──
  width: 900,
  height: 330,
  padding: 28,
  borderRadius: 12,

  // ── Grid cells ──
  cellSize: 11,
  cellGap: 3,
  cellRadius: 2,

  // ── Grid positioning ──
  gridOffsetX: 60,   // space for day-of-week labels
  gridOffsetY: 90,   // space for header + month labels

  // ── Font sizes ──
  fontHeader: 16,
  fontMonth: 11,
  fontDay: 10,
  fontStatValue: 22,
  fontStatLabel: 11,
  fontFooter: 11,
};

const FONTS = {
  main: "'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif",
};

module.exports = { THEME, DIMENSIONS, FONTS };
