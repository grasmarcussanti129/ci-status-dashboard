const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to enable CORS and parse JSON requests
app.use(cors());
app.use(express.json());

// Root endpoint that returns a welcome message
app.get('/', (req, res) => {
  res.send('Welcome to the CI Status Dashboard API!');
});

// Endpoint to fetch pipeline statuses
app.get('/api/statuses', (req, res) => {
  try {
    // Placeholder for pipeline status logic
    res.json({ message: 'Fetching pipeline statuses...' });
  } catch (error) {
    // Handle potential errors
    console.error('Error fetching pipeline statuses:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server and listen on the specified PORT
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});