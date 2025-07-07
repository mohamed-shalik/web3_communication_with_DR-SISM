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
const Jimp = require('jimp');

// Middleware
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const address = authHeader && authHeader.split(' ')[1];
  
  if (!address) return res.status(401).json({ error: 'Unauthorized' });

  req.userAddress = address;
  next();
};

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
  try {
    let content = req.body.content;
    let type = req.body.type || 'text';  // ✅ Use provided type if available

    if (req.file) {
      const { spawnSync } = require('child_process');

      // Encryption only
      const encryptProcess = spawnSync('python3', [
        pythonScriptPath,
        req.file.path
      ]);

      if (encryptProcess.error) throw encryptProcess.error;
      if (encryptProcess.stderr) throw encryptProcess.stderr.toString();

      const encryptionResult = JSON.parse(encryptProcess.stdout.toString());

      // Store encrypted shares only
      content = JSON.stringify({
        share1: `${path.basename(encryptionResult.share1)}`,
        share2: `${path.basename(encryptionResult.share2)}`
      });
      type = 'encrypted-image';
    }

    console.log("from message api",content);

    const [result] = await pool.query(
      'INSERT INTO messages (sender, receiver, content, type) VALUES (?, ?, ?, ?)',
      [req.userAddress, req.body.receiver, content, type]
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

  app.post('/api/encrypt-image', authenticate, upload.single('image'), async (req, res) => {
    try {
        const { spawnSync } = require('child_process');
        const python = spawnSync('python3', [
            path.join(__dirname, 'drsism.py'),
            path.join(__dirname, req.file.path)
        ]);

        if (python.error) {
            return res.status(500).json({ error: python.error.message });
        }

        const result = python.stdout.toString();
        const shares = JSON.parse(result);

        res.json({
            share1: `/uploads/${shares.share1}`,
            share2: `/uploads/${shares.share2}`
        });
        console.log("shares are generated");

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/decrypt-image', async (req, res) => {
  const { share1, share2 } = req.body;
  // console.log("Received shares:", req.body);

  try {
      const { spawnSync } = require('child_process');
      const path = require('path');
      const fs = require('fs');

      // Fixing double "uploads/uploads/"
      let correctedShare1 = share1.replace('/uploads/uploads/', '/uploads/');
      let correctedShare2 = share2.replace('/uploads/uploads/', '/uploads/');

      // Extracting filename safely
      const cleanShare1 = path.basename(correctedShare1);
      const cleanShare2 = path.basename(correctedShare2);

      // Handling spaces in filenames (replacing spaces with underscores)
      const safeShare1 = cleanShare1.replace(/\s+/g, '_');
      const safeShare2 = cleanShare2.replace(/\s+/g, '_');

      // Constructing absolute paths
      const absShare1 = path.resolve(__dirname, 'uploads', safeShare1);
      const absShare2 = path.resolve(__dirname, 'uploads', safeShare2);

      // console.log("Corrected Absolute Share1 Path:", absShare1);
      // console.log("Corrected Absolute Share2 Path:", absShare2);

      // Check if files exist
      if (!fs.existsSync(absShare1) || !fs.existsSync(absShare2)) {
          console.error("File not found:", !fs.existsSync(absShare1) ? absShare1 : absShare2);
          return res.status(404).json({ error: 'One or both share files do not exist' });
      }

      // Run Python script for decryption
      const python = spawnSync('python3', [
          path.join(__dirname, 'drsism.py'),
          absShare1,
          absShare2
      ], { encoding: 'utf-8' });

      console.log("Python stdout:", python.stdout);
      console.error("Python stderr:", python.stderr);

      if (python.error) {
          console.error("Python Error:", python.error);
          return res.status(500).json({ error: python.error.message });
      }

      if (python.stderr) {
          return res.status(500).json({ error: python.stderr });
      }

      const result = python.stdout.trim();

      try {
          const output = JSON.parse(result);
          if (output.error) {
              return res.status(500).json({ error: output.error });
          }
          res.json({ reconstructedImageUrl: `/${output.decrypted}` });
      } catch (jsonErr) {
          console.error("JSON Parse Error:", jsonErr);
          console.error("Python Output:", result);
          res.status(500).json({ error: 'Invalid JSON from Python script', details: result });
      }

  } catch (err) {
      console.error("Decryption failed:", err);
      res.status(500).json({ error: 'Decryption failed' });
  }
});





  
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

// app.post('/api/messages', authenticate, upload.single('image'), async (req, res) => {

//   try {
//     let content = req.body.content;
//     let type = 'text';

//     if (req.file) {
//       // Directly process encryption without internal API call
//       const { spawnSync } = require('child_process');
//       const pythonProcess = spawnSync('python3', [
//         pythonScriptPath,
//         req.file.path
//       ]);

//       if (pythonProcess.error) {
//         throw pythonProcess.error;
//       }

//       const result = pythonProcess.stdout.toString();
//       const shares = JSON.parse(result);
      
//       content = JSON.stringify({
//         share1: `/uploads/${shares.share1}`,
//         share2: `/uploads/${shares.share2}`
//       });
//       type = 'encrypted-image';
//     }

//     const [result] = await pool.query(
//       'INSERT INTO messages (sender, receiver, content, type) VALUES (?, ?, ?, ?)',
//       [req.userAddress, req.body.receiver, content, type]
//     );

//     res.json({ id: result.insertId });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// app.post('/api/decrypt-image', authenticate, async (req, res) => {
//   try {
//     const cleanShare1 = req.body.share1Path.replace('/uploads/', '');
//     const cleanShare2 = req.body.share2Path.replace('/uploads/', '');

//     console.log("Decrypting:", cleanShare1, cleanShare2);

//     const decrypted = await decryptImage(
//       path.join(__dirname, 'uploads', cleanShare1),
//       path.join(__dirname, 'uploads', cleanShare2)
//     );

//     console.log("Decrypted image path:", decrypted);

//     res.json({ decryptedImage: `/uploads/${path.basename(decrypted)}` });
//   } catch (err) {
//     console.error("Decryption error:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// app.post('/api/messages', authenticate, upload.single('image'), async (req, res) => {
//   try {
//     let content = req.body.content;
//     let type = 'text';

//     if (req.file) {
//       const { spawnSync } = require('child_process');
      
//       // 🔐 Encrypt the image
//       const encryptProcess = spawnSync('python3', [
//         path.join(__dirname, 'drsism.py'),
//         req.file.path
//       ]);

//       if (encryptProcess.error) {
//         throw encryptProcess.error;
//       }

//       const encryptionResult = JSON.parse(encryptProcess.stdout.toString());
//       const share1Path = path.join(__dirname, encryptionResult.share1);
//       const share2Path = path.join(__dirname, encryptionResult.share2);

//       // 🔓 Immediately Decrypt the shares
//       const decryptProcess = spawnSync('python3', [
//         path.join(__dirname, 'decrypt_script.py'), // Optional: Use a separate script or same one
//         share1Path,
//         share2Path
//       ]);

//       if (decryptProcess.error) {
//         throw decryptProcess.error;
//       }

//       const decryptedResult = JSON.parse(decryptProcess.stdout.toString());

//       content = JSON.stringify({
//         decryptedImage: `/uploads/${path.basename(decryptedResult.decrypted)}`
//       });
//       type = 'decrypted-image';
//     }

//     // 📤 Send the decrypted image to the receiver
//     const [result] = await pool.query(
//       'INSERT INTO messages (sender, receiver, content, type) VALUES (?, ?, ?, ?)',
//       [req.userAddress, req.body.receiver, content, type]
//     );

//     res.json({ id: result.insertId, message: "Image sent successfully!" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });