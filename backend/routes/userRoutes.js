const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');

// Middleware to get userId from request header 'x-user-id'
function getUserId(req) {
  return req.headers['x-user-id'];
}

// Get all tasks for a user
router.get('/tasks', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(400).json({ message: 'User ID required' });

  try {
    const tasks = await Task.find({ user: userId });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new task for a user
const mongoose = require('mongoose');

router.post('/tasks', async (req, res) => {
  const userId = getUserId(req);
  const { text, priority, status, timestamp } = req.body;
  console.log('POST /tasks body:', req.body);
  console.log('Extracted userId:', userId);

  if (!userId) return res.status(400).json({ message: 'User ID required' });

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const newTask = new Task({ text, priority, status, timestamp, user: userId });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update a task by task id
router.put('/tasks/:taskId', async (req, res) => {
  const userId = getUserId(req);
  const taskId = req.params.taskId;
  const updates = req.body;

  if (!userId) return res.status(400).json({ message: 'User ID required' });

  try {
    const task = await Task.findOne({ _id: taskId, user: userId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    Object.assign(task, updates);
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a task by task id
router.delete('/tasks/:taskId', async (req, res) => {
  const userId = getUserId(req);
  const taskId = req.params.taskId;

  if (!userId) return res.status(400).json({ message: 'User ID required' });

  try {
    const task = await Task.findOneAndDelete({ _id: taskId, user: userId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
