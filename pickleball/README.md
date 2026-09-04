# Giải Pickleball Đồng Đội — Happy Pickleball Club (09/2026)

Trang thông tin công bố giải đấu. **Hoàn toàn độc lập** với cổng đặt hàng sỉ Đồ chơi Tín Phát
ở thư mục gốc — không dùng chung Next.js, không dùng chung auth, không cần build.

## Nội dung trang

| Mục | Nội dung |
|---|---|
| Hero | Tên giải, giới thiệu ngắn, đếm ngược tới hạn chốt đăng ký 10/09/2026 |
| Thông tin nhanh | 2 buổi thi đấu, địa điểm, hạn đăng ký, lệ phí |
| Thể thức | 5 đội × 4 VĐV, vòng tròn 1 lượt, 4 trận mỗi lượt gặp nhau |
| Cách tính điểm | Nguyên tắc tích lũy + bảng ví dụ minh họa |
| Giải thưởng | 2 giải đồng đội + 9 giải phụ cá nhân kèm tiêu chí |
| Lệ phí & chi phí | Lệ phí 150.000đ/VĐV + bảng dự toán chi phí tổ chức |
| Kỷ luật | Kỷ luật thời gian và kỷ luật thi đấu |
| Lịch thi đấu | Placeholder — công bố sau khi chốt VĐV và chia đội |
| Ban tổ chức | 6 vai trò |

## Chạy thử

```bash
cd pickleball
python3 -m http.server 8080
# mở http://localhost:8080
```

Hoặc mở thẳng `index.html` bằng trình duyệt — không cần server.

## Cấu trúc

```
pickleball/
├── index.html          # Toàn bộ nội dung trang
├── assets/
│   ├── styles.css      # Style (không dùng framework)
│   └── app.js          # Menu mobile + đếm ngược
└── README.md
```

## Cần cập nhật khi có thông tin thực tế

- **Lịch thi đấu**: thay khối `#lich` (hiện là placeholder) bằng bảng lịch chi tiết
  sau khi chốt 20 VĐV và bốc thăm chia 5 đội.
- **Danh sách đội**: chưa đưa lên trang vì danh sách trong bản kế hoạch chỉ là nháp.
- **Đăng ký**: nút CTA hiện trỏ tới mục Ban tổ chức. Nếu có link Google Form / nhóm Zalo,
  sửa `href` của `.btn-primary` trong khối `#dang-ky`.
- **Số giải phụ**: bảng dự toán ghi 7 giải × 50.000đ, trong khi danh sách vinh danh liệt kê
  9 hạng mục — BTC chốt lại con số cuối cùng rồi cập nhật cả hai chỗ cho khớp.
