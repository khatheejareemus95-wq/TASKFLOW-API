// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// -------- Paths --------
const TASK_FILE = path.join(__dirname, 'data', 'tasks.json');
const INDEX_FILE = path.join(__dirname, 'index.html'); // your single HTML file

// -------- Helpers --------
async function readTasks() {
  try {
    const text = await fs.readFile(TASK_FILE, 'utf8');
    return JSON.parse(text);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeTasks(tasks) {
  await fs.writeFile(TASK_FILE, JSON.stringify(tasks, null, 2), 'utf8');
}

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// -------- API Routes --------
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await readTasks();
    res.json(tasks);
  } catch {
    res.status(500).json({ error: 'Unable to read tasks' });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { title, description = '', priority } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  if (!VALID_PRIORITIES.includes(priority)) {
    return res
      .status(400)
      .json({ error: 'priority must be one of low|medium|high|urgent' });
  }

  const task = {
    taskId: 'TASK-' + Date.now(),
    title: title.trim(),
    description,
    priority,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const tasks = await readTasks();
  tasks.push(task);
  await writeTasks(tasks);
  res.status(201).json(task);
});

// -------- Serve the single index.html at root --------
app.get('/', (req, res) => {
  res.sendFile(INDEX_FILE);
});

// -------- Start Server --------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
