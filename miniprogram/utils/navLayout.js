/** 自定义导航栏尺寸（状态栏 + 胶囊对齐） */
function getNavLayout() {
  const win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
  const menu = wx.getMenuButtonBoundingClientRect()
  const statusBarHeight = win.statusBarHeight || 20
  const navBarHeight = menu.height + (menu.top - statusBarHeight) * 2
  return { statusBarHeight, navBarHeight }
}

module.exports = { getNavLayout }
