'use strict';
// Global Constants
const PORT = process.env.PORT || 3000;
const STATE = {
  latestEmit: null,
  latestArgs: null,
  minuteLoopIsRunning: false,
  hourLoopIsRunning: false,
};

// Imports
const http = require('http').createServer();
const io = require('socket.io')(http, {
  cors: {
    origins: ['http://localhost:8080'],
  },
});
const { everyHour, everyMinute } = require('./scripts/cron.services');
const nhl = require('./scripts/scores.services');

// App
io.on('connection', (socket) => {
  console.log('New connection:', socket.id);
  io.to(socket.id).emit(STATE.latestEmit, STATE.latestArgs);
});

// Loops
const startMinuteLoop = () => {
  if (STATE.minuteLoopIsRunning) return;
  STATE.minuteLoopIsRunning = true;
  return minuteLoop.start();
};
const stopMinuteLoop = () => {
  if (!STATE.minuteLoopIsRunning) return;
  STATE.minuteLoopIsRunning = false;
  return minuteLoop.stop();
};
const startHourLoop = () => {
  if (STATE.hourLoopIsRunning) return;
  STATE.hourLoopIsRunning = true;
  return hourLoop.start();
};
const stopHourLoop = () => {
  if (!STATE.hourLoopIsRunning) return;
  STATE.hourLoopIsRunning = false;
  return returnhourLoop.stop();
};

const hourLoop = everyHour(async () => {
  // ApiData errors already handled in scores.services.js
  stopMinuteLoop();
  const apiData = await nhl.pollNhlApi();
  if (!nhl.gamesToday(apiData)) {
    STATE.latestEmit = 'no games';
    STATE.latestArgs = null;
    return io.sockets.emit('no games');
  }
  if (!nhl.gamesActiveNow(apiData) && !nhl.gamesStartingSoon(apiData)) {
    STATE.latestEmit = 'scores';
    STATE.latestArgs = nhl.scores(apiData);
    return io.sockets.emit('scores', nhl.scores(apiData));
  } else {
    return startMinuteLoop();
  }
});
const minuteLoop = everyMinute(async () => {
  stopHourLoop();
  const apiData = await nhl.pollNhlApi();
  if (!nhl.gamesActiveNow(apiData) && !nhl.gamesStartingSoon(apiData)) {
    startHourLoop();
  }
  STATE.latestEmit = 'scores';
  STATE.latestArgs = nhl.scores(apiData);
  return io.sockets.emit('scores', nhl.scores(apiData));
});

// Init
http.listen(PORT, () => {
  startHourLoop();
  console.log('Server is listening on port:', PORT);
});
