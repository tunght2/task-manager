const { GoogleGenerativeAI } = require('@google/generative-ai');
const { tools, toolDefinitions } = require('./tools/taskTools');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MAX_ITERATIONS = 10; // Giới hạn số vòng lặp để tránh vòng lặp vô tận
const SYSTEM_INSTRUCTION = 'Bạn là trợ lý quản lý công việc thông minh. Sử dụng các tool được cung cấp để thao tác với danh sách công việc. Hành động, đừng giải thích.';

const runAgent = async (userMessage, history = []) => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [{ functionDeclarations: toolDefinitions }],
  });

  // Build messages array: history + user message (giống Python: messages = history + [user])
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

    // 2. Append assistant turn vào messages (giống Python: messages.append({"role": "assistant", ...}))
    messages.push({ role: 'model', parts });

    // 3. Kiểm tra xem AI có muốn gọi tool không (giống Python: if stop_reason != "tool_use": return)
    const functionCalls = parts.filter(p => p.functionCall);

    if (functionCalls.length === 0) {
      // AI trả lời trực tiếp -> Kết thúc vòng lặp (giống Python: return khi stop_reason != "tool_use")
      const finalText = parts.map(p => p.text).filter(Boolean).join('');
      agentLog.push({ type: 'final_answer', content: finalText });
      return { answer: finalText, log: agentLog, history: messages };
    }

    // 4. Execute each tool call, collect results (giống Python: for block in response.content)
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

    // 5. Append tool results vào messages (giống Python: messages.append({"role": "user", "content": results}))
    //    Trong Gemini SDK, tool results dùng role "user" với functionResponse parts
    messages.push({ role: 'user', parts: toolResultParts });

    // Loop continues... (quay lại bước 1)
  }
};

module.exports = { runAgent };
