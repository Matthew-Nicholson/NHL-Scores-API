const axios = require('axios');

async function pollNhlApi() {
  const url =
    'https://statsapi.web.nhl.com/api/v1/schedule?expand=schedule.linescore';
  try {
    const { data } = await axios.get(url);
    return data;
  } catch (error) {
    console.error(error);
  }
}

function gamesStartingSoon(apiData) {
  // Returns true if any game is starting within 60 minutes.
  const msToMin = (ms) => ms / 60000;
  const games = apiData.dates[0].games;
  const now = new Date();
  for (let i = 0; i < games.length; i++) {
    const gameTime = new Date(games[i].gameDate);
    if (msToMin(gameTime - now) <= 60) return true;
  }
  return false;
}

function gamesActiveNow(apiData) {
  // Status codes: https://statsapi.web.nhl.com/api/v1/gameStatus
  const games = apiData.dates[0].games;
  for (let i = 0; i < games.length; i++) {
    const code = +games[i].status.statusCode;
    if (code === 3 || code === 4) return true;
  }
  return false;
}

function gamesToday(apiData) {
  return apiData.totalGames > 0;
}

function scores(apiData) {
  // Returns array of objects.
  const games = apiData.dates[0].games;
  if (!games.length) return;
  const gameScores = [];
  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    const status = +game.status?.statusCode || null;
    gameScores.push({
      homeTeam: game.teams?.home?.team?.name,
      awayTeam: game.teams?.away?.team?.name,
      homeScore: game.teams?.home?.score,
      awayScore: game.teams?.away?.score,
      period: game.linescore?.currentPeriod,
      periodOrdinal: game.linescore?.currentPeriodOrdinal,
      timeRemaining: game.linescore?.currentPeriodTimeRemaining || null,
      startTime: new Date(game.gameDate), // Use international standard and then detect system time on front end.
      started: status === 3 || status === 4,
      finished: status === 7,
    });
  }
  return gameScores;
}
module.exports = {
  pollNhlApi,
  gamesStartingSoon,
  gamesActiveNow,
  gamesToday,
  scores,
};
