const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to the CI Status Dashboard API!');
});

// Endpoint to fetch pipeline statuses
app.get('/api/statuses', (req, res) => {
  // Placeholder for pipeline status logic
  res.json({ message: 'Fetching pipeline statuses...' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
