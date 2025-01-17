const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();

// Middleware
app.use(cors());
app.use(cors({
    origin: 'http://localhost:8000', // Replace with the frontend's address (if running locally, it's likely port 5500)
    methods: ['GET', 'POST'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type'], // Allowed request headers
  }));
  
app.use(bodyParser.json()); // To parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // To parse URL-encoded bodies

// Mock user database
const users = []; // Store users as { username, password }

// Mock blog database (in-memory for simplicity)
const blogs = []; // Array of { username, blogName, content }

// Sign Up Endpoint
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  // Check if user already exists
  if (users.some(user => user.username === username)) {
    return res.status(400).json({ message: 'User already exists!' });
  }
  // Add new user
  users.push({ username, password });
  res.status(201).json({ message: 'User created successfully!' });
});

// Sign In Endpoint
app.post('/signin', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(user => user.username === username);
  if (!user || user.password !== password) {
    return res.status(400).json({ message: 'Invalid credentials!' });
  }
  res.status(200).json({ message: 'Logged in successfully!' });
});

// Get all blogs by username
app.get('/blogs/:username', (req, res) => {
  const { username } = req.params;
  const userBlogs = blogs.filter(blog => blog.username === username);
  res.status(200).json(userBlogs);
});

// Save a new blog to file
app.post('/publish', (req, res) => {
  const { username, blogName, content } = req.body;
  const blogFileName = `${username}.${blogName}.md`;
  
  // Save the blog as .md file
  fs.writeFile(`blogs/${blogFileName}`, content, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error saving the blog!' });
    }
    // Save blog to in-memory store for API purposes
    blogs.push({ username, blogName, content });
    res.status(200).json({ message: 'Blog published successfully!' });
  });
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
