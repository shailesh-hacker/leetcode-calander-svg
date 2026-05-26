/**
 * Express server — serves LeetCode calendar SVGs.
 *
 * Usage:
 *   GET /:username           → SVG for current year
 *   GET /:username?year=2024 → SVG for specific year
 *
 * Embed in GitHub README:
 *   ![LeetCode](https://your-domain.com/username?year=2024)
 */

const express = require('express');
const path = require('path');
const { fetchAllData } = require('./api');
const { generateSvg, generateStatsSvg, generateErrorSvg } = require('./svg/generator');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets from src/public
app.use(express.static(path.join(__dirname, 'public')));

/* ────────────────────────────────────────────────────
 * Web UI
 * ──────────────────────────────────────────────────── */

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ────────────────────────────────────────────────────
 * SVG route
 * ──────────────────────────────────────────────────── */

/* ────────────────────────────────────────────────────
 * Stats card route
 * ──────────────────────────────────────────────────── */

app.get('/:username/stats', async (req, res) => {
  const { username } = req.params;
  const year = req.query.year ? parseInt(req.query.year, 10) : null;

  // Set SVG response headers
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Validate username (basic sanity check)
    if (!/^[\w-]{1,39}$/.test(username)) {
      return res.status(400).send(
        generateErrorSvg(`Invalid username: "${username}"`)
      );
    }

    // Validate year
    if (year !== null && (year < 2000 || year > new Date().getFullYear() + 1)) {
      return res.status(400).send(
        generateErrorSvg(`Invalid year: ${year}`)
      );
    }

    const data = await fetchAllData(username, year);
    const svg = generateStatsSvg(data);

    // ETag for conditional requests
    const etag = `"${username}-stats-${year}-${Date.now().toString(36)}"`;
    res.setHeader('ETag', etag);

    return res.send(svg);
  } catch (err) {
    console.error(`[ERROR] /${username}/stats?year=${year}:`, err.message);

    if (err.name === 'AbortError') {
      return res.status(504).send(
        generateErrorSvg('LeetCode API timed out — please try again later')
      );
    }

    const isNotFound = err.message === 'User not found' || err.message.includes('does not exist');
    const statusCode = isNotFound ? 404 : 500;

    return res.status(statusCode).send(
      generateErrorSvg(err.message || `Could not load data for "${username}"`)
    );
  }
});

/* ────────────────────────────────────────────────────
 * SVG calendar route
 * ──────────────────────────────────────────────────── */

app.get('/:username', async (req, res) => {
  const { username } = req.params;
  const year = req.query.year ? parseInt(req.query.year, 10) : null;

  // Set SVG response headers
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Validate username (basic sanity check)
    if (!/^[\w-]{1,39}$/.test(username)) {
      return res.status(400).send(
        generateErrorSvg(`Invalid username: "${username}"`)
      );
    }

    // Validate year
    if (year !== null && (year < 2000 || year > new Date().getFullYear() + 1)) {
      return res.status(400).send(
        generateErrorSvg(`Invalid year: ${year}`)
      );
    }

    const data = await fetchAllData(username, year);
    const svg = generateSvg(data);

    // ETag for conditional requests
    const etag = `"${username}-${year}-${Date.now().toString(36)}"`;
    res.setHeader('ETag', etag);

    return res.send(svg);
  } catch (err) {
    console.error(`[ERROR] /${username}?year=${year}:`, err.message);

    if (err.name === 'AbortError') {
      return res.status(504).send(
        generateErrorSvg('LeetCode API timed out — please try again later')
      );
    }

    const isNotFound = err.message === 'User not found' || err.message.includes('does not exist');
    const statusCode = isNotFound ? 404 : 500;

    return res.status(statusCode).send(
      generateErrorSvg(err.message || `Could not load data for "${username}"`)
    );
  }
});

/* ────────────────────────────────────────────────────
 * Start server
 * ──────────────────────────────────────────────────── */

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n  🟢  LeetCode Calendar SVG server running`);
    console.log(`     http://localhost:${PORT}\n`);
    console.log(`  Try: http://localhost:${PORT}/shailendra?year=2022\n`);
  });
}

module.exports = app;
