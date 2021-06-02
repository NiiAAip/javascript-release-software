# Release Software docker action
这是一个自用的 GitHub 容器操作，只可参考；主要功能用于发布软件，主要分为分为两步：
1.使用阿里云 OSS 命令行工具推送固件到 OSS 上
2.将软件发布信息推送到 OTA 服务器上

## 输入参数
### `args`
**Required** 固件文件名，请保证固件在工作目录的根目录.

### `ota_software_token`
**Required** 固件唯一 Token，类似UUID，请在 OTA 服务上获取.

### `ota_server_url`
**Required** OTA 服务器地址.

### `ota_server_user`
**Required** OTA 服务器用户名.

### `ota_server_pwd`
**Required** OTA 服务器密码.

### `aliyun_oss_url`
**Required** OSS 目标地址.

### `aliyun_oss_endpoint`
**Required** OSS 节点.

### `aliyun_access_id`
**Required** OSS access-key-id.

### `aliyun_access_secret`
**Required** OSS access-key-secret.

## Example usage
```
steps:
    - uses: niiaaip/release-software@main
    with:
        args: test_v1.1.1.bin
        aliyun_oss_endpoint: ${{ secrets.ALIYUN_OSS_ENDPOINT }}
        aliyun_access_id: ${{ secrets.ALIYUN_ACCESS_ID }}
        aliyun_access_secret: ${{ secrets.ALIYUN_ACCESS_SECRET }}
        aliyun_oss_url: ${{ secrets.ALIYUN_OSS_URL }}
        ota_server_url: ${{ secrets.OTA_SERVER_URL }}
        ota_server_user: ${{ secrets.OTA_SERVER_USER }}
        ota_server_pwd: ${{ secrets.OTA_SERVER_PWD }}
        ota_software_token: ${{ secrets.OTA_SOFTWARE_TOKEN }}
```
