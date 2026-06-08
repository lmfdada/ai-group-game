<template>
  <view class="entry-page">
    <!-- 纯空白页面，无任何可见内容 -->
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { decodeCiphertextParam, encodeCiphertextParam } from '@/utils/ciphertext-param'

// 京东购物小程序 appId
const JD_MINI_PROGRAM_APP_ID = 'wx91d27dbf599dff74'

// 从分享携带的密文参数
const ciphertext = ref('')

// 获取当前时间作为验证码（HHMM）
function getCurrentTimeNumber(): number {
  const now = new Date()
  return now.getHours() * 100 + now.getMinutes()
}

function closeMiniProgram() {
  // #ifdef MP-WEIXIN
  // @ts-expect-error wx 仅在微信小程序环境可用
  wx.exitMiniProgram()
  // #endif
}

// 第一步：询问是否跳转京东
function showJdConfirm() {
  uni.showModal({
    title: '提示',
    content: '是否跳转到京东',
    confirmText: '是',
    cancelText: '否',
    success: (res) => {
      if (res.confirm) {
        // 是 → 跳转京东
        uni.navigateToMiniProgram({
          appId: JD_MINI_PROGRAM_APP_ID,
          fail: () => {
            uni.showToast({ title: '暂时无法打开京东', icon: 'none' })
          }
        })
      } else {
        // 否 → 弹出验证码输入框
        showVerificationInput()
      }
    }
  })
}

// 第二步：验证码输入
function showVerificationInput() {
  uni.showModal({
    title: '请输入验证码',
    content: ' ',
    editable: true,
    confirmText: '确认',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        const input = (res.content || '').trim()
        if (!input) {
          closeMiniProgram()
          return
        }

        const num = parseInt(input, 10)
        if (!isNaN(num) && num === getCurrentTimeNumber()) {
          // 验证通过 → 跳转解密页
          const url = '/pages/decrypt/index?c=' + encodeCiphertextParam(ciphertext.value) + '&from=share'
          uni.redirectTo({ url })
        } else {
          // 验证错误 → 关闭小程序
          uni.showToast({ title: '验证码错误', icon: 'none', duration: 1500 })
          setTimeout(() => {
            closeMiniProgram()
          }, 1500)
        }
      } else {
        // 取消 → 关闭小程序
        closeMiniProgram()
      }
    }
  })
}

onLoad((query) => {
  if (query?.c) {
    ciphertext.value = decodeCiphertextParam(String(query.c))
  }
  // 页面加载后弹出对话框
  showJdConfirm()
})
</script>

<style>
.entry-page {
  width: 100vw;
  height: 100vh;
  background: #0F0F1A;
}
</style>
