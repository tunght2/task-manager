const express = require('express');
const router = express.Router();
const { agentChat } = require('../controllers/agentController');

// POST /api/agent/chat - Gửi tin nhắn tới AI Agent
router.post('/chat', agentChat);

module.exports = router;
