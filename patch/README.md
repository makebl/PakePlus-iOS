# PakePlus-iOS 定制补丁 v1.0

本目录存放所有定制修改。同步上游后会自动应用这些补丁。

## 文件清单

| 文件 | 用途 |
|------|------|
| custom.js | 链接跳转 + 下拉刷新 + 邮箱卡片强制显示 + Bootstrap 布局修复 |
| ppconfig.json | iOS 配置：URL/名称/BundleID/全屏/安全区/相机/相册/缓存禁用 |
| ppworker.cjs | 读 clearCache 字段，写入 Info.plist 的 CLEARCACHE |
| WebView.swift | 清缓存实现 + reloadIgnoringLocalCacheData |

## 工作原理

1. 同步上游（手动或自动 workflow）
2. patch-apply.yml 自动执行：
   - 复制 patch/* 到对应位置
   - 提交 commit
3. 定制修改全部保留

## 修改流程

修改补丁文件：
1. 编辑 patch/ 下的文件
2. 提交：git add patch/ && git commit -m "update patch"
3. 下次编译时自动应用

同步上游：
1. 本地：git fetch upstream && git merge upstream/main
2. 或触发 patch-apply.yml workflow
3. 冲突时只解决非 patch 文件的冲突
