const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Serves static files within the 'public' directory;
app.use(express.static(path.join(__dirname, 'public')));

// Root route to serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for text chat page
app.get('/video', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'text.html'));
});

// Starting the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
