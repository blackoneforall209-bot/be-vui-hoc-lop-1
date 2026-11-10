# HƯỚNG DẪN XUẤT FILE .APK VÀ GỬI CHO NGƯỜI QUEN DÙNG THỬ (GIAI ĐOẠN 1)

Dự án này đã được cấu hình sẵn toàn bộ mã nguồn, cấu hình quyền Android (`Microphone`, `Internet`, `Storage`) và kịch bản tự động đóng gói file `.apk`.

---

## CÁCH 1: XUẤT FILE .APK MIỄN PHÍ TRÊN ĐÁM MÂY QUA GITHUB (KHÔNG CẦN CÀI MÁY NẶNG) - KHUYÊN DÙNG!
1. Tạo một kho lưu trữ (Repository) mới trên **GitHub** (chọn chế độ Private hoặc Public tùy bạn).
2. Tải toàn bộ các file trong thư mục này lên GitHub (kèm thư mục `.github/workflows/build_apk.yml`).
3. GitHub Actions sẽ **tự động kích hoạt** và biên dịch ra file **`app-debug.apk`** trong vòng 2-3 phút.
4. Bạn vào mục **Actions** trên GitHub ➔ Bấm vào lần build mới nhất ➔ Tải file **`BeVuiHocLop1-Alpha-Debug-APK.zip`** về.
5. Giải nén được file **`app-debug.apk`**, gửi thẳng qua Zalo hoặc Google Drive cho 5–10 người quen cài đặt!

---

## CÁCH 2: XUẤT FILE .APK TRỰC TIẾP TRÊN MÁY TÍNH BẰNG ANDROID STUDIO
Nếu máy tính của bạn đã có Node.js và Android Studio:
1. Mở Terminal / Command Prompt tại thư mục này.
2. Chạy lệnh:
   ```bash
   npm install
   npx cap add android
   npx cap sync android
   npx cap open android
   ```
3. Android Studio sẽ tự động mở dự án. Bấm menu **Build** ➔ **Build Bundle(s) / APK(s)** ➔ **Build APK(s)**.
4. Sau 1 phút, Android Studio sẽ báo hoàn thành và hiển thị đường dẫn đến file `app-debug.apk`.

---

## HƯỚNG DẪN NGƯỜI QUEN CÀI ĐẶT & GỬI BÁO LỖI VỀ CHO BẠN:
1. Khi người quen mở file `.apk` trên điện thoại/máy tính bảng Android, máy sẽ hiện thông báo *"Cho phép cài đặt từ nguồn không xác định"* ➔ Bố mẹ chỉ cần bấm **Bật / Cho phép** là cài đặt xong trong 5 giây.
2. Mỗi khi gặp câu hỏi có đáp án chưa chuẩn, giọng đọc vấp hoặc muốn góp ý:
   - Chạm vào nút **🐞 Báo lỗi** ngay trên câu hỏi (hoặc nút **📝 Góp ý** ở góc trên màn hình).
   - Chạm chọn loại lỗi (VD: *Đáp án sai*, *Giọng đọc vấp*) rồi bấm **💬 Gửi Qua Zalo Cho Tôi**.
   - App sẽ tự động sao chép mã câu hỏi, thông số máy và mở thẳng khung chat Zalo của bạn!
