import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors({
  origin: [
    'https://verify-todo-app-tunnel-ielq6dyd.devinapps.com',
    'https://verify-todo-app-tunnel-m9ob538h.devinapps.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const db = createClient({
  url: 'file:todo.db'
});

// Initialize database
await db.execute(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )
`);

await db.execute(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Register user
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute({
      sql: 'INSERT INTO users (username, password) VALUES (?, ?)',
      args: [username, hashedPassword]
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ message: 'Username already exists' });
    } else {
      res.status(500).json({ message: 'Error registering user' });
    }
  }
});

// Login user
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE username = ?',
      args: [username]
    });

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Get all todos for authenticated user
app.get('/api/todos', authenticateToken, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM todos WHERE user_id = ? ORDER BY id DESC',
      args: [req.user.id]
    });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching todos' });
  }
});

// Add new todo
app.post('/api/todos', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    const result = await db.execute({
      sql: 'INSERT INTO todos (user_id, text) VALUES (?, ?) RETURNING *',
      args: [req.user.id, text]
    });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating todo' });
  }
});

// Toggle todo completion
app.patch('/api/todos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.execute({
      sql: `
        UPDATE todos
        SET completed = NOT completed
        WHERE id = ? AND user_id = ?
        RETURNING *
      `,
      args: [id, req.user.id]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating todo' });
  }
});

// Delete todo
app.delete('/api/todos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.execute({
      sql: 'DELETE FROM todos WHERE id = ? AND user_id = ?',
      args: [id, req.user.id]
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting todo' });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
