const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  suggestForTask,
  aiGenerateTask,
} = require('../controllers/taskController');

router.route('/')
  .get(getTasks)
  .post(createTask);

router.post('/ai-generate', aiGenerateTask);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

router.post('/:id/suggest', suggestForTask);

module.exports = router;
