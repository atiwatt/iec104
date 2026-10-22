# IEC 104 · 电网的共同语言

面向客户交流与技术介绍的中英文互动科普网站：了解 IEC 60870 家族、常见应用与设备，交互观察调度指令、目标功率、实际反馈、远程权限与数据品质。保留直观易懂的讲解，用项目接入思路说明点表、网关转换与反馈验证。

网站已配置为独立的 Cloudflare Worker `atiwatt-iec104-explainer`，目标域名为 `https://104.atiwatt.com`。源码维护在此仓库，实际部署状态以 Cloudflare 项目为准。

## 中英文展示

- 顶部 `中文 / EN` 切换整站语言，包括图中标签、辅助说明、动态状态、拒绝原因、常见问题与参考资料。
- 切换语言保留当前场景、功率目标、模拟实际值、遥测年龄、正在处理的命令与已选内容页签。
- 语言偏好仅保存在当前浏览器的 `localStorage`；浏览器禁止存储时仍能正常切换。
- 可以分享 `/?lang=zh` 或 `/?lang=en`。链接中的语言优先于保存的偏好，首次访问且未选择语言时默认中文。
- 动画与互动需要 JavaScript。未启用 JavaScript 时仍可阅读中文静态说明。

The guide supports Chinese and English throughout the page and interactive demonstration. Use the header language control or share `/?lang=en`. Changing language preserves the current demonstration state. All interactions are browser-only educational simulations, with no live device connection.

## 在 Cloudflare 连接这个 GitHub 仓库

在 Cloudflare 的 Workers & Pages 中创建 Worker，选择从 GitHub 导入本仓库。使用以下构建配置：

| 设置 | 值 |
| --- | --- |
| 仓库 | `wudifeixue/iec104-explainer` |
| 分支 | `main` |
| 根目录 | `/`（仓库根目录） |
| 构建命令 | `npm test`（包含构建和全部检查） |
| 部署命令 | `npx wrangler deploy` |
| Worker 名称 | `atiwatt-iec104-explainer` |

这是 **Workers 项目**，不用填写 Pages 的输出目录。`wrangler.jsonc` 已包含 `104.atiwatt.com` 的 Custom Domain 配置；在管理 `atiwatt.com` 的 Cloudflare 账户中部署，成功后核对域名绑定和 HTTPS。若已存在同名 DNS 记录，先确认其用途再处理冲突。

无需设置业务环境变量、数据库、HA 令牌或 MQTT 凭据。构建环境使用 Node.js 20+；Wrangler 所需 Cloudflare 权限由平台的 Git 部署集成管理。

## 范围

所有交互均为浏览器内的教学动画和数值模拟。网页没有 IEC 104 协议连接，不连接 HA、MQTT、EMS、现场设备或任何生产系统，不使用这些系统的配置与凭据，也不代表协议一致性或互操作性测试。页面的内容安全策略禁止浏览器发起数据连接。

## 本地开发

需要 Node.js 20 或更新版本；构建与测试没有第三方依赖，无需 `npm install`。

```sh
npm run build
npm test
npm run dev
```

也可直接运行 `node scripts/build.mjs`、`node --test test/*.test.mjs` 和 `node scripts/serve.mjs`。预览地址为 `http://127.0.0.1:4173`，可使用 `PORT` 更改端口；仅监听 loopback。修改资源后重新构建并重启预览。

- `public/`：网页、样式、交互和 SVG 图形。
- `public/i18n.js`：语言选择、偏好保存、语言链接和翻译应用。
- `public/page-copy.js`、`public/simulation-copy.js`：页面与模拟器的中英文文案；新增文案须保持两种语言的键和参数一致。
- `scripts/build.mjs`：将白名单内的 UTF-8 静态文件打包进单一 Worker 模块。
- `scripts/serve.mjs`：通过同一个 Worker 请求处理器提供本地预览。
- `test/worker.test.mjs`：路由、MIME、GET/HEAD、缓存校验、CSP、404 与方法限制测试。
- `test/i18n.test.mjs`：语言优先级、翻译完整性、参数一致性与翻译绑定检查。
- `test/simulation.test.mjs`：语言切换期间的命令处理、数据过期、本地拒绝与恢复回归检查。
- `dist/worker.mjs`：生成的部署产物，不提交版本控制。

构建仅接收 `public/` 下的 `.html`、`.css`、`.js`、`.svg`、`.txt`、`.xml`、`.json` 文件，拒绝隐藏文件、符号链接和其他文件类型，并限制为 48 个文件、每文件 256 KiB、总计 1 MiB。没有数据库、KV、外部数据请求或运行时秘密。

## 部署

先运行构建和测试。通过已经授权的 Cloudflare 插件上传 `dist/worker.mjs`，使用 ES module 主模块、配置文件中对应的兼容日期及设置；然后将 Worker 自定义域绑定到 `104.atiwatt.com`。上传模块本身不需要其他网站源文件或生产系统配置。

若本地已经安装并授权 Wrangler，也可从本目录执行 `wrangler deploy`，它会读取 `wrangler.jsonc` 并重新构建。凭据由 Cloudflare 的授权工具管理，不放入仓库。部署前检查目标域名没有指向其他服务，发布后验证 HTTPS、资源加载与交互。

Worker 将有限大小的资源内嵌在代码中，简化无凭据的插件发布流程；每次资源访问由 Worker 处理。HTML 要求重新校验，其他资源缓存最长 5 分钟，并提供内容 ETag。网站不设置访客账户、Cookie 或浏览器分析脚本；Cloudflare 按平台设置处理请求及运行日志。
