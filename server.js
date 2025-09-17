const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const TASK_FILE = path.join(__dirname, 'data', 'tasks.json');

// Helper: Read tasks from file
async function readTasks() {
  try {
    const text = await fs.readFile(TASK_FILE, 'utf8');
    return JSON.parse(text);
  } catch (err) {
    if (err.code === 'ENOENT') return []; // file not found → return empty array
    throw err;
  }
}

// Helper: Write tasks to file
async function writeTasks(tasks) {
  await fs.writeFile(TASK_FILE, JSON.stringify(tasks, null, 2), 'utf8');
}

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// ✅ GET all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await readTasks();
    res.json(tasks);
  } catch {
    res.status(500).json({ error: 'Unable to read tasks' });
  }
});

// ✅ POST new task
app.post('/api/tasks', async (req, res) => {
  const { title, description = '', priority } = req.body;

  // Validation
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  if (!VALID_PRIORITIES.includes(priority)) {
    return res
      .status(400)
      .json({ error: 'priority must be low|medium|high|urgent' });
  }

  // Build new task
  const task = {
    taskId: 'TASK-' + Date.now(),
    title: title.trim(),
    description,
    priority,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  // Save task
  const tasks = await readTasks();
  tasks.push(task);
  await writeTasks(tasks);

  res.status(201).json(task);
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
