#!/bin/bash
# 为所有页面生成占位文件（4 个一组：.js / .json / .wxml / .wxss）
# 仅用于任务 1 初始化阶段，后续任务会替换为真实内容

set -e
cd "$(dirname "$0")/.."

declare -a PAGES=(
  "miniprogram/pages/customer/index/index|首页|customer"
  "miniprogram/pages/customer/products/index|商品列表|customer"
  "miniprogram/pages/customer/products/detail|商品详情|customer"
  "miniprogram/pages/customer/cart/index|购物车|customer"
  "miniprogram/pages/customer/orders/index|订单|customer"
  "miniprogram/pages/customer/profile/index|我的|customer"
  "miniprogram/pages/owner/index/index|店长工作台|owner"
  "miniprogram/pages/owner/products/index|商品管理|owner"
  "miniprogram/pages/owner/orders/index|订单管理|owner"
  "miniprogram/pages/owner/analytics/index|数据看板|owner"
  "miniprogram/pages/owner/settings/index|系统设置|owner"
)

for item in "${PAGES[@]}"; do
  IFS='|' read -r path title role <<< "$item"

  # .js
  cat > "${path}.js" <<EOF
// ${path}.js
Page({
  data: { title: '${title}', role: '${role}' },
  onLoad() {
    console.log('[${role}] ${title} 页面加载')
  }
})
EOF

  # .json
  cat > "${path}.json" <<EOF
{
  "navigationBarTitleText": "${title}",
  "usingComponents": {}
}
EOF

  # .wxml
  cat > "${path}.wxml" <<EOF
<view class="page">
  <view class="placeholder">🚧 {{title}} 页面 - 待开发</view>
</view>
EOF

  # .wxss
  cat > "${path}.wxss" <<EOF
.page { padding: 40rpx; min-height: 100vh; background: var(--background-color, #FDF6EC); }
.placeholder { text-align: center; color: var(--text-color, #3D2C1E); font-size: 32rpx; margin-top: 200rpx; }
EOF

  echo "✅ ${path}"
done

echo ""
echo "全部页面占位文件生成完成！"