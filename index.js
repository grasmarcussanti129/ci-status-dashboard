const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to enable CORS (Cross-Origin Resource Sharing)
app.use(cors());
// Middleware to parse incoming JSON requests
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

// Handle JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON Parsing Error:', err);
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next();
});

// Handle 404 errors for any unspecified routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start the server and listen on the specified PORT
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});