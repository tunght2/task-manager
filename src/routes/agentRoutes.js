const express = require('express');
const router = express.Router();
const { agentChat, getChatHistory } = require('../controllers/agentController');

// POST /api/agent/chat - Gửi tin nhắn tới AI Agent
router.post('/chat', agentChat);

// GET /api/agent/chat/:taskId - Lấy lịch sử chat của task
router.get('/chat/:taskId', getChatHistory);


module.exports = router;
