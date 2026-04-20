const { GoogleGenerativeAI } = require('@google/generative-ai');
const { tools, toolDefinitions } = require('./tools/taskTools');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MAX_ITERATIONS = 10; // Giới hạn số vòng lặp để tránh vòng lặp vô tận
const MAX_SUBAGENT_ITERATIONS = 30; // Giới hạn cho subagent
const SYSTEM_INSTRUCTION = 'Bạn là trợ lý quản lý công việc thông minh. Sử dụng các tool được cung cấp để thao tác với danh sách công việc. Hành động, đừng giải thích.';
const SUBAGENT_SYSTEM_INSTRUCTION = 'Bạn là sub-agent chuyên xử lý tác vụ cụ thể. Hoàn thành nhiệm vụ được giao, sau đó trả về kết quả tóm tắt ngắn gọn. Không hỏi lại, hành động trực tiếp.';

const runAgent = async (userMessage, history = []) => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [{ functionDeclarations: toolDefinitions }],
  });

  // Build messages array: history + user message
  const messages = [
    ...history,
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  let iteration = 0;
  const agentLog = []; // Ghi lại mọi bước của agent

  // -- The core pattern: a while loop that calls tools until the model stops --
  while (true) {
    iteration++;
    if (iteration > MAX_ITERATIONS) {
      return {
        answer: 'Agent đã đạt giới hạn số vòng lặp mà không có câu trả lời.',
        log: agentLog,
      };
    }


    // 1. Gọi LLM với toàn bộ messages + tools
    const result = await model.generateContent({ contents: messages });
    const response = result.response;
    const candidate = response.candidates[0];
    const parts = candidate.content.parts;

    // 2. Append assistant turn vào messages
    messages.push({ role: 'model', parts });

    // 3. Kiểm tra xem AI có muốn gọi tool không
    const functionCalls = parts.filter(p => p.functionCall);

    if (functionCalls.length === 0) {
      // AI trả lời trực tiếp -> Kết thúc vòng lặp
      const finalText = parts.map(p => p.text).filter(Boolean).join('');
      agentLog.push({ type: 'final_answer', content: finalText });
      return { answer: finalText, log: agentLog, history: messages };
    }

    // 4. Execute each tool call, collect results
    const toolResultParts = [];

    for (const part of functionCalls) {
      const { name, args } = part.functionCall;
      agentLog.push({ type: 'tool_call', tool: name, args });

      let output;
      if (tools[name]) {
        try {
          output = await tools[name](args);
        } catch (err) {
          output = `Error: ${err.message}`;
          console.error(`❌ Tool error:`, err.message);
        }
      } else {
        output = `Tool "${name}" is not yet implemented.`;
      }

      agentLog.push({ type: 'tool_result', tool: name, result: output });

      toolResultParts.push({
        functionResponse: {
          name,
          response: { result: output },
        },
      });
    }

    // 5. Append tool results vào messages
    //    Trong Gemini SDK, tool results dùng role "user" với functionResponse parts
    messages.push({ role: 'user', parts: toolResultParts });

    // Loop continues... (quay lại bước 1)
  }
};

/**
 * Subagent — context riêng, trả về summary cho parent.
 *
 * Ý tưởng:
 * - Tạo messages mới hoàn toàn (fresh context)
 * - Chạy agentic loop tối đa MAX_SUBAGENT_ITERATIONS
 * - Chỉ trả về final text → parent dùng kết quả, child context bị discard
 *
 * @param {string} prompt - Nhiệm vụ cụ thể cho subagent
 * @param {object} options
 * @param {string}   options.systemInstruction - Ghi đè system prompt nếu cần
 * @param {string[]} options.allowedTools      - Giới hạn tool (tên), mặc định dùng tất cả
 * @param {number}   options.maxIterations     - Ghi đè giới hạn vòng lặp
 * @returns {Promise<string>} Tóm tắt kết quả từ subagent
 */
const runSubagent = async (prompt, options = {}) => {
  const {
    systemInstruction = SUBAGENT_SYSTEM_INSTRUCTION,
    allowedTools = null, // null = dùng tất cả tools
    maxIterations = MAX_SUBAGENT_ITERATIONS,
  } = options;

  // -- Lọc tool definitions nếu cần --
  const childToolDefs = allowedTools
    ? toolDefinitions.filter(t => allowedTools.includes(t.name))
    : toolDefinitions;

  // -- Tạo model instance riêng cho subagent --
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction,
    tools: childToolDefs.length > 0 ? [{ functionDeclarations: childToolDefs }] : undefined,
  });

  // -- Fresh context — không kế thừa history từ parent --
  const subMessages = [
    { role: 'user', parts: [{ text: prompt }] },
  ];

  let lastParts = []; // lưu response cuối cùng để extract text

  for (let i = 0; i < maxIterations; i++) {
    // 1. Gọi LLM
    const result = await model.generateContent({ contents: subMessages });
    const response = result.response;
    const candidate = response.candidates[0];
    const parts = candidate.content.parts;
    lastParts = parts;

    // 2. Append assistant turn
    subMessages.push({ role: 'model', parts });

    // 3. Kiểm tra function calls
    const functionCalls = parts.filter(p => p.functionCall);

    if (functionCalls.length === 0) {
      // Không có tool call → subagent đã trả lời → thoát loop
      break;
    }

    // 4. Execute tool calls
    const toolResultParts = [];

    for (const part of functionCalls) {
      const { name, args } = part.functionCall;

      let output;
      if (tools[name]) {
        try {
          output = await tools[name](args);
        } catch (err) {
          output = `Error: ${err.message}`;
          console.error(`❌ Subagent tool error [${name}]:`, err.message);
        }
      } else {
        output = `Unknown tool: "${name}"`;
      }

      // Truncate output để không vượt quá context
      const truncatedOutput = typeof output === 'string'
        ? output.slice(0, 50000)
        : JSON.stringify(output).slice(0, 50000);

      toolResultParts.push({
        functionResponse: {
          name,
          response: { result: truncatedOutput },
        },
      });
    }

    // 5. Append tool results
    subMessages.push({ role: 'user', parts: toolResultParts });

    // Loop continues...
  }

  // -- Chỉ trả về final text, child context bị discard --
  const summary = lastParts
    .map(p => p.text)
    .filter(Boolean)
    .join('');

  return summary || '(no summary)';
};

module.exports = { runAgent, runSubagent };
