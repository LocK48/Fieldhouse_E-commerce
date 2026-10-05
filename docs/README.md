# Fieldhouse

Fieldhouse là đồ án marketplace đồ thể thao full-stack. Khách hàng có thể tìm và mua sản phẩm bằng hình thức COD, liên hệ với cửa hàng hoặc CSKH. Người bán quản lý cửa hàng, sản phẩm, đơn hàng và xác nhận thanh toán. Admin duyệt người bán/cửa hàng/sản phẩm và xử lý trạng thái giao hàng.

**English documentation:** [README.md](../README.md)

## Tính năng

- Danh mục sản phẩm có tìm kiếm, lọc danh mục, sắp xếp, phân trang và trang chi tiết.
- Tài khoản khách hàng: đăng ký bằng OTP email, đăng nhập, hồ sơ, sổ địa chỉ, giỏ hàng và wishlist.
- Thanh toán COD, xem/hủy đơn hàng và đánh giá sản phẩm sau khi giao.
- Kênh người bán quản lý cửa hàng, sản phẩm, đơn hàng và xác nhận COD sau khi giao hàng.
- Admin duyệt hồ sơ người bán, cửa hàng, sản phẩm và cập nhật trạng thái xử lý đơn hàng.
- Chat realtime giữa khách hàng, seller và admin bằng Socket.IO.
- Upload ảnh lên Cloudflare R2 bằng presigned URL có thời hạn ngắn.

## Công nghệ

| Phần          | Công nghệ                                                     |
| ------------- | ------------------------------------------------------------- |
| Frontend      | React, Vite, React Router, Zustand, Tailwind CSS và CSS riêng |
| Backend       | Node.js, Express 5, Socket.IO                                 |
| Cơ sở dữ liệu | MongoDB, Mongoose                                             |
| Xác thực      | JWT access/refresh token, phân quyền theo role, email OTP     |
| Lưu ảnh       | Cloudflare R2, API tương thích S3                             |
| Đóng gói      | Docker, Docker Compose, Nginx                                 |

## Cấu trúc repo

```text
client/                 Giao diện khách hàng, seller và admin
  src/api/               Các hàm gọi API
  src/components/        Component dùng chung, sản phẩm, layout và chat
  src/pages/             Các trang theo chức năng
  src/routes/            Đường dẫn và cấu hình route
  src/store/             State thương mại bằng Zustand
server/                 Express API và Socket.IO
  src/config/             Cấu hình database
  src/controllers/        HTTP controllers
  src/middlewares/        Xác thực, phân quyền và validation
  src/models/             Mongoose models
  src/routes/             REST API routes
  src/services/           Business logic và tích hợp dịch vụ
  src/socket/             Sự kiện chat realtime
dataset/                 Ảnh sản phẩm và script đồng bộ MongoDB/R2
docs/                    Tài liệu dự án
docker-compose.yml       Môi trường chạy nhiều container
```

## Yêu cầu

- Node.js 22.12 trở lên; khuyến nghị Node.js 22 LTS.
- npm.
- MongoDB local hoặc hosted. Đặt hàng/hủy đơn dùng transaction nên MongoDB cần chạy replica set; MongoDB Atlas đã hỗ trợ sẵn.
- Thông tin SMTP để gửi OTP đăng ký.
- Cloudflare R2 và public domain của bucket để upload ảnh.
- Docker Engine/Desktop kèm Compose plugin nếu chạy bằng container.

## Chạy local

### 1. Cấu hình API

Sao chép file cấu hình mẫu:

```sh
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

Điền `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` vào `server/.env`. Dùng secret riêng, có độ ngẫu nhiên cao cho JWT và `OTP_HASH_SECRET`.

Cấu hình SMTP để bật đăng ký OTP qua email:

```dotenv
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
OTP_HASH_SECRET=
```

Các biến sau cần thiết khi upload ảnh. `R2_PUBLIC_URL` là public custom domain của bucket, không phải địa chỉ S3 API riêng tư:

```dotenv
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

`CLIENT_URL` phải là origin của frontend. Mặc định local là `http://localhost:5173`.

### 2. Chạy backend

Khởi động MongoDB và cấu hình connection string trong `server/.env` (ví dụ `mongodb://127.0.0.1:27017/fieldhouse` nếu MongoDB local đã cấu hình replica set).

```sh
cd server
npm install
npm run dev
```

API mặc định chạy ở `http://localhost:5000`. Kiểm tra `http://localhost:5000/api/v1/health`.

### 3. Chạy frontend

Mở terminal khác:

```sh
cd client
npm install
npm run dev
```

Mở địa chỉ Vite in ra terminal. API mặc định là `http://localhost:5000/api/v1`; đổi bằng `VITE_API_URL` trong `client/.env.local` nếu cần.

## Dữ liệu demo

Bộ ảnh sản phẩm nằm trong `dataset/img`. Script tạo dữ liệu sản phẩm và đồng bộ ảnh lên MongoDB, Cloudflare R2. Xem [dataset/README.md](../dataset/README.md) trước khi chạy. Cần cài dependencies của server và cấu hình MongoDB/R2 trong `server/.env`.

Quá trình đồng bộ dataset tạo các tài khoản demo sau, cùng mật khẩu `Password123!`:

| Role   | Email                     |
| ------ | ------------------------- |
| Admin  | `admin@fieldhouse.local`  |
| Seller | `nike@fieldhouse.local`   |
| Seller | `adidas@fieldhouse.local` |

Dataset có thêm 10 tài khoản người dùng tổng hợp dùng mật khẩu `DatasetTest123!`. Hồ sơ hiện có và quyền sở hữu của seller được giữ nguyên. Chỉ dùng các tài khoản này khi phát triển local; không chạy seed hoặc dùng thông tin demo trên môi trường công khai.

## Docker Compose

Compose khởi động MongoDB, API và frontend tĩnh. Nginx của frontend proxy API và Socket.IO tới backend trong mạng nội bộ. MongoDB không mở cổng ra host; dữ liệu lưu trong volume `mongo_data`.

1. Sao chép `docker.env.example` thành `.env`.
2. Thay password MongoDB và toàn bộ JWT/OTP secret bằng giá trị ngẫu nhiên, riêng biệt. Password MongoDB nên chỉ dùng chữ và số vì Compose ghép nó vào MongoDB URI.
3. Đặt `CLIENT_URL` thành đúng origin public. Cấu hình SMTP và R2 nếu cần OTP email và upload ảnh.
4. Chạy ở thư mục gốc repo:

   ```sh
   docker compose up --build -d
   ```

Website mặc định ở `http://localhost:8080`; đổi port host bằng `APP_PORT` trong `.env`. Compose không tự nạp dữ liệu demo.

MongoDB trong Compose hiện chạy standalone. Checkout và hủy đơn COD dùng transaction nên cần MongoDB replica set; hãy dùng MongoDB Atlas hoặc cấu hình MongoDB local thành replica set để kiểm tra đầy đủ luồng đặt hàng.

`docker compose down` dừng container nhưng giữ database volume. `docker compose down -v` sẽ xóa cả dữ liệu MongoDB. Compose phục vụ HTTP; hãy đặt sau reverse proxy có TLS trước khi dùng domain public.

## Pages và quyền truy cập

| Đường dẫn                       | Chức năng                                |
| ------------------------------- | ---------------------------------------- |
| `/`                             | Trang chủ cửa hàng                       |
| `/products`                     | Danh sách/tìm kiếm sản phẩm              |
| `/products/:productId`          | Chi tiết sản phẩm và người bán           |
| `/stores/slug/:slug`            | Trang cửa hàng public                    |
| `/cart`, `/checkout`, `/orders` | Giỏ hàng, thanh toán COD, đơn hàng khách |
| `/profile`, `/wishlist`         | Hồ sơ, địa chỉ và sản phẩm yêu thích     |
| `/seller`, `/seller/messages`   | Kênh người bán và chat                   |
| `/admin`, `/admin/messages`     | Kênh admin và hộp thư hỗ trợ             |
| `/login`, `/register`           | Đăng nhập và đăng ký xác thực OTP        |

Sản phẩm mới của seller cần admin duyệt trước khi xuất hiện trên cửa hàng. Admin cập nhật quy trình giao hàng. Sau khi đơn được giao, từng cửa hàng xác nhận phần COD của mình; đơn có nhiều cửa hàng chỉ được đánh dấu đã thanh toán sau khi tất cả cửa hàng xác nhận.

## Tổng quan API

REST API dùng tiền tố `/api/v1`. Endpoint cần đăng nhập nhận header `Authorization: Bearer <accessToken>`, trừ các luồng dùng refresh token.

| Nhóm              | Base path                                    | Chức năng                                                |
| ----------------- | -------------------------------------------- | -------------------------------------------------------- |
| Health            | `/health`                                    | Kiểm tra trạng thái service                              |
| Authentication    | `/auth`                                      | OTP, đăng nhập, refresh, logout, thông tin người dùng    |
| Sản phẩm/danh mục | `/products`, `/categories`                   | Tìm kiếm catalog, chi tiết và quản lý sản phẩm seller    |
| Cửa hàng          | `/stores`                                    | Trang cửa hàng public và hồ sơ cửa hàng seller           |
| Giỏ hàng/đơn hàng | `/cart`, `/orders`                           | Giỏ hàng, COD, lịch sử đơn và xác nhận thanh toán seller |
| Dữ liệu khách     | `/users`, `/users/me/addresses`, `/wishlist` | Hồ sơ, sổ địa chỉ, wishlist                              |
| Đánh giá          | `/reviews`                                   | Đánh giá sản phẩm sau khi nhận hàng                      |
| Chat              | `/chat`                                      | REST cho hội thoại; tin nhắn realtime dùng Socket.IO     |
| Upload/media      | `/uploads`, `/media`                         | Upload R2 qua presigned URL và phục vụ ảnh               |
| Quản trị          | `/admin`                                     | Duyệt seller/cửa hàng/sản phẩm và xử lý đơn              |

Socket.IO chạy cùng origin backend. Server xác thực access token cho socket. Hội thoại khách-seller/CSKH chỉ hiển thị cho participant; hộp thư hỗ trợ tổng thể chỉ dành cho admin.

## Kiểm tra khi phát triển

Chạy từ từng thư mục tương ứng:

```sh
# client/
npm run lint
npm run build

# server/
node --check src/server.js
```

Repo hiện chưa có script test tự động.

## Tài liệu khác

- [English README](../README.md)
- [Dataset và đồng bộ ảnh](../dataset/README.md)
