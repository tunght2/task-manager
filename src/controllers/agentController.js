const { runAgent } = require('../services/agentService');

// @desc    Chat with the AI Agent
// @route   POST /api/agent/chat
const agentChat = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Please provide a message' });
    }

    console.log(`\n👤 User: ${message}`);

    const result = await runAgent(message, history || []);

    res.status(200).json({
      success: true,
      answer: result.answer,
      log: result.log,
      history: result.history, // Trả history về để client gửi lại ở lần chat tiếp theo
    });
  } catch (error) {
    console.error('Agent chat error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { agentChat };
