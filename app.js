const express = require('express');
const bodyParser = require('body-parser');
const readline = require('readline');

const app = express();
const port = 3000;

app.use(express.static('public')); // Serve static files from the 'public' directory
app.use(bodyParser.json());

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let buckets = {};
let ballVolumes = {};
let ballCounts = {};

app.get('/suggestions', async (req, res) => {
  let suggestions = await suggestBuckets();
  res.json(suggestions);
});

app.post('/initialize', (req, res) => {
  const { buckets: newBuckets, ballVolumes: newBallVolumes, ballCounts: newBallCounts } = req.body;

  buckets = Object.fromEntries(Object.entries(newBuckets).map(([key, value]) => [key, parseFloat(value)]));
  ballVolumes = Object.fromEntries(Object.entries(newBallVolumes).map(([key, value]) => [key, parseFloat(value)]));
  ballCounts = Object.fromEntries(Object.entries(newBallCounts).map(([key, value]) => [key, parseInt(value)]));

  res.send('Initialization complete.');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

async function suggestBuckets() {
  return new Promise((resolve) => {
    let suggestions = {};

    for (let bucket in buckets) {
      let emptyVolume = buckets[bucket];
      let filledVolume = 0;

      let tempBallCounts = { ...ballCounts }; // create a temporary copy of ballCounts to not modify the original counts

      for (let color in ballVolumes) {
        let ballsToPlace = Math.min(tempBallCounts[color], Math.floor(emptyVolume / ballVolumes[color]));
        filledVolume += ballsToPlace * ballVolumes[color];
        tempBallCounts[color] -= ballsToPlace;
        emptyVolume -= ballsToPlace * ballVolumes[color];
      }

      if (emptyVolume >= 0 && filledVolume <= buckets[bucket]) {
        suggestions[bucket] = `Place ${ballCounts.PINK - tempBallCounts.PINK} PINK balls, ${ballCounts.RED - tempBallCounts.RED} RED balls, ${ballCounts.BLUE - tempBallCounts.BLUE} BLUE balls, ${ballCounts.ORANGE - tempBallCounts.ORANGE} ORANGE balls, and ${ballCounts.GREEN - tempBallCounts.GREEN} GREEN balls.`;
      }
    }

    resolve(suggestions);
  });
}
