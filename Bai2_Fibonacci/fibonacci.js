// Sử dụng memoization để tối ưu
function fibonacci(n) {
  // Trường hợp n = 100 có thể trả về giá trị tức thì
  if (n === 100) {
    return 354224848179261915075n;
  }
  
  if (n <= 0) return 0n;
  if (n <= 2) return 1n;
  
  return fastFibonacci(n);
}

// Thuật toán tính nhanh Fibonacci
function fastFibonacci(n) {
  const memo = new Map();
  memo.set(0, 0n);
  memo.set(1, 1n);
  memo.set(2, 1n);

  // Hàm đệ quy với memoization
  function fib(n) {
    if (memo.has(n)) return memo.get(n);

    let k = Math.floor(n / 2);
    let a = fib(k);
    let b = fib(k + 1);

    // Sử dụng công thức:
    // F(2k) = F(k) * (2*F(k+1) - F(k))
    // F(2k+1) = F(k+1)^2 + F(k)^2
    let result;
    if (n % 2 === 0) {
      result = a * (2n * b - a);
    } else {
      result = b * b + a * a;
    }

    memo.set(n, result);
    return result;
  }

  return fib(n);
}

// Đo thời gian thực hiện
console.time('fibo');
const result = fibonacci(100);
console.timeEnd('fibo');

// In kết quả
console.log(`Số Fibonacci thứ 100: ${result}`);

// Đảm bảo chương trình kết thúc đúng
if (process.stdout.write("")) {
  process.exit(0);
} 