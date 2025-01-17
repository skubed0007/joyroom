const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

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

// Utility function to load data from disk
function loadData(filePath) {
  const fileContent = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
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

const USERS_FILE = path.join(__dirname, 'users.txt');
const BLOGS_FILE = path.join(__dirname, 'blogs.txt');

// Sign Up Endpoint
module.exports.signup = (req, res) => {
  const { username, password } = req.body;
  let users = loadData(USERS_FILE);

  if (users.some(user => user.username === username)) {
    return res.status(400).json({ message: 'User already exists!' });
  }

  users.push({ username, password });
  saveData(USERS_FILE, users);

  res.status(201).json({ message: 'User created successfully!' });
};

// Sign In Endpoint
module.exports.signin = (req, res) => {
  const { username, password } = req.body;
  let users = loadData(USERS_FILE);

  const user = users.find(user => user.username === username);
  if (!user || user.password !== password) {
    return res.status(400).json({ message: 'Invalid credentials!' });
  }

  res.status(200).json({ message: 'Logged in successfully!' });
};

// Get all blogs by username
module.exports.blogs = (req, res) => {
  const { username } = req.query;
  let blogs = loadData(BLOGS_FILE);

  const userBlogs = blogs.filter(blog => blog.username === username);
  res.status(200).json(userBlogs);
};

// Save a new blog to file
module.exports.publish = (req, res) => {
  const { username, blogName, content } = req.body;

  let blogs = loadData(BLOGS_FILE);
  const blogFileName = `${username}.${blogName}.md`;

  // Save the blog as .md file
  fs.writeFileSync(path.join(__dirname, 'blogs', blogFileName), content);

  blogs.push({ username, blogName, content });
  saveData(BLOGS_FILE, blogs);

  res.status(200).json({ message: 'Blog published successfully!' });
};
