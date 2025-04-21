# Báo cáo nghiên cứu Framework NestJS

## 1. Giới thiệu chung
NestJS là một framework Node.js tiên tiến, được xây dựng trên nền tảng TypeScript và sử dụng các mẫu thiết kế (design patterns) đã được chứng minh như Dependency Injection (DI) và Inversion of Control (IoC). NestJS giúp lập trình viên dễ dàng tổ chức, mở rộng và bảo trì ứng dụng server-side theo chuẩn mô hình MVC (Model-View-Controller).

## 2. Các thành phần cơ bản
1. Module
   - Là đơn vị cấu trúc chính của ứng dụng NestJS.
   - Định nghĩa phạm vi (scope) và quản lý các thành phần liên quan.
2. Controller
   - Chịu trách nhiệm xử lý HTTP request và trả về response.
   - Được đánh dấu bằng decorator `@Controller()`.
3. Provider (Service)
   - Chứa logic nghiệp vụ, tái sử dụng được.
   - Được đánh dấu bằng `@Injectable()` để có thể inject vào Controller hoặc các Provider khác.
4. Dependency Injection (DI)
   - NestJS tự động cung cấp và quản lý vòng đời các Provider.
5. Middleware
   - Xử lý request trước khi đi vào Controller.
6. Pipe
   - Chuyển đổi và validate dữ liệu incoming (DTO).
7. Guard
   - Kiểm soát quyền truy cập (authorization).
8. Interceptor
   - Can thiệp vào luồng xử lý (logging, transform response, cache).
9. Exception Filter
   - Bắt và xử lý lỗi toàn cục hoặc theo controller.

## 3. Các công nghệ chính được cung cấp sẵn
- ORM & ODM: TypeORM, Sequelize, Mongoose (MongoDB).
- GraphQL: `@nestjs/graphql` tích hợp Apollo Server.
- WebSockets: `@nestjs/websockets` tích hợp socket.io hoặc ws.
- Microservices: TCP, Redis, NATS, MQTT, gRPC.
- Validation: `class-validator` & `class-transformer` qua Pipes.
- Config Module: Quản lý biến môi trường.
- CLI: Tự động sinh code module, controller, service.

## 4. Triển khai mẫu theo chuẩn MVC
1. Cấu trúc thư mục:
```
src/
├── app.module.ts
├── main.ts
├── modules/
│   └── todos/
│       ├── dto/
│       │   ├── create-todo.dto.ts
│       │   └── update-todo.dto.ts
│       ├── entities/
│       │   └── todo.entity.ts
│       ├── todos.controller.ts
│       ├── todos.service.ts
│       └── todos.module.ts
└── common/
    ├── filters/
    ├── guards/
    └── pipes/
```
2. Khởi tạo dự án:
```bash
nest new my-app
```
3. Ví dụ Todo Module:
   - `todos.module.ts`:
     ```ts
     @Module({
       imports: [TypeOrmModule.forFeature([Todo])],
       controllers: [TodosController],
       providers: [TodosService],
     })
     export class TodosModule {}
     ```
   - `todo.entity.ts`:
     ```ts
     @Entity()
     export class Todo {
       @PrimaryGeneratedColumn() id: number;
       @Column() title: string;
       @Column({ default: false }) completed: boolean;
     }
     ```
   - `todos.service.ts`:
     ```ts
     @Injectable()
     export class TodosService {
       constructor(@InjectRepository(Todo) private repo: Repository<Todo>) {}

       findAll(): Promise<Todo[]> { return this.repo.find(); }
       findOne(id: number): Promise<Todo> { return this.repo.findOneBy({ id }); }
       create(data: CreateTodoDto): Promise<Todo> { return this.repo.save(data); }
       update(id: number, data: UpdateTodoDto) { return this.repo.update(id, data); }
       remove(id: number) { return this.repo.delete(id); }
     }
     ```

## 5. Kết luận
NestJS là framework mạnh mẽ, mô-đun hoá cao, hỗ trợ nhiều tính năng sẵn có như MVC, DI, ORM, GraphQL, hỗ trợ đa nền tảng và là lựa chọn tuyệt vời để xây dựng các ứng dụng server-side phức tạp, có khả năng mở rộng cao. 