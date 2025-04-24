const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/cineRate-watchlist-db');

const WatchlistSchema = new mongoose.Schema({
  userId: String,
  contentId: String,
  mediaType: String,
}, { timestamps: true });

const Watchlist = mongoose.model('Watchlist', WatchlistSchema);

app.get('/test', (req, res) => {
  res.send('Watchlist service is running');
});

app.get('/:userId', async (req, res) => {
  const userId = req.params.userId;
  const watchlist = await Watchlist.find({ userId });
  res.json(watchlist);
});
app.post('/add', async (req, res) => {
  const { userId, contentId } = req.body;
  const alreadyInWatchlist = await Watchlist.findOne({ userId, contentId });
  if (alreadyInWatchlist) {
    return res.status(200).json({ message: 'Content is already in the watchlist' });
  }
  const watchlist = new Watchlist({ ...req.body });
  await watchlist.save();
  res.status(201).json({ message: 'Content added to watchlist' });
});

app.post('/remove', async (req, res) => {
  const { userId, contentId } = req.body;
  await Watchlist.findOneAndDelete({ userId, contentId });
  res.status(201).json({ message: 'Content removed from watchlist' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3003;
  app.listen(PORT, () => {
    console.log(`Watchlist service running on port ${PORT}`);
  });
}

module.exports = app;