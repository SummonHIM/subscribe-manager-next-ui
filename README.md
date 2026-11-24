# subscribe-manager-next-ui

[SubscribeManagerNext](../..) 的 Web 前端：管理分组、订阅、共享账号与令牌，并把多个订阅令牌
融合成一个链接。后端仓库：[SummonHIM/SubscribeManagerNext](https://github.com/SummonHIM/SubscribeManagerNext)。

登录完全交给后端的 OIDC，前端不保存任何凭据。

## 功能

- **首页** —— 分组列表与快捷入口，未登录时由 OIDC 自动跳转。
- **分组页** —— 订阅与共享账号两个标签；订阅可在组内调整顺序，共享账号的密码默认遮罩显示。
- **融合订阅** —— 选择多个令牌后生成一条 `/api/subscribe/?token=a|b` 链接，并提供二维码。
- **订阅转换** —— 表单化的转换选项（后端、目标格式、过滤、重命名等），后端会校验允许的
  后端主机，前端只负责收集参数。
- **管理员表格** —— 双击行内编辑、Esc 取消、列搜索、移动端隐藏次要表头。
- **外观与适配** —— 深浅色主题，桌面三列 / 手机单列的响应式排布。

## 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Vue 3 + TypeScript + Vite |
| 路由 | vue-router + `vite-plugin-pages`（`src/views` 文件路由） |
| 状态 | Pinia（`application` / `groups` / `converter` / `appearance`） |
| 组件 | PrimeVue（自动导入）+ Tailwind CSS v4 |
| 反馈 | NProgress 路由进度、PrimeVue Toast / Message |
| 质量 | Vitest、Playwright、ESLint、Prettier、`vue-tsc` 类型检查 |

## 快速开始

需要 Node 与 pnpm，以及一个已经跑起来的后端。

```bash
pnpm install
cp .env.example .env
pnpm dev
```

开发服务器会把 `/api`、`/admin`、`/oidc` 代理到 `http://127.0.0.1:8000`。

> 请用 `http://127.0.0.1:5173` 打开，**不要用 `localhost`**。OIDC 回调地址与后端的
> `CSRF_TRUSTED_ORIGINS` 是按这个地址配置的，而且本机的 `localhost` 常常被其它服务占用。

## 环境变量

见 [`.env.example`](.env.example)。这些值在构建时被内联进产物，属于公开配置，不要在这里
放任何密钥。

| 变量 | 说明 |
| --- | --- |
| `VITE_CONVERTER_DEFAULT_BACKEND_HOST` | 转换页默认填写的后端地址 |
| `VITE_CONVERTER_ALLOWED_BACKEND_HOSTS` | 允许出现的主机白名单，逗号分隔；与后端的校验保持一致 |

## 测试

```bash
pnpm test:unit     # Vitest
pnpm test:e2e      # Playwright，Chromium / Firefox / WebKit × 桌面与手机，共 6 个项目
pnpm type-check    # vue-tsc
pnpm lint          # ESLint
```

E2E 覆盖登录、响应式排布、分组页标签切换、二维码生成、融合订阅链接、管理员行内编辑等路径，
用例只读，不会改动后端数据。前置条件和排除项见 [`e2e/README.md`](e2e/README.md)。

## 构建与部署

```bash
pnpm build         # 产物在 dist/
pnpm preview       # 本地预览构建结果
```

`dist/` 是纯静态文件，但**必须与后端同源**（或把 `/api`、`/oidc`、`/admin` 反向代理到后端）。
会话使用 cookie，CSRF 也按 origin 校验，跨域直连后端会因为 Cookie 策略失败。

## 目录结构

```
src/
├── views/          # 文件路由（vite-plugin-pages 自动生成）
├── components/     # 表格、编辑器、表单等可复用组件
├── stores/         # Pinia：应用状态、分组、转换选项、外观
├── composables/    # 组合式函数
├── converter.ts    # 转换选项的默认值与校验
└── locale.ts       # 界面文案
e2e/                # Playwright 用例与说明
```

## License

MIT，见 [LICENSE](LICENSE)。
