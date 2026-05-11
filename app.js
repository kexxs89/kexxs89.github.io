const STORAGE_KEY = "wm-2026-tippspiel-state-v1";
const SUBMISSION_KEY = "wm-2026-tippspiel-submission-v1";
const PUBLISHED_STATE_URL = "./tippspiel-state.json";
const IS_ADMIN = new URLSearchParams(window.location.search).get("admin") === "1";
const SUBMISSION_FILE_TYPE = "wm-2026-tippspiel-submission-v1";
const VIEW_HASHES = {
  dashboard: "rangliste",
  submit: "tippabgabe",
  viewer: "tipps-ansehen",
  players: "teilnehmer",
  predictions: "tipps",
  results: "ergebnisse",
  rules: "punkte",
};
const VIEW_BY_HASH = Object.fromEntries(Object.entries(VIEW_HASHES).map(([view, hash]) => [hash, view]));

const GROUP_PAIRINGS = [
  [0, 1],
  [2, 3],
  [0, 2],
  [3, 1],
  [3, 0],
  [1, 2],
];

const teams = WORLD_CUP_DATA.groups.flatMap((group) =>
  group.teams.map((name, index) => ({
    id: `${group.id}${index + 1}`,
    groupId: group.id,
    name,
  })),
);

const teamById = Object.fromEntries(teams.map((team) => [team.id, team]));
const flagByTeamId = {
  A1: "🇲🇽",
  A2: "🇿🇦",
  A3: "🇰🇷",
  A4: "🇨🇿",
  B1: "🇨🇦",
  B2: "🇧🇦",
  B3: "🇶🇦",
  B4: "🇨🇭",
  C1: "🇧🇷",
  C2: "🇲🇦",
  C3: "🇭🇹",
  C4: "🏴",
  D1: "🇺🇸",
  D2: "🇵🇾",
  D3: "🇦🇺",
  D4: "🇹🇷",
  E1: "🇩🇪",
  E2: "🇨🇼",
  E3: "🇨🇮",
  E4: "🇪🇨",
  F1: "🇳🇱",
  F2: "🇯🇵",
  F3: "🇸🇪",
  F4: "🇹🇳",
  G1: "🇧🇪",
  G2: "🇪🇬",
  G3: "🇮🇷",
  G4: "🇳🇿",
  H1: "🇪🇸",
  H2: "🇨🇻",
  H3: "🇸🇦",
  H4: "🇺🇾",
  I1: "🇫🇷",
  I2: "🇸🇳",
  I3: "🇮🇶",
  I4: "🇳🇴",
  J1: "🇦🇷",
  J2: "🇩🇿",
  J3: "🇦🇹",
  J4: "🇯🇴",
  K1: "🇵🇹",
  K2: "🇨🇩",
  K3: "🇺🇿",
  K4: "🇨🇴",
  L1: "🏴",
  L2: "🇭🇷",
  L3: "🇬🇭",
  L4: "🇵🇦",
};

const matches = WORLD_CUP_DATA.groups.flatMap((group) =>
  GROUP_PAIRINGS.map(([homeIndex, awayIndex], index) => {
    const home = teams.find((team) => team.groupId === group.id && team.id.endsWith(String(homeIndex + 1)));
    const away = teams.find((team) => team.groupId === group.id && team.id.endsWith(String(awayIndex + 1)));
    return {
      id: `${group.id}${index + 1}`,
      groupId: group.id,
      homeId: home.id,
      awayId: away.id,
      label: `Gruppe ${group.id}, Spiel ${index + 1}`,
    };
  }),
);

const defaultState = {
  activePlayerId: "",
  players: [],
  predictions: {},
  results: {
    matches: {},
    groupWinners: {},
    stages: {},
  },
  scoring: structuredClone(WORLD_CUP_DATA.scoring),
};

let state = structuredClone(defaultState);
let submission = loadSubmission();

const els = {
  activePlayer: document.querySelector("#active-player"),
  playerForm: document.querySelector("#player-form"),
  playerName: document.querySelector("#player-name"),
  playerList: document.querySelector("#player-list"),
  scoreboardBody: document.querySelector("#scoreboard-body"),
  statsGrid: document.querySelector("#stats-grid"),
  noPlayerNotice: document.querySelector("#no-player-notice"),
  submitPlayerName: document.querySelector("#submit-player-name"),
  submitMatches: document.querySelector("#submit-matches"),
  submitGroups: document.querySelector("#submit-groups"),
  submitStages: document.querySelector("#submit-stages"),
  downloadSubmission: document.querySelector("#download-submission"),
  viewerPlayer: document.querySelector("#viewer-player"),
  viewerEmpty: document.querySelector("#viewer-empty"),
  viewerContent: document.querySelector("#viewer-content"),
  viewerMatches: document.querySelector("#viewer-matches"),
  viewerGroups: document.querySelector("#viewer-groups"),
  viewerStages: document.querySelector("#viewer-stages"),
  predictionMatches: document.querySelector("#prediction-matches"),
  predictionGroups: document.querySelector("#prediction-groups"),
  predictionStages: document.querySelector("#prediction-stages"),
  resultMatches: document.querySelector("#result-matches"),
  resultGroups: document.querySelector("#result-groups"),
  resultStages: document.querySelector("#result-stages"),
  rulesGrid: document.querySelector("#rules-grid"),
  importData: document.querySelector("#import-data"),
  modeLabel: document.querySelector("#mode-label"),
  modeHelp: document.querySelector("#mode-help"),
};

function mergeState(rawState) {
  const parsed = rawState || {};
  return {
    ...structuredClone(defaultState),
    ...parsed,
    results: {
      ...structuredClone(defaultState.results),
      ...(parsed.results || {}),
    },
    scoring: {
      ...structuredClone(defaultState.scoring),
      ...(parsed.scoring || {}),
      stages: {
        ...defaultState.scoring.stages,
        ...(parsed.scoring?.stages || {}),
      },
    },
  };
}

async function loadInitialState() {
  if (IS_ADMIN) {
    return loadLocalState();
  }

  try {
    const response = await fetch(`${PUBLISHED_STATE_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return mergeState(await response.json());
  } catch {
    return loadLocalState();
  }
}

function loadLocalState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(defaultState);

  try {
    return mergeState(JSON.parse(saved));
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  if (!IS_ADMIN) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadSubmission() {
  const saved = localStorage.getItem(SUBMISSION_KEY);
  if (saved) {
    try {
      return {
        id: crypto.randomUUID(),
        name: "",
        matches: {},
        groupWinners: {},
        stages: {},
        ...JSON.parse(saved),
      };
    } catch {
      // Fall through to a new blank submission.
    }
  }

  return {
    id: crypto.randomUUID(),
    name: "",
    matches: {},
    groupWinners: {},
    stages: {},
  };
}

function saveSubmission() {
  localStorage.setItem(SUBMISSION_KEY, JSON.stringify(submission));
}

function ensurePlayerPrediction(playerId) {
  if (!playerId) return null;
  if (!state.predictions[playerId]) {
    state.predictions[playerId] = {
      matches: {},
      groupWinners: {},
      stages: {},
    };
  }
  return state.predictions[playerId];
}

function normalizeScore(value) {
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) return "";
  return Math.min(number, 99);
}

function getOutcome(score) {
  if (!hasScore(score)) return "";
  if (score.home > score.away) return "home";
  if (score.home < score.away) return "away";
  return "draw";
}

function hasScore(score) {
  return Number.isInteger(score?.home) && Number.isInteger(score?.away);
}

function scoreMatch(prediction, result) {
  if (!hasScore(prediction) || !hasScore(result)) return { points: 0, exact: 0, tendency: 0 };
  if (prediction.home === result.home && prediction.away === result.away) {
    return { points: state.scoring.exactScore, exact: 1, tendency: 0 };
  }
  if (getOutcome(prediction) === getOutcome(result)) {
    return { points: state.scoring.tendency, exact: 0, tendency: 1 };
  }
  return { points: 0, exact: 0, tendency: 0 };
}

function calculatePlayerScore(player) {
  const prediction = ensurePlayerPrediction(player.id);
  const breakdown = {
    player,
    total: 0,
    exact: 0,
    tendency: 0,
    groupWinners: 0,
    stages: 0,
  };

  matches.forEach((match) => {
    const matchScore = scoreMatch(prediction.matches[match.id], state.results.matches[match.id]);
    breakdown.total += matchScore.points;
    breakdown.exact += matchScore.exact;
    breakdown.tendency += matchScore.tendency;
  });

  WORLD_CUP_DATA.groups.forEach((group) => {
    if (prediction.groupWinners[group.id] && prediction.groupWinners[group.id] === state.results.groupWinners[group.id]) {
      breakdown.total += state.scoring.groupWinner;
      breakdown.groupWinners += state.scoring.groupWinner;
    }
  });

  WORLD_CUP_DATA.stageMeta.forEach((stage) => {
    const predicted = new Set(prediction.stages[stage.id] || []);
    const actual = new Set(state.results.stages[stage.id] || []);
    predicted.forEach((teamId) => {
      if (actual.has(teamId)) {
        breakdown.total += state.scoring.stages[stage.id];
        breakdown.stages += state.scoring.stages[stage.id];
      }
    });
  });

  return breakdown;
}

function render() {
  if (!state.activePlayerId && state.players.length) {
    state.activePlayerId = state.players[0].id;
  }
  if (state.activePlayerId && !state.players.some((player) => player.id === state.activePlayerId)) {
    state.activePlayerId = state.players[0]?.id || "";
  }

  renderPlayerSelect();
  renderPlayers();
  renderPredictions();
  renderSubmission();
  renderViewer();
  renderResults();
  renderRules();
  renderDashboard();
  renderMode();
  saveState();
}

function activateView(viewName, options = {}) {
  const button = document.querySelector(`[data-view="${viewName}"]`);
  if (!button) return;
  if (button.dataset.adminOnly !== undefined && !IS_ADMIN) return;

  document.querySelectorAll(".nav-button").forEach((navButton) => navButton.classList.toggle("is-active", navButton === button));
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("is-active", view.id === `view-${viewName}`));

  if (options.updateHash !== false) {
    const nextHash = VIEW_HASHES[viewName] || viewName;
    if (window.location.hash.slice(1) !== nextHash) {
      history.pushState(null, "", `#${nextHash}`);
    }
  }
}

function activateViewFromHash() {
  const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  const viewName = VIEW_BY_HASH[hash] || hash || "dashboard";
  activateView(viewName, { updateHash: false });
}

function renderViewer() {
  els.viewerPlayer.innerHTML = "";
  if (!state.players.length) {
    els.viewerEmpty.hidden = false;
    els.viewerContent.hidden = true;
    els.viewerPlayer.disabled = true;
    els.viewerPlayer.append(new Option("Keine Teilnehmer", ""));
    return;
  }

  els.viewerEmpty.hidden = true;
  els.viewerContent.hidden = false;
  els.viewerPlayer.disabled = false;

  const selectedId = els.viewerPlayer.dataset.selected && state.players.some((player) => player.id === els.viewerPlayer.dataset.selected)
    ? els.viewerPlayer.dataset.selected
    : state.players[0].id;

  state.players.forEach((player) => {
    els.viewerPlayer.append(new Option(player.name, player.id, false, player.id === selectedId));
  });
  els.viewerPlayer.dataset.selected = selectedId;

  const prediction = state.predictions[selectedId] || { matches: {}, groupWinners: {}, stages: {} };
  els.viewerMatches.innerHTML = renderViewerMatches(prediction.matches);
  els.viewerGroups.innerHTML = renderViewerGroups(prediction.groupWinners);
  els.viewerStages.innerHTML = renderViewerStages(prediction.stages);
}

function renderViewerMatches(values) {
  return WORLD_CUP_DATA.groups
    .map((group) => {
      const rows = matches
        .filter((match) => match.groupId === group.id)
        .map((match) => {
          const score = values[match.id];
          const result = state.results.matches[match.id];
          const points = scoreMatch(score, result).points;
          return `
            <tr>
              <td>${match.label}</td>
              <td>${teamName(match.homeId)}</td>
              <td class="viewer-score">${formatScore(score)}</td>
              <td>${teamName(match.awayId)}</td>
              <td>${formatScore(result)}</td>
              <td><strong>${points}</strong></td>
            </tr>
          `;
        })
        .join("");

      return `
        <section class="group-block">
          <h3>Gruppe ${group.id}</h3>
          <table class="match-table viewer-table">
            <thead>
              <tr>
                <th>Spiel</th>
                <th>Heim</th>
                <th>Tipp</th>
                <th>Auswärts</th>
                <th>Ergebnis</th>
                <th>Punkte</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </section>
      `;
    })
    .join("");
}

function renderViewerGroups(values) {
  return `
    <div class="group-winner-grid">
      ${WORLD_CUP_DATA.groups
        .map((group) => {
          const tip = values[group.id];
          const result = state.results.groupWinners[group.id];
          const points = tip && tip === result ? state.scoring.groupWinner : 0;
          return `
            <div class="select-card">
              <span>Gruppe ${group.id}</span>
              <strong>${tip ? teamName(tip) : "Kein Tipp"}</strong>
              <small>Ergebnis: ${result ? teamName(result) : "offen"} · ${points} Punkte</small>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderViewerStages(values) {
  return `
    <div class="stage-grid">
      ${WORLD_CUP_DATA.stageMeta
        .map((stage) => {
          const selected = values[stage.id] || [];
          const actual = new Set(state.results.stages[stage.id] || []);
          return `
            <section class="stage-block">
              <div class="stage-head">
                <h3>${stage.label}</h3>
                <span>${selected.length}/${stage.size}</span>
              </div>
              <div class="viewer-chip-list">
                ${
                  selected.length
                    ? selected
                        .map((teamId) => `<span class="viewer-chip ${actual.has(teamId) ? "is-hit" : ""}">${teamName(teamId)}</span>`)
                        .join("")
                    : `<span class="empty-inline">Kein Tipp</span>`
                }
              </div>
            </section>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderSubmission() {
  syncSubmissionDerivedPredictions();
  els.submitPlayerName.value = submission.name || "";
  els.submitMatches.innerHTML = renderMatchInputs("submit", submission.matches);
  els.submitGroups.innerHTML = renderComputedGroupTables(submission.matches);
  els.submitStages.innerHTML = renderSubmissionBracket();
}

function renderMode() {
  document.body.classList.toggle("is-admin", IS_ADMIN);
  document.querySelectorAll("[data-admin-only]").forEach((element) => {
    element.hidden = !IS_ADMIN;
  });
  els.modeLabel.textContent = IS_ADMIN ? "Admin-Modus" : "Lesemodus";
  els.modeHelp.textContent = IS_ADMIN
    ? "Änderungen bleiben lokal, bis du die JSON-Datei exportierst und ins Repository lädst."
    : "Die Seite liest die veröffentlichte JSON-Datei aus dem Repository.";
}

function renderPlayerSelect() {
  els.activePlayer.innerHTML = "";
  if (!state.players.length) {
    els.activePlayer.append(new Option("Keine Teilnehmer", ""));
    els.activePlayer.disabled = true;
    return;
  }
  els.activePlayer.disabled = false;
  state.players.forEach((player) => {
    els.activePlayer.append(new Option(player.name, player.id, false, player.id === state.activePlayerId));
  });
}

function renderPlayers() {
  els.playerList.innerHTML = "";
  if (!state.players.length) {
    els.playerList.innerHTML = `<p class="empty">Noch keine Teilnehmer angelegt.</p>`;
    return;
  }

  state.players.forEach((player) => {
    const row = document.createElement("div");
    row.className = "player-row";
    row.innerHTML = `
      <span>${escapeHtml(player.name)}</span>
      <div class="row-actions">
        <button type="button" data-set-player="${player.id}">Auswählen</button>
        <button type="button" class="danger-button" data-delete-player="${player.id}">Löschen</button>
      </div>
    `;
    els.playerList.append(row);
  });
}

function renderPredictions() {
  const prediction = ensurePlayerPrediction(state.activePlayerId);
  const hasPlayer = Boolean(prediction);
  els.noPlayerNotice.hidden = hasPlayer;
  document.querySelector("#prediction-tabs").hidden = !hasPlayer;
  els.predictionMatches.hidden = !hasPlayer;
  els.predictionGroups.hidden = !hasPlayer;
  els.predictionStages.hidden = !hasPlayer;

  if (!hasPlayer) return;

  els.predictionMatches.innerHTML = renderMatchInputs("prediction", prediction.matches);
  els.predictionGroups.innerHTML = renderGroupWinnerInputs("prediction", prediction.groupWinners);
  els.predictionStages.innerHTML = renderStageInputs("prediction", prediction.stages);
}

function renderResults() {
  els.resultMatches.innerHTML = renderMatchInputs("result", state.results.matches);
  els.resultGroups.innerHTML = renderGroupWinnerInputs("result", state.results.groupWinners);
  els.resultStages.innerHTML = renderStageInputs("result", state.results.stages);
}

function renderMatchInputs(scope, values) {
  return WORLD_CUP_DATA.groups
    .map((group) => {
      const groupMatches = matches.filter((match) => match.groupId === group.id);
      const rows = groupMatches
        .map((match) => {
          const value = values[match.id] || {};
          return `
            <tr>
              <td class="muted">${match.label}</td>
              <td>${teamName(match.homeId)}</td>
              <td class="score-inputs">
                <input type="number" min="0" max="99" inputmode="numeric" value="${value.home ?? ""}" data-${scope}-match="${match.id}" data-side="home" aria-label="${teamName(match.homeId)} Tore" />
                <span>:</span>
                <input type="number" min="0" max="99" inputmode="numeric" value="${value.away ?? ""}" data-${scope}-match="${match.id}" data-side="away" aria-label="${teamName(match.awayId)} Tore" />
              </td>
              <td>${teamName(match.awayId)}</td>
            </tr>
          `;
        })
        .join("");

      return `
        <section class="group-block">
          <h3>Gruppe ${group.id}</h3>
          <table class="match-table">
            <tbody>${rows}</tbody>
          </table>
        </section>
      `;
    })
    .join("");
}

function renderGroupWinnerInputs(scope, values) {
  return `
    <div class="group-winner-grid">
      ${WORLD_CUP_DATA.groups
        .map((group) => {
          const groupTeams = teams.filter((team) => team.groupId === group.id);
          return `
            <label class="select-card">
              <span>Gruppe ${group.id}</span>
              <select data-${scope}-group="${group.id}">
                <option value="">Offen</option>
                ${groupTeams
                  .map((team) => `<option value="${team.id}" ${values[group.id] === team.id ? "selected" : ""}>${escapeHtml(team.name)}</option>`)
                  .join("")}
              </select>
            </label>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderComputedGroupTables(scoreMap) {
  const tables = calculateGroupTables(scoreMap);
  return `
    <div class="auto-note">Die Gruppensieger werden aus deinen Vorrunden-Tipps berechnet. Bei Punktegleichheit zählen Tordifferenz, erzielte Tore und dann die ursprüngliche Gruppenreihenfolge.</div>
    <div class="computed-group-grid">
      ${WORLD_CUP_DATA.groups
        .map((group) => {
          const rows = tables[group.id]
            .map(
              (row, index) => `
                <tr class="${index === 0 ? "is-winner" : ""}">
                  <td>${index + 1}</td>
                  <td>${escapeHtml(teamName(row.teamId))}</td>
                  <td>${row.gf}:${row.ga}</td>
                  <td>${row.gd}</td>
                  <td><strong>${row.points}</strong></td>
                </tr>
              `,
            )
            .join("");

          return `
            <section class="group-block">
              <h3>Gruppe ${group.id}</h3>
              <table class="computed-table">
                <thead>
                  <tr>
                    <th>Pl.</th>
                    <th>Team</th>
                    <th>Tore</th>
                    <th>Diff.</th>
                    <th>Pkt.</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </section>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderSubmissionBracket() {
  const qualifiers = getPredictedQualifiers(submission.matches);
  if (qualifiers.length < 32) {
    return `<div class="notice">Fülle zuerst genug Vorrundenspiele aus, damit die qualifizierten Teams berechnet werden können.</div>`;
  }

  const rounds = [
    { id: "round32", target: "round16", label: "Runde der letzten 32", pairs: buildRound32Pairs(qualifiers) },
    { id: "round16", target: "quarter", label: "Achtelfinale", pairs: pairTeams(submission.stages.round16 || [], 8) },
    { id: "quarter", target: "semi", label: "Viertelfinale", pairs: pairTeams(submission.stages.quarter || [], 4) },
    { id: "semi", target: "final", label: "Halbfinale", pairs: pairTeams(submission.stages.semi || [], 2) },
    { id: "final", target: "champion", label: "Finale", pairs: pairTeams(submission.stages.final || [], 1) },
  ];

  return `
    <div class="auto-note">Klicke in jeder Paarung auf den Sieger. Die nächste Runde wird danach automatisch aufgebaut.</div>
    <div class="bracket">
      ${rounds
        .map(
          (round) => `
            <section class="bracket-round">
              <div class="stage-head">
                <h3>${round.label}</h3>
                <span>${getRoundProgress(round.id, round.target)}/${round.pairs.length}</span>
              </div>
              <div class="bracket-pairs">
                ${round.pairs
                  .map((pair, pairIndex) => renderBracketPair(round.id, round.target, pair, pairIndex))
                  .join("")}
              </div>
            </section>
          `,
        )
        .join("")}
      <section class="bracket-round champion-round">
        <div class="stage-head">
          <h3>Weltmeister</h3>
          <span>${submission.stages.champion?.length || 0}/1</span>
        </div>
        <div class="champion-box">${submission.stages.champion?.[0] ? teamName(submission.stages.champion[0]) : "Noch offen"}</div>
      </section>
    </div>
  `;
}

function renderBracketPair(roundId, targetStage, pair, pairIndex) {
  const selected = targetStage === "champion" ? submission.stages.champion?.[0] : submission.stages[targetStage]?.[pairIndex];
  const [home, away] = pair;
  return `
    <div class="bracket-pair">
      ${renderBracketTeam(roundId, pairIndex, home, selected)}
      ${renderBracketTeam(roundId, pairIndex, away, selected)}
    </div>
  `;
}

function renderBracketTeam(roundId, pairIndex, teamId, selected) {
  if (!teamId) {
    return `<button class="bracket-team is-placeholder" type="button" disabled>Offen</button>`;
  }

  return `
    <button class="bracket-team ${selected === teamId ? "is-selected" : ""}" type="button" data-bracket-winner="${teamId}" data-source-stage="${roundId}" data-pair-index="${pairIndex}">
      ${escapeHtml(teamName(teamId))}
    </button>
  `;
}

function getRoundProgress(roundId, targetStage) {
  if (roundId === "round32") return (submission.stages.round16 || []).filter(Boolean).length;
  if (targetStage === "champion") return (submission.stages.champion || []).filter(Boolean).length;
  return (submission.stages[targetStage] || []).filter(Boolean).length;
}

function renderStageInputs(scope, values) {
  return `
    <div class="stage-grid">
      ${WORLD_CUP_DATA.stageMeta
        .map((stage) => {
          const selected = new Set(values[stage.id] || []);
          const selectedCount = selected.size;
          return `
            <section class="stage-block">
              <div class="stage-head">
                <h3>${stage.label}</h3>
                <span>${selectedCount}/${stage.size}</span>
              </div>
              <div class="team-picker" data-${scope}-stage="${stage.id}">
                ${teams
                  .map(
                    (team) => `
                      <label class="team-chip ${selected.has(team.id) ? "is-selected" : ""}">
                        <input type="checkbox" value="${team.id}" ${selected.has(team.id) ? "checked" : ""} />
                        <span>${escapeHtml(team.name)}</span>
                      </label>
                    `,
                  )
                  .join("")}
              </div>
            </section>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderRules() {
  const matchRules = [
    { key: "tendency", label: "Richtige Tendenz", value: state.scoring.tendency },
    { key: "exactScore", label: "Exaktes Ergebnis", value: state.scoring.exactScore },
    { key: "groupWinner", label: "Richtiger Gruppensieger", value: state.scoring.groupWinner },
  ];

  const stageRules = WORLD_CUP_DATA.stageMeta.map((stage) => ({
    key: stage.id,
    label: `${stage.label} pro Team`,
    value: state.scoring.stages[stage.id],
    stage: true,
  }));

  els.rulesGrid.innerHTML = [...matchRules, ...stageRules]
    .map(
      (rule) => `
        <label class="rule-card">
          <span>${rule.label}</span>
          <input type="number" min="0" max="99" value="${rule.value}" data-score-key="${rule.key}" ${rule.stage ? "data-stage-score=\"true\"" : ""} ${IS_ADMIN ? "" : "disabled"} />
        </label>
      `,
    )
    .join("");
}

function renderDashboard() {
  const standings = state.players.map(calculatePlayerScore).sort((a, b) => b.total - a.total || a.player.name.localeCompare(b.player.name));
  els.scoreboardBody.innerHTML = standings.length
    ? standings
        .map(
          (row, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(row.player.name)}</td>
              <td><strong>${row.total}</strong></td>
              <td>${row.exact}</td>
              <td>${row.tendency}</td>
              <td>${row.groupWinners}</td>
              <td>${row.stages}</td>
            </tr>
          `,
        )
        .join("")
    : `<tr><td colspan="7" class="empty">Noch keine Teilnehmer.</td></tr>`;

  const completedMatches = matches.filter((match) => hasScore(state.results.matches[match.id])).length;
  const completedGroups = Object.values(state.results.groupWinners).filter(Boolean).length;
  const completedStages = WORLD_CUP_DATA.stageMeta.reduce((sum, stage) => sum + (state.results.stages[stage.id]?.length || 0), 0);

  els.statsGrid.innerHTML = [
    ["Teilnehmer", state.players.length],
    ["Vorrundenspiele", `${completedMatches}/${matches.length}`],
    ["Gruppensieger", `${completedGroups}/${WORLD_CUP_DATA.groups.length}`],
    ["K.-o.-Einträge", completedStages],
  ]
    .map(([label, value]) => `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
}

function teamName(teamId) {
  const team = teamById[teamId];
  if (!team) return "Unbekannt";
  return `${flagByTeamId[teamId] || "🏳️"} ${team.name}`;
}

function calculateGroupTables(scoreMap) {
  const tables = {};

  WORLD_CUP_DATA.groups.forEach((group) => {
    const rows = teams
      .filter((team) => team.groupId === group.id)
      .map((team, index) => ({
        teamId: team.id,
        originalIndex: index,
        played: 0,
        points: 0,
        gf: 0,
        ga: 0,
        gd: 0,
      }));
    const rowByTeam = Object.fromEntries(rows.map((row) => [row.teamId, row]));

    matches
      .filter((match) => match.groupId === group.id)
      .forEach((match) => {
        const score = scoreMap[match.id];
        if (!hasScore(score)) return;

        const home = rowByTeam[match.homeId];
        const away = rowByTeam[match.awayId];
        home.played += 1;
        away.played += 1;
        home.gf += score.home;
        home.ga += score.away;
        away.gf += score.away;
        away.ga += score.home;

        if (score.home > score.away) {
          home.points += 3;
        } else if (score.home < score.away) {
          away.points += 3;
        } else {
          home.points += 1;
          away.points += 1;
        }
      });

    rows.forEach((row) => {
      row.gd = row.gf - row.ga;
    });

    tables[group.id] = rows.sort(
      (a, b) =>
        b.points - a.points ||
        b.gd - a.gd ||
        b.gf - a.gf ||
        a.originalIndex - b.originalIndex,
    );
  });

  return tables;
}

function getAutoGroupWinners(scoreMap) {
  const tables = calculateGroupTables(scoreMap);
  return Object.fromEntries(WORLD_CUP_DATA.groups.map((group) => [group.id, tables[group.id][0]?.teamId || ""]));
}

function getPredictedQualifiers(scoreMap) {
  const tables = calculateGroupTables(scoreMap);
  const direct = [];
  const thirds = [];

  WORLD_CUP_DATA.groups.forEach((group) => {
    const table = tables[group.id];
    table.slice(0, 2).forEach((row, index) => {
      direct.push({ ...row, groupId: group.id, groupRank: index + 1 });
    });
    if (table[2]) thirds.push({ ...table[2], groupId: group.id, groupRank: 3 });
  });

  const bestThirds = thirds
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.gd - a.gd ||
        b.gf - a.gf ||
        a.groupId.localeCompare(b.groupId),
    )
    .slice(0, 8);

  return [...direct, ...bestThirds].sort(
    (a, b) =>
      a.groupRank - b.groupRank ||
      b.points - a.points ||
      b.gd - a.gd ||
      b.gf - a.gf ||
      a.groupId.localeCompare(b.groupId),
  );
}

function buildRound32Pairs(qualifiers) {
  const seeded = qualifiers.map((qualifier) => qualifier.teamId);
  const pairs = [];
  for (let index = 0; index < 16; index += 1) {
    pairs.push([seeded[index], seeded[31 - index]]);
  }
  return pairs;
}

function pairTeams(teamIds, pairCount) {
  return Array.from({ length: pairCount }, (_, index) => [teamIds[index * 2] || "", teamIds[index * 2 + 1] || ""]);
}

function syncSubmissionDerivedPredictions() {
  submission.groupWinners = getAutoGroupWinners(submission.matches);
  const round32 = getPredictedQualifiers(submission.matches).map((qualifier) => qualifier.teamId);
  const previousRound32 = (submission.stages.round32 || []).join("|");
  const nextRound32 = round32.join("|");
  submission.stages.round32 = round32;
  if (previousRound32 && previousRound32 !== nextRound32) {
    ["round16", "quarter", "semi", "final", "champion"].forEach((stageId) => {
      submission.stages[stageId] = [];
    });
  }
}

function setBracketWinner(sourceStage, pairIndex, winnerId) {
  const targetBySource = {
    round32: "round16",
    round16: "quarter",
    quarter: "semi",
    semi: "final",
    final: "champion",
  };
  const targetStage = targetBySource[sourceStage];
  if (!targetStage) return;

  if (targetStage === "champion") {
    submission.stages.champion = [winnerId];
  } else {
    const targetSize = WORLD_CUP_DATA.stageMeta.find((stage) => stage.id === targetStage)?.size || 0;
    const next = Array.from({ length: targetSize }, (_, index) => submission.stages[targetStage]?.[index] || "");
    next[pairIndex] = winnerId;
    submission.stages[targetStage] = next;
  }

  const clearableStages = ["round16", "quarter", "semi", "final", "champion"];
  const targetIndex = clearableStages.indexOf(targetStage);
  clearableStages.slice(targetIndex + 1).forEach((stageId) => {
    submission.stages[stageId] = [];
  });
}

function setNestedScore(container, matchId, side, rawValue) {
  const value = normalizeScore(rawValue);
  if (!container[matchId]) container[matchId] = {};
  if (value === "") {
    delete container[matchId][side];
  } else {
    container[matchId][side] = value;
  }
  if (!hasScore(container[matchId]) && container[matchId].home === undefined && container[matchId].away === undefined) {
    delete container[matchId];
  }
}

function handleStageToggle(container, stageId, teamId, checked) {
  const stage = WORLD_CUP_DATA.stageMeta.find((item) => item.id === stageId);
  const current = new Set(container[stageId] || []);
  if (checked && current.size >= stage.size && !current.has(teamId)) return false;
  if (checked) current.add(teamId);
  else current.delete(teamId);
  container[stageId] = [...current];
  return true;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return entities[char];
  });
}

document.addEventListener("click", (event) => {
  const exportState = event.target.closest("[data-export-state]");
  if (exportState) {
    if (!IS_ADMIN) return;
    downloadState();
    return;
  }

  const navButton = event.target.closest("[data-view]");
  if (navButton) {
    if (navButton.dataset.adminOnly !== undefined && !IS_ADMIN) return;
    activateView(navButton.dataset.view);
  }

  const predictionTab = event.target.closest("[data-prediction-tab]");
  if (predictionTab) switchTab("prediction", predictionTab.dataset.predictionTab);

  const resultTab = event.target.closest("[data-result-tab]");
  if (resultTab) switchTab("result", resultTab.dataset.resultTab);

  const submitTab = event.target.closest("[data-submit-tab]");
  if (submitTab) switchTab("submit", submitTab.dataset.submitTab);

  const viewerTab = event.target.closest("[data-viewer-tab]");
  if (viewerTab) switchTab("viewer", viewerTab.dataset.viewerTab);

  const bracketWinner = event.target.closest("[data-bracket-winner]");
  if (bracketWinner) {
    setBracketWinner(bracketWinner.dataset.sourceStage, Number(bracketWinner.dataset.pairIndex), bracketWinner.dataset.bracketWinner);
    renderSubmission();
    saveSubmission();
    return;
  }

  const setPlayer = event.target.closest("[data-set-player]");
  if (setPlayer) {
    if (!IS_ADMIN) return;
    state.activePlayerId = setPlayer.dataset.setPlayer;
    render();
  }

  const deletePlayer = event.target.closest("[data-delete-player]");
  if (deletePlayer) {
    if (!IS_ADMIN) return;
    state.players = state.players.filter((player) => player.id !== deletePlayer.dataset.deletePlayer);
    delete state.predictions[deletePlayer.dataset.deletePlayer];
    if (state.activePlayerId === deletePlayer.dataset.deletePlayer) state.activePlayerId = state.players[0]?.id || "";
    render();
  }
});

document.addEventListener("input", (event) => {
  const submitMatch = event.target.closest("[data-submit-match]");
  if (submitMatch) {
    setNestedScore(submission.matches, submitMatch.dataset.submitMatch, submitMatch.dataset.side, submitMatch.value);
    syncSubmissionDerivedPredictions();
    els.submitGroups.innerHTML = renderComputedGroupTables(submission.matches);
    els.submitStages.innerHTML = renderSubmissionBracket();
    saveSubmission();
    return;
  }

  if (event.target === els.submitPlayerName) {
    submission.name = els.submitPlayerName.value.trim();
    saveSubmission();
    return;
  }

  if (!IS_ADMIN) return;

  const predictionMatch = event.target.closest("[data-prediction-match]");
  if (predictionMatch) {
    const prediction = ensurePlayerPrediction(state.activePlayerId);
    setNestedScore(prediction.matches, predictionMatch.dataset.predictionMatch, predictionMatch.dataset.side, predictionMatch.value);
    renderDashboard();
    saveState();
  }

  const resultMatch = event.target.closest("[data-result-match]");
  if (resultMatch) {
    setNestedScore(state.results.matches, resultMatch.dataset.resultMatch, resultMatch.dataset.side, resultMatch.value);
    renderDashboard();
    saveState();
  }

  const scoreInput = event.target.closest("[data-score-key]");
  if (scoreInput) {
    const value = Math.max(0, Number(scoreInput.value) || 0);
    if (scoreInput.dataset.stageScore) state.scoring.stages[scoreInput.dataset.scoreKey] = value;
    else state.scoring[scoreInput.dataset.scoreKey] = value;
    renderDashboard();
    saveState();
  }
});

document.addEventListener("change", (event) => {
  const submitGroup = event.target.closest("[data-submit-group]");
  if (submitGroup) {
    submission.groupWinners[submitGroup.dataset.submitGroup] = submitGroup.value;
    saveSubmission();
    return;
  }

  const submitStage = event.target.closest("[data-submit-stage] input");
  if (submitStage) {
    const picker = submitStage.closest("[data-submit-stage]");
    const changed = handleStageToggle(submission.stages, picker.dataset.submitStage, submitStage.value, submitStage.checked);
    if (!changed) submitStage.checked = false;
    renderSubmission();
    saveSubmission();
    return;
  }

  if (!IS_ADMIN && !event.target.matches("#active-player")) return;

  const predictionGroup = event.target.closest("[data-prediction-group]");
  if (predictionGroup) {
    const prediction = ensurePlayerPrediction(state.activePlayerId);
    prediction.groupWinners[predictionGroup.dataset.predictionGroup] = predictionGroup.value;
    renderDashboard();
    saveState();
  }

  const resultGroup = event.target.closest("[data-result-group]");
  if (resultGroup) {
    state.results.groupWinners[resultGroup.dataset.resultGroup] = resultGroup.value;
    renderDashboard();
    saveState();
  }

  const predictionStage = event.target.closest("[data-prediction-stage] input");
  if (predictionStage) {
    const prediction = ensurePlayerPrediction(state.activePlayerId);
    const picker = predictionStage.closest("[data-prediction-stage]");
    const changed = handleStageToggle(prediction.stages, picker.dataset.predictionStage, predictionStage.value, predictionStage.checked);
    if (!changed) predictionStage.checked = false;
    renderPredictions();
    renderDashboard();
  }

  const resultStage = event.target.closest("[data-result-stage] input");
  if (resultStage) {
    const picker = resultStage.closest("[data-result-stage]");
    const changed = handleStageToggle(state.results.stages, picker.dataset.resultStage, resultStage.value, resultStage.checked);
    if (!changed) resultStage.checked = false;
    renderResults();
    renderDashboard();
  }
  saveState();
});

els.activePlayer.addEventListener("change", () => {
  if (!IS_ADMIN) return;
  state.activePlayerId = els.activePlayer.value;
  render();
});

els.viewerPlayer.addEventListener("change", () => {
  els.viewerPlayer.dataset.selected = els.viewerPlayer.value;
  renderViewer();
});

els.playerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!IS_ADMIN) return;
  const name = els.playerName.value.trim();
  if (!name) return;
  const player = { id: crypto.randomUUID(), name };
  state.players.push(player);
  state.activePlayerId = player.id;
  ensurePlayerPrediction(player.id);
  els.playerName.value = "";
  render();
});

document.querySelector("#reset-results").addEventListener("click", () => {
  if (!IS_ADMIN) return;
  state.results = structuredClone(defaultState.results);
  render();
});

document.querySelector("#copy-from-results").addEventListener("click", () => {
  if (!IS_ADMIN) return;
  const prediction = ensurePlayerPrediction(state.activePlayerId);
  if (!prediction) return;
  prediction.matches = structuredClone(state.results.matches);
  prediction.groupWinners = structuredClone(state.results.groupWinners);
  prediction.stages = structuredClone(state.results.stages);
  render();
});

function downloadState() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "tippspiel-state.json";
  link.click();
  URL.revokeObjectURL(url);
}

els.importData.addEventListener("change", async () => {
  if (!IS_ADMIN || !els.importData.files.length) return;
  try {
    const imported = JSON.parse(await els.importData.files[0].text());
    if (imported.type === SUBMISSION_FILE_TYPE) {
      importSubmission(imported);
    } else {
      state = mergeState(imported);
    }
    render();
  } catch {
    window.alert("Die JSON-Datei konnte nicht gelesen werden.");
  } finally {
    els.importData.value = "";
  }
});

els.downloadSubmission.addEventListener("click", () => {
  const name = els.submitPlayerName.value.trim();
  if (!name) {
    window.alert("Bitte gib zuerst deinen Namen ein.");
    return;
  }

  submission.name = name;
  syncSubmissionDerivedPredictions();
  saveSubmission();

  const payload = {
    type: SUBMISSION_FILE_TYPE,
    exportedAt: new Date().toISOString(),
    player: {
      id: submission.id,
      name: submission.name,
    },
    prediction: {
      matches: submission.matches,
      groupWinners: submission.groupWinners,
      stages: sanitizeStages(submission.stages),
    },
  };

  downloadJson(payload, `wm-2026-tipp-${slugify(name)}.json`);
});

function importSubmission(file) {
  const player = file.player;
  const prediction = file.prediction;
  if (!player?.id || !player?.name || !prediction) {
    throw new Error("Invalid submission file");
  }

  const existingById = state.players.find((item) => item.id === player.id);
  const playerId = existingById?.id || player.id;
  if (existingById) {
    existingById.name = player.name;
  } else {
    state.players.push({ id: playerId, name: uniquePlayerName(player.name) });
  }
  state.predictions[playerId] = {
    matches: prediction.matches || {},
    groupWinners: prediction.groupWinners || {},
    stages: prediction.stages || {},
  };
  state.activePlayerId = playerId;
}

function uniquePlayerName(name) {
  if (!state.players.some((player) => player.name === name)) return name;
  let counter = 2;
  while (state.players.some((player) => player.name === `${name} (${counter})`)) {
    counter += 1;
  }
  return `${name} (${counter})`;
}

function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function sanitizeStages(stages) {
  return Object.fromEntries(WORLD_CUP_DATA.stageMeta.map((stage) => [stage.id, (stages[stage.id] || []).filter(Boolean)]));
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "teilnehmer";
}

function switchTab(scope, tabName) {
  document.querySelectorAll(`#${scope}-tabs .tab`).forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset[`${scope}Tab`] === tabName);
  });
  ["matches", "groups", "stages"].forEach((name) => {
    document.querySelector(`#${scope}-${name}`).classList.toggle("is-active", name === tabName);
  });
}

function formatScore(score) {
  return hasScore(score) ? `${score.home}:${score.away}` : "-";
}

loadInitialState().then((loadedState) => {
  state = loadedState;
  render();
  activateViewFromHash();
});

window.addEventListener("hashchange", activateViewFromHash);
