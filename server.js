const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'portfolio_db'
});

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    if (err.code === 'ECONNREFUSED') {
      console.error('Make sure MySQL is running and the connection details are correct.');
    }
    return;
  }
  console.log('Connected to database');
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads/'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.post('/api/skills', upload.single('image'), (req, res) => {
  const { title } = req.body;
  const imagePath = req.file ? 'uploads/' + req.file.filename : null;
  console.log('Saving image path:', imagePath);

  const query = 'INSERT INTO skills (title, image_path) VALUES (?, ?)';
  db.query(query, [title, imagePath], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error adding skill' });
      return;
    }
    res.status(201).json({ message: 'Skill added successfully', id: result.insertId });
  });
});

app.post('/api/projects', upload.single('image'), (req, res) => {
  const { title, description } = req.body;
  const imagePath = req.file ? 'uploads/' + req.file.filename : null;
  console.log('Saving image path:', imagePath);

  const query = 'INSERT INTO projects (title, description, image_path) VALUES (?, ?, ?)';
  db.query(query, [title, description, imagePath], (err, result) => {
    if (err) {
      console.error('Error adding project:', err);
      res.status(500).json({ error: 'Error adding project' });
      return;
    }
    res.status(201).json({ message: 'Project added successfully', id: result.insertId });
  });
});

app.get('/api/skills', (req, res) => {
  const query = 'SELECT * FROM skills';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching skills' });
      return;
    }
    res.json(results);
  });
});

app.get('/api/projects', (req, res) => {
  const query = 'SELECT * FROM projects';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching projects' });
      return;
    }
    res.json(results);
  });
});

app.put('/api/skills/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const imagePath = req.file ? req.file.path : null;

  let query = 'UPDATE skills SET title = ?';
  let params = [title];

  if (imagePath) {
    query += ', image_path = ?';
    params.push(imagePath);
  }

  query += ' WHERE id = ?';
  params.push(id);

  db.query(query, params, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error updating skill' });
      return;
    }
    res.json({ message: 'Skill updated successfully' });
  });
});

app.put('/api/projects/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  const imagePath = req.file ? req.file.path : null;

  let query = 'UPDATE projects SET title = ?, description = ?';
  let params = [title, description];

  if (imagePath) {
    query += ', image_path = ?';
    params.push(imagePath);
  }

  query += ' WHERE id = ?';
  params.push(id);

  db.query(query, params, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error updating project' });
      return;
    }
    res.json({ message: 'Project updated successfully' });
  });
});

app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM projects WHERE id = ?';
  db.query(query, id, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error deleting project' });
      return;
    }

    res.json({message: "Project deleted successfully"})
  })
})

app.delete('/api/skills/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT image_path FROM skills WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      res.status(500).json({ success: false, message: 'Error deleting skill' });
      return;
    }
    if (result.length > 0) {
      const imagePath = path.join(__dirname, result[0].image_path);
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Error deleting image file:', err);
      });
    }
    const deleteQuery = 'DELETE FROM skills WHERE id = ?';
    db.query(deleteQuery, [id], (err, result) => {
      if (err) {
        res.status(500).json({ success: false, message: 'Error deleting skill' });
        return;
      }
      res.json({ success: true, message: 'Skill deleted successfully' });
    });
  });
});

app.post('/api/messages', (req, res) => {
  const { name, email, message } = req.body;

  const query = 'INSERT INTO messages (name, email, message) VALUES (?, ?, ?)';
  db.query(query, [name, email, message], (err, result) => {
    if (err) {
      console.error('Error adding message:', err);
      res.status(500).json({ error: 'Error adding message' });
      return;
    }
    res.status(201).json({ message: 'Message sent successfully' });
  });
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});