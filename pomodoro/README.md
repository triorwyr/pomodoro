# 番茄钟

基于 Electron 的桌面番茄工作法计时器，简洁、置顶、不打扰。

## 功能

- **标准番茄钟周期** — 25 分钟专注 → 5 分钟短休息，每 4 轮触发 15 分钟长休息
- **可调时长** — 支持 15 / 25 / 30 / 45 分钟工作时段
- **系统通知** — 每个阶段结束时弹出原生通知 + 提示音
- **托盘常驻** — 关闭窗口隐藏到系统托盘，后台持续计时
- **始终置顶** — 一键切换，不耽误手头工作
- **键盘快捷键** — 空格 开始/暂停，R 重置
- **番茄统计** — 今日完成计数，每日自动清零

## 安装与启动

```bash
# 安装依赖
npm install

# 启动应用
npm start
```

## 技术栈

- Electron 42
- 原生 HTML / CSS / JS
- Web Audio API（提示音）
- LocalStorage（统计持久化）

## 项目结构

```
pomodoro/
├── main.js              # Electron 主进程
├── preload.js           # 安全桥接
├── package.json
└── renderer/
    ├── index.html       # 主界面
    ├── style.css        # 样式
    └── timer.js         # 计时逻辑
```
