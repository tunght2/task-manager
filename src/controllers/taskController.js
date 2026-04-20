const Task = require('../models/Task');
const { getAISuggestions, generateTask } = require('../services/aiService');

// @desc    Get all tasks
// @route   GET /api/tasks
const getTasks = async (req, res) => {
  console.log('GET /api/tasks request received');
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    console.log(`Found ${tasks.length} tasks`);
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    console.error('getTasks error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Create new task
// @route   POST /api/tasks
const createTask = async (req, res) => {
  try {
    const task = await Task.create(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
const getTask = async (req, res) => {
  try {
    console.log(req.params.id);
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Suggest for task
// @route   POST /api/tasks/:id/suggest
const suggestForTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const suggestions = await getAISuggestions(task);

    if (suggestions) {
      task.aiSuggestions = suggestions;
      await task.save();
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate task via AI
// @route   POST /api/tasks/ai-generate
const aiGenerateTask = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Please provide a prompt' });
    }

    const aiGeneratedData = await generateTask(prompt);

    if (!aiGeneratedData) {
      return res.status(500).json({ success: false, message: 'AI failed to generate task' });
    }

    const task = await Task.create(aiGeneratedData);

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  suggestForTask,
  aiGenerateTask,
};
