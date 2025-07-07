require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const pool = require('./db');
const { exec } = require('child_process');
const path = require('path');
const app = express();
const pythonScriptPath = path.join(__dirname, 'drsism.py');
const fs = require('fs');

// Middleware
const corsOptions = {
    origin: 'http://localhost:3000', // Update with your frontend URL
    methods: ['GET', 'POST']
  };
  
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File Upload Configuration
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Authentication Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const address = authHeader && authHeader.split(' ')[1];
  
  if (!address) return res.status(401).json({ error: 'Unauthorized' });

  req.userAddress = address;
  next();
};

// Routes
app.post('/api/auth', async (req, res) => {
    const { address } = req.body;
  
    try {
      // Use promise-based query
      const [rows] = await pool.query('SELECT * FROM users WHERE address = ?', [address]);
      
      res.json({ 
        exists: rows.length > 0, 
        user: rows[0] || null 
      });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

app.post('/api/register', async (req, res) => {
  const { address, nickname } = req.body;
  try {
    const [existingNick] = await pool.query('SELECT * FROM users WHERE nickname = ?', [nickname]);
    if (existingNick.length > 0) return res.status(400).json({ error: 'Nickname already exists' });

    const [existingAddr] = await pool.query('SELECT * FROM users WHERE address = ?', [address]);
    if (existingAddr.length > 0) return res.status(400).json({ error: 'Address already registered' });

    const [result] = await pool.query(
      'INSERT INTO users (address, nickname) VALUES (?, ?)',
      [address, nickname]
    );
    res.json({ id: result.insertId, address, nickname });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', authenticate, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, nickname, address FROM users WHERE address != ?',
      [req.userAddress]
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages', authenticate, upload.single('image'), async (req, res) => {
  const { receiver, content, type } = req.body;
  try {
    
    const [result] = await pool.query(
      'INSERT INTO messages (sender, receiver, content, type) VALUES (?, ?, ?, ?)',
      [req.userAddress, receiver, type === 'image' ? `/uploads/${req.file.filename}` : content, type]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.get('/api/messages/:receiver', authenticate, async (req, res) => {
  const { receiver } = req.params;
  try {
    const [messages] = await pool.query(
      `SELECT * FROM messages 
      WHERE (sender = ? AND receiver = ?) 
      OR (sender = ? AND receiver = ?)
      ORDER BY timestamp`,
      [req.userAddress, receiver, receiver, req.userAddress]
    );
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.get('/api/chats', authenticate, async (req, res) => {
    try {
      const [chats] = await pool.query(`
        SELECT DISTINCT u.id, u.nickname, u.address 
        FROM users u
        JOIN messages m ON u.address = m.sender OR u.address = m.receiver
        WHERE (m.sender = ? OR m.receiver = ?) 
          AND u.address != ?
      `, [req.userAddress, req.userAddress, req.userAddress]);
      
      res.json(chats);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Add to server.js
app.post('/api/encrypt-image', authenticate, upload.single('image'), async (req, res) => {
  try {
      const { spawn } = require('child_process');
      const python = spawn('python', [pythonScriptPath, req.file.path]);
      
      let result = '';
      python.stdout.on('data', (data) => result += data.toString());
      
      python.on('close', (code) => {
          if(code !== 0) return res.status(500).json({ error: 'Encryption failed' });
          
          const shares = JSON.parse(result);
          res.json({
              share1: `/uploads/${shares.share1}`,
              share2: `/uploads/${shares.share2}`
          });
      });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

app.post('/api/decrypt-image', authenticate, async (req, res) => {
  const { share1Path, share2Path } = req.body;
  
  try {
      const decrypted = await decryptImage(
          path.join(__dirname, share1Path),
          path.join(__dirname, share2Path)
      );
      
      const decryptedPath = `/uploads/decrypted-${Date.now()}.png`;
      cv2.imwrite(path.join(__dirname, decryptedPath), decrypted);
      
      res.json({ decryptedImage: decryptedPath });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

  
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});