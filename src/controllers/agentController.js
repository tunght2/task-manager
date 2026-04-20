const { runAgent } = require('../services/agentService');
const TaskChat = require('../models/TaskChat');

// @desc    Chat with the AI Agent
// @route   POST /api/agent/chat
const agentChat = async (req, res) => {
  try {
    const { message, history, taskId, userId } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Please provide a message' });
    }

    const result = await runAgent(message, history || []);

    // Save chat history to task_chat table
    if (taskId) {
      try {
        await TaskChat.findOneAndUpdate(
          { task_id: taskId },
          { 
            $push: { 
              content_chat: [
                { role: 'user', content: message },
                { role: 'assistant', content: result.answer }
              ] 
            },
            $set: { user_id: userId || 'anonymous' }
          },
          { upsert: true, new: true }
        );
      } catch (dbError) {
        console.error('Failed to save chat history:', dbError);
        // We still return the AI response even if saving history fails
      }
    }

    res.status(200).json({
      success: true,
      answer: result.answer,
      log: result.log,
      history: result.history,
    });
  } catch (error) {
    console.error('Agent chat error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Get chat history for a specific task
// @route   GET /api/agent/chat/:taskId
const getChatHistory = async (req, res) => {
  try {
    const { taskId } = req.params;
    const history = await TaskChat.findOne({ task_id: taskId });
    
    res.status(200).json({
      success: true,
      data: history ? history.content_chat : []
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { agentChat, getChatHistory };

