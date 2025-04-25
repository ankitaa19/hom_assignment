const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Task = require('../models/Task');

// Helper to get userId from header or body
function getUserId(req) {
  return req.headers['x-user-id'] || req.body.userId;
}

// Get all tasks for a user
router.get('/tasks', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(400).json({ message: 'User ID required' });

  try {
    const tasks = await Task.find({ user: userId });
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'No tasks found' });
    }
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new task for a user
router.post('/tasks', async (req, res) => {
  const userId = getUserId(req);
  const { text, priority, status, timestamp } = req.body;

  if (!userId) return res.status(400).json({ message: 'User ID required' });
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const newTask = new Task({ text, priority, status, timestamp, user: userId });
    await newTask.save();
    res.status(201).json(newTask); // Return the newly created task
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a task by task ID
router.put('/tasks/:taskId', async (req, res) => {
  const userId = getUserId(req);
  const taskId = req.params.taskId;
  const updates = req.body;

  if (!userId) return res.status(400).json({ message: 'User ID required' });

  try {
    const task = await Task.findOne({ _id: taskId, user: userId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Update the task fields with the provided updates
    Object.assign(task, updates);
    await task.save();
    res.json(task); // Return the updated task
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a task by task ID
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
