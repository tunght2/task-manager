const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'done'],
    default: 'todo',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  tags: [String],
  dueDate: {
    type: Date,
  },
  aiSuggestions: {
    subtasks: [String],
    optimizations: String,
    estimatedEffort: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Task', TaskSchema);
