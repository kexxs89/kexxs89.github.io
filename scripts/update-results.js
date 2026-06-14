// Fetches finished group-stage results from TheSportsDB and writes them into
// tippspiel-state.json. Run by .github/workflows/update-results.yml on a schedule.
// No npm dependencies: relies on Node 18+ global fetch.
const fs = require("fs");
const path = require("path");
const { WORLD_CUP_DATA } = require("../data.js");
const { RESULTS_FEED_URL, mergeFeedResults } = require("../results-feed.js");

(async () => {
  const statePath = path.join(__dirname, "..", "tippspiel-state.json");
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));

  const response = await fetch(`${RESULTS_FEED_URL}&_=${Date.now()}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();

  const { results, stats } = mergeFeedResults({
    events: data.events || [],
    results: state.results,
    worldCupData: WORLD_CUP_DATA,
  });
  state.results = results;

  // Match the format produced by the in-app export (downloadState) to keep diffs minimal.
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  console.log(`applied=${stats.applied} preserved=${stats.preserved} live=${stats.live} unmatched=${stats.unmatchedTeams}`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
