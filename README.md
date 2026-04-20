# 🎯 Smart Task Manager (AI-Powered) Backend

Chào mừng bạn đến với backend của dự án **Smart Task Manager**. Đây là một ứng dụng quản lý công việc thông minh được tích hợp trí tuệ nhân tạo (Gemini AI) để giúp bạn tối ưu hóa hiệu suất làm việc.

## 🚀 Tính năng chính

- **Quản lý Task (CRUD)**: Tạo, lấy danh sách, cập nhật và xóa nhiệm vụ.
- **Trợ lý AI (Gemini 1.5 Flash)**: 
  - Tự động phân tích và cải thiện tiêu đề/mô tả công việc.
  - Gợi ý danh sách các công việc con (sub-tasks).
  - Ước lượng thời gian hoàn thành dựa trên nội dung công việc.
- **Database**: Sử dụng MongoDB để lưu trữ dữ liệu bền vững.

---

## 🛠 Yêu cầu hệ thống

Trước khi bắt đầu, hãy đảm bảo bạn đã cài đặt:
- [Node.js](https://nodejs.org/) (Phiên bản 18 trở lên)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local hoặc Atlas)
- Một API Key từ [Google AI Studio](https://aistudio.google.com/) (Để sử dụng tính năng AI)

---

## 📦 Cài đặt

1. **Clone project hoặc di chuyển vào thư mục dự án:**
   ```bash
   cd task-manager
   ```

2. **Cài đặt các thư viện cần thiết:**
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường:**
   Tạo hoặc chỉnh sửa file `.env` trong thư mục gốc:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/smart-task-manager
   GEMINI_API_KEY=điền_api_key_của_bạn_vào_đây
   NODE_ENV=development
   ```

---

## 🏃 Khởi động

Để chạy server ở chế độ phát triển:
```bash
npm run dev
```
Server sẽ mặc định chạy tại: `http://localhost:5000`

---

## 📖 Hướng dẫn API (Endpoints)

### Công việc (Tasks)
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| **GET** | `/api/tasks` | Lấy toàn bộ danh sách task |
| **POST** | `/api/tasks` | Tạo task mới |
| **PUT** | `/api/tasks/:id` | Cập nhật thông tin task |
| **DELETE** | `/api/tasks/:id` | Xóa một task |
| **POST** | `/api/tasks/:id/suggest` | **Gọi AI gợi ý cho task này** |
| **POST** | `/api/tasks/ai-generate` | Tạo task hoàn chỉnh từ một prompt ngôn ngữ tự nhiên |

### Trợ lý AI (Agent)
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| **POST** | `/api/agent/chat` | Chat với AI Agent (gửi message + history) |
| **GET** | `/api/agent/chat/:taskId` | Lấy lại lịch sử chat của một task cụ thể |


### Cách sử dụng tính năng AI:
Khi bạn gọi endpoint `/api/tasks/:id/suggest`, AI sẽ dựa trên `title` và `description` của task đó để trả về:
- `subtasks`: Danh sách các bước nhỏ cần làm.
- `optimizations`: Mô tả công việc được tối ưu chuyên nghiệp hơn.
- `estimatedEffort`: Thời gian dự kiến hoàn thành.

---

## 📂 Cấu trúc thư mục

```
src/
├── config/      # Cấu hình DB (Mongoose)
├── controllers/ # Xử lý logic nghiệp vụ
├── models/      # Định nghĩa Schema dữ liệu (Task)
├── routes/      # Định nghĩa các đường dẫn API
├── services/    # Tích hợp Google Gemini AI
├── app.js       # Cấu hình Express middleware
└── index.js     # Điểm khởi đầu của server
```

---

## 🤝 Liên hệ
Nếu bạn có bất kỳ thắc mắc nào, đừng ngần ngại hỏi tôi (Antigravity) nhé!
