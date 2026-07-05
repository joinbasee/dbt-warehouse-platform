# -*- coding: utf-8 -*-
"""部署产品页到服务器 - 修复版"""
import paramiko, base64, os

HOST = '47.243.148.105'
USER = 'root'
PASS = '@!@#MNBqwe122500'
LOCAL_HTML = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'output', 'product_intro.html')

def run(ssh, cmd, timeout=30):
    print(f"\n>>> {cmd[:120]}...")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(out[:600])
    if err: print('ERR:', err[:300])
    return out, err

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=15)
print("已连接")

# 1. 创建 nginx 用户
print("\n[1] 创建 nginx 用户...")
run(ssh, 'id nginx 2>&1 || useradd -r -s /sbin/nologin nginx')

# 2. 找到 aa_nginx 配置目录
print("\n[2] 查找 nginx 配置路径...")
out, _ = run(ssh, 'ls /etc/aa_nginx/ 2>&1')
# 用 include 方式加载我们的配置
out2, _ = run(ssh, 'grep -n include /etc/aa_nginx/aa_nginx.conf 2>&1')

# 3. 创建 conf.d 目录并写入配置
print("\n[3] 配置站点...")
run(ssh, 'mkdir -p /etc/aa_nginx/conf.d')

nginx_conf = """server {
    listen 80;
    server_name _;
    root /www/wwwroot/product;
    index index.html;
    charset utf-8;
    location / {
        try_files $uri $uri/ =404;
    }
}
"""
conf_b64 = base64.b64encode(nginx_conf.encode()).decode()
run(ssh, f'echo {conf_b64} | base64 -d > /etc/aa_nginx/conf.d/product.conf')

# 4. 确保主配置 include conf.d
# 检查是否已经有 include
main_conf = '/etc/aa_nginx/aa_nginx.conf'
out, _ = run(ssh, f'grep "conf.d" {main_conf} 2>&1')
if 'conf.d' not in out:
    # 在 http 块末尾前插入 include
    run(ssh, f"""sed -i '/^http *{{/a\\    include /etc/aa_nginx/conf.d/*.conf;' {main_conf}""")

# 5. 创建 systemd service
print("\n[4] 创建 systemd 服务...")
service = """[Unit]
Description=AA Nginx
After=network.target

[Service]
Type=forking
ExecStart=/usr/sbin/aa_nginx
ExecReload=/usr/sbin/aa_nginx -s reload
ExecStop=/usr/sbin/aa_nginx -s quit
PIDFile=/var/run/aa_nginx.pid
Restart=on-failure

[Install]
WantedBy=multi-user.target
"""
svc_b64 = base64.b64encode(service.encode()).decode()
run(ssh, f'echo {svc_b64} | base64 -d > /etc/systemd/system/aa_nginx.service')
run(ssh, 'mkdir -p /var/log/nginx')
run(ssh, 'systemctl daemon-reload')

# 6. 创建 PID 和日志目录
run(ssh, 'mkdir -p /var/run /var/log/nginx')
run(ssh, 'touch /var/run/aa_nginx.pid')

# 7. 测试配置
print("\n[5] 测试 nginx 配置...")
run(ssh, '/usr/sbin/aa_nginx -t 2>&1')

# 8. 打开端口
print("\n[6] 开放 80 端口...")
run(ssh, 'iptables -I INPUT -p tcp --dport 80 -j ACCEPT 2>&1 || true')
# 阿里云安全组还需要在控制台开放，这里先不管

# 9. 启动 nginx（直接启动，不用 systemd）
print("\n[7] 启动 Nginx...")
run(ssh, 'pkill aa_nginx 2>&1 || true')
run(ssh, '/usr/sbin/aa_nginx 2>&1')

# 10. 验证
print("\n[8] 验证...")
import time; time.sleep(1)
run(ssh, "curl -s -o /dev/null -w 'HTTP: %{http_code} | Size: %{size_download} bytes\n' http://localhost")
run(ssh, 'ps aux | grep nginx | grep -v grep')

ssh.close()
print(f"\n部署完成! 访问 http://{HOST}")
print("注意: 如果无法访问，请检查阿里云安全组是否开放 80 端口")
