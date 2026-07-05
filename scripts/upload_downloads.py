# -*- coding: utf-8 -*-
"""上传下载文件到服务器"""
import paramiko, os, sys

HOST = '47.243.148.105'
USER = 'root'
PASS = '@!@#MNBqwe122500'

FILES = {
    'dbt-platform-product.zip': r'C:\Users\诗写\Desktop\dbt-platform-product.zip',
    'PEP项目-人教社.zip': r'C:\Users\诗写\Desktop\PEP项目-人教社.zip',
    '奔驰项目.zip': r'C:\Users\诗写\Desktop\奔驰项目.zip',
    '智能数仓平台配置.zip': r'C:\Users\诗写\Desktop\智能数仓平台配置.zip',
}

TARGET_DIR = '/www/wwwroot/product/downloads'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=15)
print("已连接")

# 创建目录
stdin, stdout, stderr = ssh.exec_command(f'mkdir -p {TARGET_DIR}')
print(f"目录已创建: {TARGET_DIR}")

sftp = ssh.open_sftp()

for name, local_path in FILES.items():
    if not os.path.exists(local_path):
        print(f"[SKIP] 文件不存在: {local_path}")
        continue

    size_mb = os.path.getsize(local_path) / (1024*1024)
    remote_path = f'{TARGET_DIR}/{name}'

    # 检查是否已存在且大小一致
    try:
        remote_stat = sftp.stat(remote_path)
        if remote_stat.st_size == os.path.getsize(local_path):
            print(f"[SKIP] {name} ({size_mb:.1f}MB) - 已存在且大小一致")
            continue
    except FileNotFoundError:
        pass

    print(f"[UPLOAD] {name} ({size_mb:.1f}MB)...", end=' ', flush=True)
    sftp.put(local_path, remote_path)
    print("完成")

sftp.close()

# 验证
print("\n验证文件:")
stdin, stdout, stderr = ssh.exec_command(f'ls -lh {TARGET_DIR}/')
print(stdout.read().decode())

ssh.close()
print("上传完成!")
