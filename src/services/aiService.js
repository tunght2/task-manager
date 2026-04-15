const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getAISuggestions = async (task) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an AI Productivity Assistant. analyze this task and provide:
      1. A better, more professional description.
      2. 3-5 sub-tasks to complete this task.
      3. Estimated effort (e.g., "30 mins", "2 hours").

      Task:
      Title: ${task.title}
      Description: ${task.description || 'N/A'}

      Return the response in JSON format only:
      {
        "optimizations": "enhanced description",
        "subtasks": ["subtask 1", "subtask 2"],
        "estimatedEffort": "time"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    // Sometimes Gemini wraps JSON in markdown blocks
    const jsonStr = text.match(/\{[\s\S]*\}/)[0];
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('AI Service Error:', error);
    return null;
  }
};

const generateTask = async (userInput) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      As an AI Project Manager, create a detailed task from this user input: "${userInput}"
      
      Return a JSON object with:
      {
        "title": "A concise and clear task title",
        "description": "A detailed description explaining how to achieve it",
        "priority": "low, medium, or high",
        "tags": ["tag1", "tag2"],
        "aiSuggestions": {
          "subtasks": ["step 1", "step 2", "step 3"],
          "estimatedEffort": "time estimate"
        }
      }
      
      Return ONLY the JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonStr = text.match(/\{[\s\S]*\}/)[0];
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('AI Service (Generate) Error:', error);
    return null;
  }
};

module.exports = {
  getAISuggestions,
  generateTask,
};
