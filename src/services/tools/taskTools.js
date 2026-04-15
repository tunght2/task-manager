const Task = require('../../models/Task');

/**
 * Các hàm này sẽ được AI Agent gọi trực tiếp
 */
const tools = {
  // Tool tạo công việc mới
  create_task: async ({ title, description, priority, tags }) => {
    const task = await Task.create({ title, description, priority, tags });
    return JSON.stringify(task);
  },

  // Tool lấy danh sách công việc
  list_tasks: async ({ status, priority }) => {
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    const tasks = await Task.find(filter);
    return JSON.stringify(tasks);
  },

  // Tool tìm kiếm công việc theo từ khóa
  search_tasks: async ({ query }) => {
    const tasks = await Task.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    });
    return JSON.stringify(tasks);
  },

  // Tool lấy dự báo thời tiết (Placeholder example)
  get_weather: async ({ location }) => {
    return `Thời tiết tại ${location} hiện tại là 25 độ C, nắng đẹp. Rất thích hợp để làm việc!`;
  }
};

// Định nghĩa Schema cho Gemini biết cách dùng tool
const toolDefinitions = [
  {
    name: "create_task",
    description: "Tạo một công việc mới vào danh sách cần làm",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: "Tiêu đề công việc" },
        description: { type: "STRING", description: "Mô tả chi tiết" },
        priority: { type: "STRING", enum: ["low", "medium", "high"] },
        tags: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: ["title"]
    }
  },
  {
    name: "list_tasks",
    description: "Lấy danh sách các công việc hiện có, có thể lọc theo trạng thái hoặc độ ưu tiên",
    parameters: {
      type: "OBJECT",
      properties: {
        status: { type: "STRING", enum: ["todo", "in-progress", "done"] },
        priority: { type: "STRING", enum: ["low", "medium", "high"] }
      }
    }
  },
  {
    name: "search_tasks",
    description: "Tìm kiếm công việc dựa trên từ khóa trong tiêu đề hoặc mô tả",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Từ khóa tìm kiếm" }
      },
      required: ["query"]
    }
  },
  {
    name: "get_weather",
    description: "Lấy thông tin thời tiết tại một địa điểm cụ thể",
    parameters: {
      type: "OBJECT",
      properties: {
        location: { type: "STRING", description: "Tên thành phố hoặc quốc gia" }
      },
      required: ["location"]
    }
  }
];

module.exports = { tools, toolDefinitions };
