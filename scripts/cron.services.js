const { CronJob } = require('cron');

// Runs on the 25th minute because no game ever starts at exactly that time.
const everyHour = (cb) => {
  // Runs on server startup.
  return new CronJob('25 * * * *', cb, null, false, null, null, true);
};

const everyMinute = (cb) => {
  // Does not run on server startup.
  return new CronJob('* * * * *', cb, null, false, null, null, false);
};

module.exports = { everyHour, everyMinute };
