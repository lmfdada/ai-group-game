<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

let shouldReturnToCalculator = false

onLaunch(() => {
  console.log('[App] 私密信使启动')

  // 启用防截屏/防录屏（仅微信小程序生效，不弹授权，能开就开，开不了拉倒）
  // #ifdef MP-WEIXIN
  try {
    wx.setVisualEffectOnCapture({
      visualEffect: 'hidden'
    })
    console.log('[App] 防截屏已启用')
  } catch (e) {
    console.warn('[App] 防截屏设置失败:', e)
  }
  // #endif
})

onShow((options: any) => {
  console.log('[App] 小程序进入前台')
  const hasSharedCiphertext = Boolean(options?.query?.c)
  if (hasSharedCiphertext) {
    shouldReturnToCalculator = false
  }
  if (shouldReturnToCalculator && !hasSharedCiphertext) {
    shouldReturnToCalculator = false
    uni.reLaunch({ url: '/pages/index/index' })
  }
})

onHide(() => {
  console.log('[App] 小程序进入后台，销毁所有数据')
  shouldReturnToCalculator = true
  // 清除所有本地存储
  try {
    uni.clearStorageSync()
    console.log('[App] 所有存储已清除')
  } catch (e) {
    console.warn('[App] 清除存储失败:', e)
  }
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
