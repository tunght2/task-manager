const { GoogleGenerativeAI } = require('@google/generative-ai');
const { tools, toolDefinitions } = require('./tools/taskTools');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MAX_ITERATIONS = 5; // Giới hạn số vòng lặp để tránh vòng lặp vô tận

/**
 * AGENT LOOP
 * 1. Nhận message từ user
 * 2. Gửi tới Gemini kèm danh sách tools
 * 3. Nếu AI muốn gọi tool -> thực thi tool -> gửi kết quả lại cho AI
 * 4. Lặp lại cho đến khi AI trả lời trực tiếp (không gọi tool nữa)
 */
const runAgent = async (userMessage, history = []) => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    tools: [{ functionDeclarations: toolDefinitions }],
  });

  const chat = model.startChat({ history });

  let iteration = 0;
  const agentLog = []; // Ghi lại mọi bước của agent

  let currentMessage = userMessage;

  while (iteration < MAX_ITERATIONS) {
    iteration++;
    console.log(`\n🔄 Agent Loop - Iteration ${iteration}`);

    const result = await chat.sendMessage(currentMessage);
    const response = await result.response;
    const candidate = response.candidates[0];
    const contentParts = candidate.content.parts;

    // Kiểm tra xem AI có muốn gọi tool không
    const functionCalls = contentParts.filter(p => p.functionCall);

    if (functionCalls.length === 0) {
      // AI trả lời trực tiếp -> Kết thúc vòng lặp
      const finalText = contentParts.map(p => p.text).join('');
      console.log(`✅ Agent finished after ${iteration} iteration(s)`);
      agentLog.push({ type: 'final_answer', content: finalText });
      return { answer: finalText, log: agentLog };
    }

    // AI muốn gọi một hoặc nhiều tools
    const toolResults = [];

    for (const part of functionCalls) {
      const { name, args } = part.functionCall;
      console.log(`🛠  Calling tool: ${name} with args:`, args);
      agentLog.push({ type: 'tool_call', tool: name, args });

      if (tools[name]) {
        const toolResult = await tools[name](args);
        console.log(`📦 Tool result:`, toolResult);
        agentLog.push({ type: 'tool_result', tool: name, result: toolResult });

        toolResults.push({
          functionResponse: {
            name,
            response: { result: toolResult },
          },
        });
      } else {
        // Tool chưa được triển khai (Placeholder)
        const placeholderResult = `Tool "${name}" is not yet implemented.`;
        agentLog.push({ type: 'tool_result', tool: name, result: placeholderResult });
        toolResults.push({
          functionResponse: {
            name,
            response: { result: placeholderResult },
          },
        });
      }
    }

    // Gửi kết quả của tools lại cho AI để nó tiếp tục suy luận
    currentMessage = toolResults;
  }

  return {
    answer: 'Agent đã đạt giới hạn số vòng lặp mà không có câu trả lời.',
    log: agentLog,
  };
};

module.exports = { runAgent };
