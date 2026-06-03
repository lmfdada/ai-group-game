<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('[App] 小程序启动')
})

onShow(() => {
  console.log('[App] 小程序前台')
})

onHide(() => {
  console.log('[App] 小程序后台')
})
</script>

<style>
/* 全局基础样式 */
page {
  background-color: #F5F6FA;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 28rpx;
  color: #1D2129;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
</style>
