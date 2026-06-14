// Shared feed/results logic, used by both the browser app (app.js) and the
// GitHub Actions updater (scripts/update-results.js). UMD-style wrapper:
//   - In the browser (classic script) it attaches its exports to globalThis.
//   - Under Node it exports via module.exports.
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    Object.assign(root, api);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const RESULTS_FEED_URL = "https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4429&s=2026";

  // Order of the six group matches per group (team indices within the group).
  const GROUP_PAIRINGS = [
    [0, 1],
    [2, 3],
    [0, 2],
    [3, 1],
    [3, 0],
    [1, 2],
  ];

  // Statuses (uppercased) that mean a match is over and the score is final.
  const FINISHED_STATUSES = new Set(["FT", "AET", "MATCH FINISHED", "FINISHED", "AWARDED", "FINAL"]);

  // English team names as used by the TheSportsDB feed, mapped to our internal team IDs.
  const TEAM_FEED_NAMES = {
    A1: ["Mexico"],
    A2: ["South Africa"],
    A3: ["South Korea", "Korea Republic"],
    A4: ["Czech Republic", "Czechia"],
    B1: ["Canada"],
    B2: ["Bosnia and Herzegovina", "Bosnia-Herzegovina", "Bosnia Herzegovina"],
    B3: ["Qatar"],
    B4: ["Switzerland"],
    C1: ["Brazil"],
    C2: ["Morocco"],
    C3: ["Haiti"],
    C4: ["Scotland"],
    D1: ["USA", "United States"],
    D2: ["Paraguay"],
    D3: ["Australia"],
    D4: ["Turkey", "Türkiye", "Turkiye"],
    E1: ["Germany"],
    E2: ["Curacao", "Curaçao"],
    E3: ["Ivory Coast", "Côte d'Ivoire", "Cote d'Ivoire"],
    E4: ["Ecuador"],
    F1: ["Netherlands"],
    F2: ["Japan"],
    F3: ["Sweden"],
    F4: ["Tunisia"],
    G1: ["Belgium"],
    G2: ["Egypt"],
    G3: ["Iran"],
    G4: ["New Zealand"],
    H1: ["Spain"],
    H2: ["Cape Verde", "Cabo Verde"],
    H3: ["Saudi Arabia"],
    H4: ["Uruguay"],
    I1: ["France"],
    I2: ["Senegal"],
    I3: ["Iraq"],
    I4: ["Norway"],
    J1: ["Argentina"],
    J2: ["Algeria"],
    J3: ["Austria"],
    J4: ["Jordan"],
    K1: ["Portugal"],
    K2: ["DR Congo", "Congo DR", "Democratic Republic of Congo"],
    K3: ["Uzbekistan"],
    K4: ["Colombia"],
    L1: ["England"],
    L2: ["Croatia"],
    L3: ["Ghana"],
    L4: ["Panama"],
  };

  function normalizeFeedName(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  function isFinishedStatus(status, hasBothScores) {
    const normalized = String(status || "").trim().toUpperCase();
    if (!hasBothScores) return false;
    if (normalized === "") return true;
    if (FINISHED_STATUSES.has(normalized)) return true;
    if (normalized.startsWith("FT")) return true;
    return normalized.includes("FINISH");
  }

  // Build the 72 group-stage matches from the tournament definition.
  function buildMatches(worldCupData) {
    return worldCupData.groups.flatMap((group) =>
      GROUP_PAIRINGS.map(([homeIndex, awayIndex], index) => ({
        id: `${group.id}${index + 1}`,
        groupId: group.id,
        homeId: `${group.id}${homeIndex + 1}`,
        awayId: `${group.id}${awayIndex + 1}`,
        label: `Gruppe ${group.id}, Spiel ${index + 1}`,
      })),
    );
  }

  // Pure merge: returns a new `results` object with finished group-stage scores
  // from the feed applied. Existing match results, group winners and stages are
  // preserved; only finished group matches are (re)written. No network, no DOM.
  function mergeFeedResults({ events, results, worldCupData }) {
    const teamIdByFeedName = {};
    Object.entries(TEAM_FEED_NAMES).forEach(([teamId, names]) => {
      names.forEach((name) => {
        teamIdByFeedName[normalizeFeedName(name)] = teamId;
      });
    });

    const matchByTeamPair = {};
    buildMatches(worldCupData).forEach((match) => {
      matchByTeamPair[[match.homeId, match.awayId].sort().join("|")] = match;
    });

    const base = results || {};
    const nextResults = {
      matches: { ...(base.matches || {}) },
      groupWinners: { ...(base.groupWinners || {}) },
      stages: { ...(base.stages || {}) },
    };

    const stats = { applied: 0, live: 0, unmatchedTeams: 0, preserved: 0 };

    const hasExistingResult = (entry) =>
      entry && Number.isFinite(Number(entry.home)) && Number.isFinite(Number(entry.away));

    (events || []).forEach((event) => {
      const homeId = teamIdByFeedName[normalizeFeedName(event.strHomeTeam)];
      const awayId = teamIdByFeedName[normalizeFeedName(event.strAwayTeam)];
      if (!homeId || !awayId) {
        stats.unmatchedTeams += 1;
        return;
      }

      const match = matchByTeamPair[[homeId, awayId].sort().join("|")];
      if (!match) return; // Not a group-stage fixture (e.g. a knockout match).

      // Never overwrite a result that is already entered.
      if (hasExistingResult(nextResults.matches[match.id])) {
        stats.preserved += 1;
        return;
      }

      const rawHome = event.intHomeScore;
      const rawAway = event.intAwayScore;
      const hasBothScores = rawHome !== null && rawHome !== "" && rawAway !== null && rawAway !== "";
      if (!hasBothScores) return;

      if (!isFinishedStatus(event.strStatus, hasBothScores)) {
        stats.live += 1;
        return;
      }

      const feedHome = Number(rawHome);
      const feedAway = Number(rawAway);
      // Orient the scores to our match's home/away (feed order may differ).
      nextResults.matches[match.id] =
        match.homeId === homeId ? { home: feedHome, away: feedAway } : { home: feedAway, away: feedHome };
      stats.applied += 1;
    });

    return { results: nextResults, stats };
  }

  return { RESULTS_FEED_URL, GROUP_PAIRINGS, buildMatches, mergeFeedResults };
});
