# 🛍️ Fashion Shopping System (FSS)

> **Đồ án tốt nghiệp** — Xây dựng hệ thống bán hàng thời trang trên nền tảng web, hỗ trợ tìm kiếm sản phẩm tương đồng dựa trên thị giác máy tính.

**Sinh viên:** Nguyễn Tiến Đạt — MSSV: 2251161966 — Lớp: 64HTTT4

---

## 📋 Mục lục

- [Tổng quan](#-tổng-quan)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Hướng dẫn cài đặt và chạy](#-hướng-dẫn-cài-đặt-và-chạy)
  - [Cách 1: Chạy từng service riêng (Development)](#cách-1-chạy-từng-service-riêng-development)
  - [Cách 2: Chạy bằng Docker Compose (Production)](#cách-2-chạy-bằng-docker-compose-production)
- [Tính năng chính](#-tính-năng-chính)
- [Demo & Tài khoản](#-demo--tài-khoản)

---

## 🎯 Tổng quan

**Fashion Style System (FSS)** là một hệ thống thương mại điện tử chuyên về thời trang, nổi bật với tính năng **tìm kiếm sản phẩm bằng hình ảnh** (Visual Search) sử dụng mô hình học sâu **ResNet50**.

Người dùng có thể tải lên một bức ảnh thời trang bất kỳ, hệ thống sẽ tự động trích xuất đặc trưng thị giác và tìm ra các sản phẩm tương đồng nhất trong cơ sở dữ liệu.

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐     HTTP/REST      ┌─────────────────┐     HTTP/REST      ┌─────────────────┐
│                 │  ◄──────────────►  │                 │  ◄──────────────►  │                 │
│   FSS Frontend  │                    │   FSS Backend   │                    │  FSS AI Service │
│   (React+Vite)  │                    │  (Spring Boot)  │                    │    (FastAPI)    │
│   Port: 5173    │                    │   Port: 8080    │                    │   Port: 8000    │
│                 │                    │                 │                    │                 │
└─────────────────┘                    └────────┬────────┘                    └────────┬────────┘
                                                │                                     │
                                                │ JDBC                                │ ChromaDB
                                                ▼                                     ▼
                                       ┌─────────────────┐                   ┌─────────────────┐
                                       │   PostgreSQL    │                   │  Vector Store   │
                                       │   (Supabase)    │                   │  (ChromaDB)     │
                                       └─────────────────┘                   └─────────────────┘
```

---

## 🛠️ Công nghệ sử dụng

| Thành phần | Công nghệ | Phiên bản |
|---|---|---|
| **Frontend** | React, Vite, Zustand, Tailwind CSS, React Router, Framer Motion | React 19, Vite 6.x, Tailwind v4 |
| **Backend** | Spring Boot, Spring Security, JPA/Hibernate | Spring Boot 3.2.5, Java 17 |
| **AI Service** | FastAPI, PyTorch, ResNet50, ChromaDB | Python 3.11+, PyTorch 2.3 |
| **Database** | PostgreSQL (Supabase Cloud) | PostgreSQL 15 |
| **Authentication** | JWT + Google OAuth2 | — |
| **Payment** | MoMo, PayOS | — |
| **Email** | Gmail SMTP, EmailJS | — |
| **Deployment** | Docker, Vercel (FE), Render (BE) | Docker Compose 3.8 |

### 💻 Chi tiết các thư viện Frontend (`fss-frontend`)

Giao diện người dùng được xây dựng hiện đại, tối ưu hiệu năng và trải nghiệm người dùng với các thư viện chính sau:

- **Thư viện & Công cụ chính:**
  - **React 19 & React DOM:** Thư viện core phát triển giao diện người dùng theo hướng Component-based, tối ưu hóa render.
  - **Vite 6.x:** Công cụ build cực nhanh thay thế cho Webpack truyền thống, hỗ trợ Hot Module Replacement (HMR) tức thì.
- **Quản lý trạng thái & Định tuyến:**
  - **Zustand 5:** Thư viện quản lý global state tối giản, hiệu năng cao thay thế cho Redux. Sử dụng cho Auth, Cart, Wishlist, Toast/Notification, Visual Search và Address.
  - **React Router v7 (`react-router-dom` v7.4.0):** Quản lý định tuyến mạnh mẽ cho cả phân hệ Khách hàng (Customer) và Admin (trang quản trị).
- **Thiết kế & Giao diện (UI/UX):**
  - **Tailwind CSS v4:** Framework CSS tiện ích thế hệ mới, tích hợp plugin `@tailwindcss/vite` biên dịch trực tiếp cực nhanh, tối ưu hóa CSS bundle.
  - **Framer Motion 12:** Thư viện tạo các hiệu ứng chuyển động (animations) và tương tác vi mô (micro-interactions) mượt mà cho nút bấm, modal, danh sách sản phẩm.
  - **Lucide React:** Bộ sưu tập icon SVG hiện đại, nhất quán và nhẹ nhàng.
  - **Recharts 3:** Thư viện hiển thị biểu đồ thống kê doanh thu, đơn hàng, người dùng trực quan trên trang Dashboard Admin.
- **Xử lý logic, API & Dịch vụ tích hợp:**
  - **Axios v1.8.4:** Client HTTP để gọi APIs tới Spring Boot Backend với cơ chế interceptor xử lý token tự động.
  - **@react-oauth/google v0.13.5:** Tích hợp đăng nhập nhanh bằng tài khoản Google (OAuth2).
  - **@emailjs/browser v4.4.1:** Gửi email liên hệ/phản hồi trực tiếp từ giao diện client mà không cần thông qua server riêng.
  - **qrcode.react v4.2.0:** Tạo mã QR thanh toán động cho các giao dịch chuyển khoản VietQR/PayOS và MoMo.
- **Typography & Font chữ:** Tích hợp Google Fonts với các phông chữ **Montserrat** (thiết kế thương mại điện tử hiện đại), **Playfair Display** (tạo điểm nhấn thời trang sang trọng), và **Be Vietnam Pro** (phông sans-serif hiển thị tiếng Việt hoàn hảo).

---

## 📁 Cấu trúc thư mục

```
Web_FSS/
├── fss-frontend/           # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # UI Components (admin, layout, ui)
│   │   ├── pages/          # Pages (admin, auth, customer)
│   │   ├── store/          # State management (Zustand)
│   │   ├── config/         # API configuration
│   │   ├── data/           # Static data & mock data
│   │   ├── router/         # React Router config
│   │   └── locales/        # i18n translations
│   ├── public/             # Static assets (logo, video)
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── nginx.conf
│
├── fss-backend/            # Backend (Spring Boot)
│   ├── src/main/
│   │   ├── java/vn/fss/   # Java source code
│   │   └── resources/      # application.properties
│   ├── pom.xml             # Maven dependencies
│   ├── Dockerfile
│   └── run.ps1             # Auto-setup & run script
│
├── fss-ai-service/         # AI Image Search (FastAPI + ResNet50)
│   ├── main.py             # FastAPI endpoints
│   ├── model.py            # ResNet50 feature extraction
│   ├── indexer.py          # Image indexing pipeline
│   ├── database.py         # Database utilities
│   ├── config.py           # Configuration
│   ├── evaluate.py         # Model evaluation metrics
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile
│   └── setup.ps1           # Auto-setup & run script
│
├── fashion-dataset/        # Product dataset
│   ├── images/             # 1000 product images
│   ├── products_1000.csv   # Product metadata (CSV)
│   └── products_1000.json  # Product metadata (JSON)
│
├── scripts/                # Database scripts & utilities
│   ├── db_setup.sql        # Database schema
│   ├── db_cart_migration.sql
│   ├── db_users_migration.sql
│   ├── seed_reviews.sql
│   └── ...                 # Other utility scripts
│
├── docker-compose.yml      # Docker orchestration
├── package.json            # Root workspace
├── .gitignore
└── README.md               # (File này)
```

---

## 💻 Yêu cầu hệ thống

| Phần mềm | Phiên bản tối thiểu | Ghi chú |
|---|---|---|
| **Node.js** | 18.x trở lên | Cần cho Frontend |
| **Java JDK** | 17 | Tự động tải bởi `run.ps1` |
| **Python** | 3.11+ | Cần cho AI Service |
| **Maven** | 3.9+ | Tự động tải bởi `run.ps1` |
| **Git** | 2.x | Tuỳ chọn |
| **Docker** | 20.x+ | Chỉ cần nếu dùng Docker Compose |

> **Lưu ý:** Backend script `run.ps1` sẽ **tự động tải** JDK 17 và Maven nếu chưa có. Bạn chỉ cần cài sẵn Node.js và Python.

---

## 🚀 Hướng dẫn cài đặt và chạy

### Cách 1: Chạy từng service riêng (Development)

#### 1.1. Cài đặt Frontend

```powershell
cd fss-frontend
npm install
npm run dev
```
→ Frontend chạy tại: **http://localhost:5173**

#### 1.2. Cài đặt Backend (Spring Boot)

```powershell
cd fss-backend
.\run.ps1
```

Script `run.ps1` sẽ tự động:
1. Tải JDK 17 nếu chưa có
2. Thiết lập `JAVA_HOME`
3. Build & chạy Spring Boot

→ Backend API chạy tại: **http://localhost:8080**

#### 1.3. Cài đặt AI Service (Python)

```powershell
cd fss-ai-service
.\setup.ps1
```

Script `setup.ps1` sẽ tự động:
1. Kiểm tra Python
2. Tạo virtual environment
3. Cài đặt dependencies (PyTorch, FastAPI, ChromaDB...)
4. Chạy indexer để index 1000 ảnh vào ChromaDB (lần đầu, mất ~5-15 phút)
5. Khởi động FastAPI server

→ AI Service chạy tại: **http://localhost:8000**
→ API Docs (Swagger): **http://localhost:8000/docs**

#### 1.4. Thứ tự khởi động khuyến nghị

```
1. AI Service  (port 8000)  ← Khởi động trước
2. Backend     (port 8080)  ← Phụ thuộc AI Service
3. Frontend    (port 5173)  ← Phụ thuộc Backend
```

---

### Cách 2: Chạy bằng Docker Compose (Production)

```powershell
# Từ thư mục gốc Web_FSS/
docker-compose up --build
```

Docker sẽ tự động build và chạy cả 3 service:
- Frontend: **http://localhost:5173**
- Backend: **http://localhost:8080**
- AI Service: **http://localhost:8000**

Dừng tất cả:
```powershell
docker-compose down
```

---

## ✨ Tính năng chính

### Khách hàng (Customer)
- 🔍 **Tìm kiếm sản phẩm bằng hình ảnh** (Visual Search) — Tải ảnh lên, AI tìm sản phẩm tương đồng
- 🛒 **Giỏ hàng & Đặt hàng** — Thêm/xoá/cập nhật giỏ hàng, checkout
- 💳 **Thanh toán online** — Tích hợp MoMo và PayOS
- ⭐ **Đánh giá sản phẩm** — Review và xếp hạng sao
- ❤️ **Danh sách yêu thích** (Wishlist)
- 🔐 **Xác thực** — Đăng ký/Đăng nhập bằng email hoặc Google OAuth2
- 📧 **Quên mật khẩu** — Reset qua email OTP
- 👤 **Quản lý hồ sơ** — Cập nhật thông tin cá nhân, địa chỉ giao hàng

### Quản trị viên (Admin)
- 📊 **Dashboard** — Thống kê doanh thu, đơn hàng
- 📦 **Quản lý sản phẩm** — CRUD sản phẩm, upload ảnh
- 📋 **Quản lý đơn hàng** — Xem, cập nhật trạng thái
- 👥 **Quản lý người dùng** — Xem danh sách, phân quyền
- 🎫 **Quản lý voucher** — Tạo mã giảm giá

---

## 🧪 Demo & Tài khoản

### URL Production (nếu còn hoạt động)
- **Frontend:** https://datn-web-fss.vercel.app
- **Backend:** https://datn-webfss.onrender.com

### Tài khoản demo
| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | admin@fss.vn | admin123 |
| Khách hàng | (Đăng ký mới hoặc đăng nhập bằng Google) | — |

> **Lưu ý:** Backend trên Render có thể mất 1-2 phút để "thức dậy" (cold start) nếu không có traffic trong 15 phút.

---

## 📝 Ghi chú kỹ thuật

### Database
- Sử dụng **Supabase** (PostgreSQL managed) — không cần cài PostgreSQL local
- File `fss_backup.sql` có thể dùng để khôi phục database nếu cần
- Các script trong `scripts/` chứa schema và dữ liệu mẫu

### AI Model
- Sử dụng **ResNet50** pre-trained trên ImageNet
- Feature vector: 2048 chiều (output Average Pooling layer)
- Vector database: **ChromaDB** (local persistent storage)
- Lần chạy đầu tiên sẽ tự động download model ResNet50 (~98MB) và index 1000 ảnh

### Bảo mật
- JWT với HS256, thời hạn 15 phút
- Google OAuth2 ID Token verification
- Spring Security CORS configuration
- Password encoding với BCrypt

---

**© 2026 Nguyễn Tiến Đạt — Đồ án tốt nghiệp Hệ thống thông tin**
