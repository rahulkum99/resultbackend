require('dotenv').config();

const http = require('http');

const connectDB = require('./config/db');
const app = require('./app');
const { enrichUnsettledWithSections: enrichCricket } = require('./services/cricketUnsettled.service');
const { enrichUnsettledWithSections: enrichSoccer } = require('./services/soccerUnsettled.service');
const { enrichUnsettledWithSections: enrichTennis } = require('./services/tennisUnsettled.service');

const PORT = process.env.PORT || 5000;

connectDB();

const server = http.createServer(app);

let isUnsettledJobRunning = false;

const runUnsettledJob = async () => {
  if (isUnsettledJobRunning) {
    return;
  }

  isUnsettledJobRunning = true;
  try {
    await enrichCricket();
    await enrichSoccer();
    await enrichTennis();
  } catch (error) {
    console.error('Error running unsettled enrichment job:', error.message);
  } finally {
    isUnsettledJobRunning = false;
  }
};

// Run once on startup
runUnsettledJob();
// Then every 10 minutes
setInterval(runUnsettledJob, 10 * 60 * 1000);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});