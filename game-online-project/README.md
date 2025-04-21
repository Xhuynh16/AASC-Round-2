# Online Games Platform

Nền tảng trò chơi trực tuyến bao gồm Caro và Line98 với chức năng đăng nhập, đăng ký và quản lý tài khoản.

## Cấu trúc dự án

- `backend/`: Máy chủ NestJS (REST API + WebSocket)
- `frontend/`: Ứng dụng khách hàng Angular

## Cài đặt và Chạy Ứng Dụng

### Yêu cầu hệ thống

- Node.js (v14 trở lên)
- npm (v6 trở lên)

### Chạy Backend (NestJS)

1. Di chuyển đến thư mục backend:
```bash
cd backend
```

2. Cài đặt các gói phụ thuộc:
```bash
npm install
```

3. Cơ sở dữ liệu (SQLite) đã được cấu hình sẵn và sẽ tự động được tạo khi khởi động. File cơ sở dữ liệu sẽ được lưu tại `backend/database/game.db`.

4. Khởi động máy chủ backend ở chế độ phát triển:
```bash
npm run start:dev
```

Máy chủ sẽ chạy tại http://localhost:3000

### Chạy Frontend (Angular)

1. Di chuyển đến thư mục frontend:
```bash
cd frontend
```

2. Cài đặt các gói phụ thuộc:
```bash
npm install
```

3. API URL đã được cấu hình sẵn trong `src/environments/environment.ts` để kết nối với backend tại `http://localhost:3000`.

4. Khởi động máy chủ phát triển Angular:
```bash
ng serve
```

Ứng dụng sẽ chạy tại http://localhost:4200

## Sử dụng Ứng Dụng

1. Truy cập http://localhost:4200 trong trình duyệt web.
2. Đăng ký tài khoản mới hoặc đăng nhập nếu đã có tài khoản.
3. Từ trang chủ, bạn có thể:
   - Truy cập trò chơi Caro và tạo ván mới hoặc tham gia ván có sẵn
   - Truy cập trò chơi Line98 và bắt đầu chơi
   - Xem và cập nhật thông tin hồ sơ của bạn

### Chơi Caro

1. Từ trang Caro, bạn có thể:
   - Tạo ván mới bằng cách nhấn "Tạo ván mới"
   - Tham gia ván có sẵn bằng cách nhập ID ván và nhấn "Tham gia"

2. Luật chơi:
   - Người chơi đầu tiên tham gia sẽ là X
   - Người chơi thứ hai tham gia sẽ là O
   - Lần lượt đánh vào ô trống để đặt quân
   - Người thắng là người đầu tiên tạo được 5 quân liền nhau theo chiều ngang, dọc hoặc chéo

### Chơi Line98

1. Từ trang Line98, bạn có thể bắt đầu trò chơi mới.
2. Luật chơi:
   - Trò chơi diễn ra trên lưới 9x9
   - Ban đầu, 3 quả bóng màu được đặt ngẫu nhiên trên lưới
   - Người chơi có thể di chuyển các quả bóng đến ô trống nếu có đường đi hợp lệ
   - Sau mỗi lượt di chuyển hợp lệ, 3 quả bóng mới xuất hiện trên bảng
   - Khi 5 quả bóng cùng màu trở lên tạo thành một đường (ngang, dọc hoặc chéo), chúng sẽ bị xóa và tính điểm
   - Trò chơi kết thúc khi bảng đầy (không còn ô trống)

## Tính năng chính

- **Xác thực người dùng**:
  - Đăng ký và đăng nhập với JWT
  - Quản lý token và phiên đăng nhập

- **Quản lý hồ sơ người dùng**:
  - Xem và cập nhật thông tin cá nhân
  - Đổi mật khẩu

- **Trò chơi Caro**:
  - Chơi theo lượt với người khác thông qua WebSocket
  - Hỗ trợ nhiều ván chơi đồng thời
  - Hiển thị trạng thái trò chơi và người thắng

- **Trò chơi Line98**:
  - Giao diện tương tác dựa trên Canvas
  - Tính năng tìm đường đi tự động
  - Hiệu ứng và animation
  - Hệ thống tính điểm

## Gỡ lỗi Thường Gặp

- **Kết nối backend thất bại**:
  - Đảm bảo máy chủ backend đang chạy tại cổng 3000
  - Kiểm tra console của trình duyệt để xem thông báo lỗi
  - Cổng 3000 có thể đang được sử dụng bởi ứng dụng khác, thay đổi cổng trong `backend/src/main.ts` và cập nhật URL trong `frontend/src/environments/environment.ts`

- **Lỗi đăng nhập/đăng ký**:
  - Làm mới lại trang và thử lại
  - Kiểm tra console của trình duyệt để xem chi tiết lỗi

- **Lỗi cơ sở dữ liệu**:
  - Xóa file `backend/database/game.db` (nếu tồn tại) và khởi động lại máy chủ backend để tạo mới cơ sở dữ liệu

- **Lỗi kết nối WebSocket (trong game Caro)**:
  - Đảm bảo backend đang chạy
  - Làm mới trang và đăng nhập lại

- **Lỗi CORS**:
  - Đảm bảo chạy frontend tại cổng 4200 (mặc định đã được cấu hình trong backend)

## Công nghệ sử dụng

- **Backend**: NestJS, TypeORM, SQLite, JWT, Socket.io
- **Frontend**: Angular, RxJS, HTML5 Canvas, Angular Material

## API Endpoints

### Xác thực
- `POST /auth/register`: Đăng ký người dùng mới
- `POST /auth/login`: Xác thực người dùng và lấy token JWT

### Quản lý người dùng
- `GET /user/profile`: Lấy thông tin hồ sơ người dùng
- `PUT /user/update`: Cập nhật hồ sơ người dùng

### Trò chơi Caro
- `POST /caro/join`: Tạo hoặc tham gia ván caro
- `GET /caro/games/:id`: Lấy thông tin ván caro theo ID

### Trò chơi Line98
- `POST /line98/start`: Bắt đầu ván mới với tham số tùy chọn
- `POST /line98/move/:id`: Di chuyển quả bóng trên bảng
- `GET /line98/hint/:id`: Lấy gợi ý cho nước đi tiếp theo
- `GET /line98/:id`: Lấy trạng thái hiện tại của trò chơi

## WebSocket Events (Caro Game)

### Client -> Server
- `join-game`: Tham gia phòng game
- `move`: Thực hiện nước đi

### Server -> Client
- `game-update`: Cập nhật trạng thái game
- `game-over`: Thông báo game kết thúc 