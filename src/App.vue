<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('[App] 私密信使启动')

  // 启用防截屏/防录屏（仅微信小程序生效）
  // #ifdef MP-WEIXIN
  wx.setVisualEffectOnCapture({
    visualEffect: 'hidden'
  })
  console.log('[App] 防截屏已启用')
  // #endif
})

onShow(() => {
  console.log('[App] 小程序进入前台')
})

onHide(() => {
  console.log('[App] 小程序进入后台')
})
</script>

<style>
page {
  background-color: #0F0F1A;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 28rpx;
  color: #E0E0E0;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
</style>
