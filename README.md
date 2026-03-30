# Cổng đặt hàng sỉ — Đồ chơi Tín Phát

Web app cho đại lý đặt hàng sỉ. Stack: **Next.js 14 · TypeScript · Tailwind CSS · Lark Base API**

---

## Yêu cầu

- Node.js 18+
- Tài khoản Lark / Lark Base với app đã tạo
- Vercel (hoặc bất kỳ Node.js hosting)

---

## Cấu trúc Lark Base

Cần 4 bảng trong cùng 1 Base (`LARK_APP_TOKEN`):

| Bảng | Env var | Mô tả |
|---|---|---|
| Phiên bản SP | `LARK_TABLE_PRODUCTS` | Catalog sản phẩm (đã có sẵn) |
| Đại lý | `LARK_TABLE_USERS` | Tài khoản đại lý |
| Đơn hàng | `LARK_TABLE_ORDERS` | Đơn đặt hàng |
| Chi tiết đơn | `LARK_TABLE_ORDER_ITEMS` | Dòng sản phẩm trong đơn |

Các cột sẽ được **tạo tự động** qua lệnh setup (xem bên dưới).

---

## Bước 1 — Clone & cài đặt

```bash
git clone https://github.com/trieulong1199/dochoitinphat.github.io.git
cd dochoitinphat.github.io
npm install
```

---

## Bước 2 — Tạo file `.env.local`

Sao chép từ mẫu rồi điền thông tin thật:

```bash
cp .env.example .env.local
```

Nội dung cần điền:

```env
# NextAuth
NEXTAUTH_SECRET=<random 32 ký tự>   # openssl rand -base64 32
NEXTAUTH_URL=https://daily.dochoitinphat.com

# Lark Base
LARK_APP_ID=cli_xxxxxxxxxxxxxxxx
LARK_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LARK_APP_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
LARK_BASE_URL=https://open.larksuite.com

# Lark Tables
LARK_TABLE_PRODUCTS=tbllVb4meuAjkx1G
LARK_TABLE_USERS=tblckmLenaZoheTR
LARK_TABLE_ORDERS=tblGVAO56iUIFunO
LARK_TABLE_ORDER_ITEMS=tblatHPphzSlFPp7

# Admin
ADMIN_SECRET=<mật khẩu admin tự đặt>
```

> **Lấy NEXTAUTH_SECRET:**
> ```bash
> openssl rand -base64 32
> ```

---

## Bước 3 — Khởi tạo cột trong Lark Base

Chạy script để **tự động tạo** tất cả cột còn thiếu:

```bash
npm run setup:lark
```

Output mẫu:
```
📋 users (tblckmLenaZoheTR)
   Cột hiện có: Tiêu đề
   ⚠️  Thiếu: username, password, companyName, phone, isActive
   ✅ Đã tạo: username
   ✅ Đã tạo: password
   ...

📋 orders (tblGVAO56iUIFunO)
   ...

✅ Hoàn tất setup!
```

---

## Bước 4 — Tạo tài khoản đại lý đầu tiên

```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: YOUR_ADMIN_SECRET" \
  -d '{
    "username": "dailyabc",
    "password": "matkhau123",
    "companyName": "Đại lý ABC",
    "phone": "0901234567"
  }'
```

---

## Bước 5 — Chạy dev

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) → redirect đến `/login`.

---

## Deploy lên Vercel

### Cách 1 — Vercel CLI

```bash
npm i -g vercel
vercel --prod
```

Vercel sẽ hỏi từng biến môi trường.

### Cách 2 — GitHub Integration

1. Push code lên GitHub
2. Vào [vercel.com](https://vercel.com) → Import repository
3. Thêm tất cả biến trong `.env.local` vào **Settings → Environment Variables**
4. Deploy

### Sau khi deploy — chạy setup trên server

```bash
curl -X POST https://daily.dochoitinphat.com/api/admin/setup \
  -H "x-admin-secret: YOUR_ADMIN_SECRET"
```

---

## Cấu trúc code

```
app/
  (auth)/login/          # Trang đăng nhập
  (portal)/              # Tất cả trang cần đăng nhập
    layout.tsx           # Navbar + auth guard
    products/            # Danh sách sản phẩm
    orders/              # Lịch sử đơn hàng
  api/
    auth/                # NextAuth handler
    products/            # GET sản phẩm từ Lark (cache 10 phút)
    orders/              # POST tạo đơn, GET lịch sử
    orders/[id]/pdf/     # Xuất PDF đơn hàng
    images/[recordId]/   # Proxy ảnh Lark (tránh tmp_url hết hạn)
    admin/users/         # Tạo tài khoản đại lý
    admin/setup/         # Khởi tạo cột Lark Base

lib/lark/
  client.ts              # Lark SDK + field constants
  products.ts            # Query bảng sản phẩm
  users.ts               # CRUD bảng đại lý
  orders.ts              # CRUD bảng đơn hàng + chi tiết

store/
  cart.ts                # Giỏ hàng (Zustand + localStorage)
  toast.ts               # Thông báo toast
```

---

## Thêm/sửa đại lý

Tài khoản đại lý quản lý **trực tiếp trong Lark Base** (bảng Đại lý):
- Sửa `companyName`, `phone` → thay đổi ngay
- Tắt `isActive = false` → tài khoản bị khoá ngay lập tức
- **Đổi mật khẩu**: phải dùng API (vì password là bcrypt hash)

```bash
# Đổi mật khẩu qua API (tạo user mới cùng username sẽ bị lỗi 409)
# → Cần xoá record cũ trong Lark rồi tạo lại
curl -X POST https://daily.dochoitinphat.com/api/admin/users \
  -H "x-admin-secret: YOUR_ADMIN_SECRET" \
  -d '{"username":"dailyabc","password":"matkhaumoi","companyName":"Đại lý ABC"}'
```
