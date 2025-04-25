# Máy Chủ Trò Chơi Trực Tuyến

Đây là máy chủ trò chơi trực tuyến đa người chơi được xây dựng bằng NestJS, SQLite, mẫu EJS và WebSockets. Máy chủ cung cấp các tính năng xác thực người dùng, quản lý hồ sơ và hai trò chơi có thể chơi được: Line 98 và Cờ Caro.

## Tính Năng

- Xác thực người dùng (đăng ký, đăng nhập, đăng xuất)
- Quản lý hồ sơ người dùng
- Hai trò chơi đa người chơi:
  - Line 98
  - Cờ Caro
- Chơi game thời gian thực với WebSockets
- Chức năng trò chuyện trong phòng chơi game

## Yêu Cầu Hệ Thống

- Node.js (v14 trở lên)
- npm (v6 trở lên)

## Cài Đặt

1. Sao chép kho lưu trữ

2. Di chuyển đến thư mục game-server:
   ```
   cd game-server
   ```

3. Cài đặt các gói phụ thuộc:
   ```
   npm install
   ```

## Chạy Ứng Dụng

1. Khởi động máy chủ phát triển:
   ```
   npm run start:dev
   ```

   Cho môi trường sản xuất:
   ```
   npm run build
   npm run start:prod
   ```

2. Truy cập ứng dụng tại http://localhost:3000

## Hướng Dẫn Chơi Game

### Cờ Caro

1. Đăng ký hoặc đăng nhập vào tài khoản của bạn
2. Điều hướng đến phần Trò Chơi
3. Tạo phòng Cờ Caro mới hoặc tham gia vào phòng hiện có
4. Đợi người chơi khác tham gia nếu bạn đã tạo phòng
5. Thay phiên nhau đặt X hoặc O trên bảng
6. Người chơi đầu tiên tạo được ba dấu liên tiếp (ngang, dọc hoặc chéo) sẽ thắng

### Line 98

1. Đăng ký hoặc đăng nhập vào tài khoản của bạn
2. Điều hướng đến phần Trò Chơi
3. Tạo phòng Line 98 mới hoặc tham gia vào phòng hiện có
4. Làm theo hướng dẫn trong trò chơi để chơi

## Cấu Trúc Dự Án

Dự án tuân theo kiến trúc NestJS tiêu chuẩn:

- `src/` - Mã nguồn
  - `auth/` - Module xác thực
  - `users/` - Quản lý người dùng
  - `games/` - Logic trò chơi
  - `chat/` - Chức năng trò chuyện
- `views/` - Mẫu EJS cho giao diện người dùng
- `db/` - Tệp cơ sở dữ liệu SQLite
- `public/` - Tài nguyên tĩnh

## Cơ Sở Dữ Liệu

Ứng dụng sử dụng SQLite để lưu trữ dữ liệu. Tệp cơ sở dữ liệu được đặt tại `game-server/db/game_server.sqlite`.

## Kiểm Thử

Chạy kiểm thử với:
```
npm run test
```

Chạy kiểm thử end-to-end:
```
npm run test:e2e
```

## Giấy Phép

Dự án này được cấp phép theo Giấy Phép MIT. 