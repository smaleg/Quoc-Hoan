
#!/bin/bash

# --- SCRIPT DEPLOY TỪ NGỮ TẠNG VIỆT vision 1.0 ---
# Host: 160.191.51.55
# Yêu cầu: Đã cài đặt Nginx và Node.js trên VPS

APP_DIR="/var/www/tang-viet-app"
LOG_FILE="/var/log/deploy_tangviet.log"

echo "=== Bắt đầu tiến trình Deploy ===" | tee -a $LOG_FILE

# 1. Tạo thư mục nếu chưa có
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# 2. Cài đặt các công cụ cần thiết (nếu chưa có)
# sudo apt update && sudo apt install -y nginx nodejs npm

# 3. Copy các file vào thư mục public (Ví dụ sử dụng Nginx làm Static Server)
# Giả sử bạn đang chạy script này từ root dự án
cp index.html $APP_DIR/
cp index.tsx $APP_DIR/
cp geminiService.ts $APP_DIR/
cp types.ts $APP_DIR/
cp App.tsx $APP_DIR/
cp metadata.json $APP_DIR/

# 4. Cấu hình Nginx (Mẫu cơ bản)
cat <<EOF | sudo tee /etc/nginx/sites-available/tang-viet
server {
    listen 80;
    server_name 160.191.51.55;

    root $APP_DIR;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cấu hình bảo mật và headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
}
EOF

# 5. Kích hoạt site và restart Nginx
sudo ln -sf /etc/nginx/sites-available/tang-viet /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

echo "=== Deploy Hoàn tất tại: http://160.191.51.55 ===" | tee -a $LOG_FILE
