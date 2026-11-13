# E2E 测试

基于 Playwright，覆盖 Chromium / Firefox / WebKit 三个内核，各有桌面与手机视口，共 6 个项目。

## 覆盖范围

| 用例         | 断言内容                                                                             |
| ------------ | ------------------------------------------------------------------------------------ |
| 登录与首页   | mock OIDC 自动登录、导航标题、三个快捷入口、分组列表                                 |
| 响应式排布   | 桌面三列 / 手机单列、页面无横向溢出                                                  |
| 分组页       | 订阅与共享账号标签切换、二维码对话框生成图片                                         |
| 融合订阅     | 输入 UUID 后生成 `/api/subscribe/?token=…` 链接                                      |
| 管理员编辑页 | 默认分组设置标签、订阅标签懒加载、搜索空状态、双击行内编辑、Esc 取消、手机端隐藏表头 |

用例只读，不会修改后端数据。

## 前置条件

1. MySQL、Redis 已启动。
2. 后端运行在 `http://127.0.0.1:8000`，且已完成 OIDC 配置；本地可用 mock OIDC（`http://127.0.0.1:9000`）。
3. 数据库中有至少一个当前用户可访问的分组；如需覆盖编辑页用例，该分组还需有订阅。
4. 必须先访问 `http://127.0.0.1:5173`，不要用 `localhost`：本机 `localhost` 可能被其他项目占用，且 OIDC 回调与 `CSRF_TRUSTED_ORIGINS` 按该地址配置。

Vite 由 Playwright 自动启动（本地 `dev`，CI 构建后 `preview`）；若 5173 已有本项目的服务则直接复用。

## 运行

```bash
# 首次安装三个内核
pnpm exec playwright install chromium firefox webkit

# 全部 6 个项目（36 个用例）
pnpm test:e2e

# 只跑某个项目
pnpm test:e2e --project=chromium-desktop
pnpm test:e2e --project=webkit-mobile

# 交互式调试
pnpm test:e2e --ui
```

失败时会在 `test-results/` 保留 trace，可用 `pnpm exec playwright show-trace <文件>` 查看。

## 说明

- 本地走 HTTP。后端 `SESSION_COOKIE_SECURE` 现在由 `DEBUG` 决定（`settings.py`），因为 WebKit 不会像 Chrome / Firefox 那样对 `127.0.0.1` 放行 Secure Cookie；生产环境 `DEBUG=false` 时仍为 `True`。
- CI 使用 `4173` 端口的 preview 服务，Playwright 会先执行 `build-only`。后端仍需由流水线提前启动。
