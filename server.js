const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const crypto = require('crypto');
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Constants for encryption
const ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex'); // 256-bit key
const IV_LENGTH = 16;

// Helper function to encrypt data
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

// Helper function to decrypt data
function decrypt(text) {
  const [iv, encryptedText] = text.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Paths for storing user and blog data
const USERS_FILE = 'users.txt';
const BLOGS_FILE = 'blogs.txt';

// Utility function to load data from disk
function loadData(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const fileContent = fs.readFileSync(filePath, 'utf8');
  if (!fileContent.trim()) {
    return [];
  }
  return JSON.parse(decrypt(fileContent));
}

// Utility function to save data to disk
function saveData(filePath, data) {
  const encryptedData = encrypt(JSON.stringify(data));
  fs.writeFileSync(filePath, encryptedData);
}

// Load initial data
let users = loadData(USERS_FILE);
let blogs = loadData(BLOGS_FILE);

// Sign Up Endpoint
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  if (users.some(user => user.username === username)) {
    return res.status(400).json({ message: 'User already exists!' });
  }
  users.push({ username, password });
  saveData(USERS_FILE, users);
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
  fs.writeFileSync(`blogs/${blogFileName}`, content);
  
  // Update in-memory data and persist to disk
  blogs.push({ username, blogName, content });
  saveData(BLOGS_FILE, blogs);
  
  res.status(200).json({ message: 'Blog published successfully!' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
