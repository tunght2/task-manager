const mongoose = require('mongoose');

const TaskChatSchema = new mongoose.Schema({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  user_id: {
    type: String, // Or ObjectId if you have a User model
    required: false // Optional for now until auth is fully integrated
  },
  content_chat: [
    {
      role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
      },
      content: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, {
  collection: 'task_chat',
  timestamps: {
    createdAt: 'create_time',
    updatedAt: 'update_time'
  }
});

module.exports = mongoose.model('TaskChat', TaskChatSchema);

