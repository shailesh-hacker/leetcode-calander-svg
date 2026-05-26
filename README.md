<div align="center">

# 📊 LeetCode Calendar SVG Generator

**Generate beautiful GitHub-style contribution heatmap and stats SVGs for your LeetCode profile**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## ✨ Features

This project provides two distinct, highly optimized SVGs to embed in your GitHub README:

1. 🗓️ **Compact Heatmap Grid (`GET /:username`)**: A clean 53-week contribution grid showing your submissions, re-mapped to perfect Monday–Sunday columns. Contains only month labels, day labels, and the grid.
2. 📊 **Streak & Active Days Card (`GET /:username/stats`)**: A dedicated premium stats card showing your active days and current streak with custom-designed vector flame/calendar icons.

Both options support:
- ⚡ **Direct GraphQL Integration** — Queries `leetcode.com` directly, bypassing third-party rate-limited proxies.
- 🔄 **Rolling 1-Year View** — Defaults to a rolling 53-week calendar (perfect for live profile cards). Falls back to fixed years if `?year=YYYY` is specified.
- 🎨 **Sleek Dark Theme** — Color-coded grid cells matching GitHub's dark mode colors.

---

## 🚀 Deployment on Vercel (Recommended)

This project is pre-configured to run as a **Vercel Serverless Function** using `vercel.json`.

### Option A: 1-Click Import (easiest)
1. Push this repository to your GitHub account.
2. Log in to [Vercel](https://vercel.com).
3. Click **"Add New" > "Project"** and import your repository.
4. Vercel will automatically read [vercel.json](file:///c:/Users/shail/Desktop/passion/leetcode-calander-svg/vercel.json) and deploy the project.

### Option B: Vercel CLI
If you have Vercel CLI installed:
```bash
vercel
```

Once deployed, your profile markdown embeds will look like this:
```markdown
<p align="center">
  <img src="https://your-app-domain.vercel.app/shailesh-hacker" width="790" alt="LeetCode Heatmap Grid"/>
</p>
<p align="center">
  <img src="https://your-app-domain.vercel.app/shailesh-hacker/stats" width="380" alt="LeetCode Stats"/>
</p>
```

---

## 🤖 Serverless Automation (Zero-Host Alternative)

If you don't want to run a web server, you can use the built-in **GitHub Actions** schedule to run the script and push the SVGs directly into your profile repository!

1. Go to your repository **Settings > Actions > General > Workflow permissions** and set to **"Read and write permissions"**.
2. Customize the username in [.github/workflows/update-leetcode.yml](file:///c:/Users/shail/Desktop/passion/leetcode-calander-svg/.github/workflows/update-leetcode.yml).
3. The Action will automatically run every 12 hours, generate the SVGs, and commit them.
4. Reference the committed files directly in your `README.md`:
   ```markdown
   <p align="center">
     <img src="shailesh-hacker-grid.svg" width="790" alt="LeetCode Heatmap Grid"/>
   </p>
   <p align="center">
     <img src="shailesh-hacker-stats.svg" width="380" alt="LeetCode Stats"/>
   </p>
   ```

---

## 📖 API Reference

### `GET /:username`

Generates the compact contribution heatmap grid.

| Parameter  | Type   | Default | Description |
| ---------- | ------ | ------- | ----------- |
| `username` | path   | *req*   | LeetCode username |
| `year`     | query  | rolling | Optional. Fixed calendar year (e.g. `2025`) |

---

### `GET /:username/stats`

Generates the stats card (active days & current streak).

| Parameter  | Type   | Default | Description |
| ---------- | ------ | ------- | ----------- |
| `username` | path   | *req*   | LeetCode username |
| `year`     | query  | rolling | Optional. Fixed calendar year (e.g. `2025`) |

---

## 🏗️ Project Structure

```
leetcode-calendar-svg/
├── .github/workflows/
│   └── update-leetcode.yml # GitHub Actions scheduled workflow
├── src/
│   ├── index.js            # Express server entry point & routing
│   ├── api.js              # Direct LeetCode GraphQL client
│   └── svg/
│       ├── generator.js    # Heatmap & stats SVG builders
│       ├── theme.js        # Dark theme palettes & margins
│       └── utils.js        # Date manipulation & cell mapping
├── generate.js             # CLI script for local SVG generation
├── vercel.json             # Vercel serverless routing configuration
├── package.json
└── README.md
```

---

## 🔧 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Dev Server
```bash
npm run dev
```

### 3. CLI Generation Test
```bash
node generate.js shailesh-hacker
```

---

## 🎨 Design Colors

| Level | Color     | Submissions |
| ----- | --------- | ----------- |
| 0     | `#161b22` | None        |
| 1     | `#0e4429` | 1–2         |
| 2     | `#006d32` | 3–5         |
| 3     | `#26a641` | 6–9         |
| 4     | `#39d353` | 10+         |

---

## 📝 License

[MIT](LICENSE) — feel free to use, modify, and share.
