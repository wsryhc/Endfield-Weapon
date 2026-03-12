export default defineAppConfig({
  pages: [
    'pages/index/index',      // 武器页 (原来的)
    'pages/equipment/index'   // 装备页 (新增的)
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '装备小助手', // 标题改通用点
    navigationBarTextStyle: 'black'
  },
  // --- [新增] 底部导航栏配置 ---
  tabBar: {
    color: "#999999",
    selectedColor: "#ffcc00", // 选中变黄
    backgroundColor: "#ffffff",
    borderStyle: "black",
    list: [
      {
        pagePath: "pages/index/index",
        text: "武器查询",
        iconPath: "assets/jian0.png",      
        selectedIconPath: "assets/jian1.png"
      },
      {
        pagePath: "pages/equipment/index",
        text: "装备筛选",
        iconPath: "assets/dun0.png",
        selectedIconPath: "assets/dun1.png"
      }
    ]
  },
  lazyCodeLoading: "requiredComponents",
  style: "v2"
})