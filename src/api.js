/**
 * API client — fetches data directly from LeetCode's public GraphQL endpoint.
 *
 * Query options:
 *   - Specific year: query userCalendar(year: YYYY) & submitStatsGlobal
 *   - Rolling calendar: query c1: userCalendar(year: YYYY-1) & c2: userCalendar(year: YYYY) & submitStatsGlobal
 */

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';

/**
 * Sleep for the given number of milliseconds.
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper to fetch from LeetCode GraphQL API with timeout and retry logic.
 * Retries up to 3 times on temporary network errors.
 *
 * @param {string} query
 * @param {Object} variables
 * @param {number} timeoutMs
 * @param {number} retries
 * @returns {Promise<Object>}
 */
async function fetchGraphQL(query, variables, timeoutMs = 20000, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(LEETCODE_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://leetcode.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP status ${res.status}`);
      }

      const json = await res.json();
      
      if (json.errors) {
        const errorMsg = json.errors[0]?.message || 'GraphQL Query Error';
        throw new Error(errorMsg);
      }

      return json;
    } catch (err) {
      clearTimeout(timer);
      if (attempt === retries) throw err;
      
      const isRetryable = err.name === 'AbortError' || err.message.includes('status 5') || err.message.includes('status 429');
      if (isRetryable) {
        const delay = attempt * 2000;
        console.warn(`  ⏳ LeetCode GraphQL request failed (${err.message}), retrying in ${delay}ms... (attempt ${attempt}/${retries})`);
        await sleep(delay);
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * Fetch calendar and stats data from LeetCode for a user.
 *
 * @param {string} username
 * @param {number|null} year — if null, fetches rolling 1-year calendar
 */
async function fetchFromLeetCode(username, year = null) {
  const currentYear = new Date().getUTCFullYear();
  let query;
  let variables = { username };

  if (year) {
    // Fixed calendar year query
    query = `
      query userProblemsAndCalendar($username: String!, $year: Int!) {
        matchedUser(username: $username) {
          userCalendar(year: $year) {
            activeYears
            streak
            totalActiveDays
            submissionCalendar
          }
          submitStats: submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
      }
    `;
    variables.year = year;
  } else {
    // Rolling calendar query (spanning current and previous calendar year)
    query = `
      query userProblemsAndCalendar($username: String!, $year1: Int!, $year2: Int!) {
        matchedUser(username: $username) {
          c1: userCalendar(year: $year1) {
            activeYears
            streak
            totalActiveDays
            submissionCalendar
          }
          c2: userCalendar(year: $year2) {
            activeYears
            streak
            totalActiveDays
            submissionCalendar
          }
          submitStats: submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
      }
    `;
    variables.year1 = currentYear - 1;
    variables.year2 = currentYear;
  }

  const json = await fetchGraphQL(query, variables);
  const user = json.data?.matchedUser;

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

/**
 * Fetch all data needed for the SVG generator.
 *
 * @param {string} username
 * @param {number|null} year
 */
async function fetchAllData(username, year = null) {
  const user = await fetchFromLeetCode(username, year);

  // Extract solved stats
  const stats = user.submitStats?.acSubmissionNum || [];
  const getSolvedCount = (diff) => stats.find((s) => s.difficulty === diff)?.count || 0;

  const solvedProblem = getSolvedCount('All');
  const easySolved = getSolvedCount('Easy');
  const mediumSolved = getSolvedCount('Medium');
  const hardSolved = getSolvedCount('Hard');

  // Extract calendar stats
  let submissionMap = {};
  let streak = 0;
  let totalActiveDays = 0;
  let activeYears = [];

  if (year) {
    const calendar = user.userCalendar;
    if (calendar) {
      activeYears = calendar.activeYears || [];
      streak = calendar.streak || 0;
      totalActiveDays = calendar.totalActiveDays || 0;

      try {
        submissionMap =
          typeof calendar.submissionCalendar === 'string'
            ? JSON.parse(calendar.submissionCalendar)
            : calendar.submissionCalendar || {};
      } catch {
        submissionMap = {};
      }
    }
  } else {
    // Rolling calendar: merge current and previous calendar year submissions
    const c1 = user.c1 || {};
    const c2 = user.c2 || {};

    activeYears = c2.activeYears || c1.activeYears || [];
    // Use the current year's streak (which is the user's latest streak)
    streak = c2.streak || c1.streak || 0;

    let map1 = {};
    let map2 = {};
    try {
      map1 =
        typeof c1.submissionCalendar === 'string'
          ? JSON.parse(c1.submissionCalendar)
          : c1.submissionCalendar || {};
    } catch {}
    try {
      map2 =
        typeof c2.submissionCalendar === 'string'
          ? JSON.parse(c2.submissionCalendar)
          : c2.submissionCalendar || {};
    } catch {}

    submissionMap = { ...map1, ...map2 };
    // totalActiveDays will be computed dynamically from the cells in the grid for rolling calendar
  }

  return {
    username,
    year,
    submissionMap,
    streak,
    totalActiveDays,
    activeYears,
    solvedProblem,
    easySolved,
    mediumSolved,
    hardSolved,
  };
}

module.exports = { fetchAllData };
