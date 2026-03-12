# 终末武器小助手 (Endfield-Weapon)

基于 **Taro + React** 开发的《明日方舟：终末地》武器与装备词条查询/筛选微信小程序。

## 📖 项目简介

在游玩《明日方舟：终末地》时，面对繁杂的基质词条，玩家常常不知道该保留哪些，或者手里的词条适合配什么武器。为了解决配装时的“来回切屏查Wiki”的痛点，开发了这款纯净的本地查询小工具。

本项目采用**完全本地静态化**的数据读取方案（JSON + 本地图片），无需额外部署后端服务器，克隆即跑，响应极速，非常适合二次开发或本地交流学习。

## ✨ 核心功能

* 🔍 **多维智能筛选**：支持按星级、主词条、副词条、核心特性等条件进行“或 (OR)”逻辑组合筛选。
* 📖 **全图鉴展示**：左图右文布局，直观展示装备与武器的基础属性及效果。
* ⚡ **极速本地响应**：摒弃网络请求，采用本地 JSON 数据与本地 WebP 压缩图片，告别加载转圈。
* 📱 **多端支持**：基于 Taro 框架，支持编译为微信小程序，也可直接在浏览器（H5）中运行。

---

## 🚀 快速开始 (本地运行)

### 1. 环境准备
请确保你的电脑上已经安装了 [Node.js](https://nodejs.org/) (建议 v16 或以上版本)。

### 2. 克隆项目
```bash
git clone [https://github.com/wsryhc/Endfield-Weapon-Local.git](https://github.com/wsryhc/Endfield-Weapon-Local.git)
cd Endfield-Weapon-Local
```

### 3. 安装依赖
你可以使用 npm、yarn 或 pnpm 来安装依赖：
```bash
npm install
# 或者 yarn install
# 或者 pnpm install
```

### 4. 启动项目

本项目支持多种端的编译预览：

#### 🍉 选项 A：编译为网页版 (H5 / 浏览器预览)
最简单的预览方式，无需微信开发者工具：
```bash
npm run dev:h5
```
> **效果**：编译完成后，会自动在浏览器中打开 `http://localhost:10086`。建议按 `F12` 打开开发者工具，切换为手机设备视角（Toggle device toolbar）以获得最佳体验。

#### 🍏 选项 B：编译为微信小程序
如果你想在微信开发者工具中预览：
```bash
npm run dev:weapp
```
> **效果**：
> 1. 命令运行后会持续监听代码修改，并生成 `dist` 目录。
> 2. 打开 **微信开发者工具**。
> 3. 点击“导入项目”，目录选择本项目的**根目录**，AppID 可以填你自己的或者选择“测试号”。
> 4. 即可在开发者工具中查看效果。

---

## 📂 目录结构与数据更新指南

如果你想更新游戏数据或添加新的图片，请参考以下结构：

```text
├── src/
│   ├── data/                 # 核心数据目录
│   │   ├── weapons_data.json # 武器数据 (包含 updateTime 和 items)
│   │   ├── equip_data.json   # 装备数据
│   │   ├── weapon_images_opt/# 武器 WebP 图片夹
│   │   └── equip_images/     # 装备 WebP 图片夹
│   ├── pages/                # 页面代码 (武器页与装备页)
├── config/
│   └── index.js              # Taro 配置文件 (包含静态图片拷贝逻辑)
```

**⚠️ 添加新图片的注意事项：**
为了保证图片能被正确打包进程序，本项目在 `config/index.js` 中配置了 `copy` 插件：
```javascript
copy: {
  patterns: [
    { from: 'src/data/weapon_images_opt', to: 'dist/data/weapon_images_opt' },
    { from: 'src/data/equip_images', to: 'dist/data/equip_images' }
  ]
}
```
**因此，JSON 中的图片路径必须使用基于打包后 `dist` 的绝对路径，例如：**
`"image": "/data/equip_images/xxxx.webp"`

---

## 🛠️ 技术栈

* [Taro v3](https://taro.zone/) - 多端统一开发解决方案
* [React](https://reactjs.org/) - 前端视图层框架
* [Sass](https://sass-lang.com/) - CSS 预处理器

---

## 📜 免责与版权声明

1. 本项目为纯玩家“用爱发电”制作的**第三方非官方开源工具**，完全免费且无任何商业化盈利行为。
2. 项目内包含及涉及的所有游戏内武器/装备数据、图片素材及专有名词，其版权均归属《明日方舟：终末地》官方（鹰角网络/峘形山）所有。
3. 本工具仅供各位玩家进行本地配装模拟、编程交流与学习参考。若官方或相关权利人认为存在不妥之处，请提 Issue 或私信联系，作者将第一时间配合修改或下架处理。

## 📄 License

[MIT License](./LICENSE)