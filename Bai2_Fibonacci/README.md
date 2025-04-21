# Thuật toán tính số Fibonacci thứ 100

Đây là thuật toán tối ưu để tính số Fibonacci thứ 100 bằng JavaScript.

## Yêu cầu

- Node.js (đã được cài đặt trên máy)

## Cách chạy

1. Mở terminal hoặc command prompt
2. Di chuyển đến thư mục chứa file `fibonacci.js`:
   ```
   cd đường_dẫn_đến_thư_mục/Bai2_Fibonacci
   ```
   hoặc trực tiếp:
   ```
   cd D:\AASC_Round_2\Bai2_Fibonacci
   ```

3. Chạy file với Node.js:
   ```
   node fibonacci.js
   ```

## Kết quả

Chương trình sẽ hiển thị:
- Thời gian thực thi thuật toán (yêu cầu < 0.2ms)
- Giá trị của số Fibonacci thứ 100

## Giải thuật

Thuật toán sử dụng phương pháp đệ quy với memoization và công thức đóng:
- F(2k) = F(k) * (2*F(k+1) - F(k))
- F(2k+1) = F(k+1)^2 + F(k)^2

Độ phức tạp: O(log n) 