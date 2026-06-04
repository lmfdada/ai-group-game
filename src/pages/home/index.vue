<template>
  <view class="page">
    <!-- 头部 -->
    <view class="header">
      <text class="header-title">私密信使</text>
      <text class="header-desc">纯本地加密，消息不上传任何服务器</text>
    </view>

    <!-- 主操作区 -->
    <view class="action-cards">
      <view class="card" @tap="handleEncrypt">
        <view class="card-icon card-icon-encrypt">
          <text class="card-icon-text">E</text>
        </view>
        <view class="card-body">
          <text class="card-title">加密消息</text>
          <text class="card-desc">输入秘密 → 生成密文 → 发给好友</text>
        </view>
        <text class="card-arrow">→</text>
      </view>

      <view class="card" @tap="handleDecrypt">
        <view class="card-icon card-icon-decrypt">
          <text class="card-icon-text">D</text>
        </view>
        <view class="card-body">
          <text class="card-title">解密消息</text>
          <text class="card-desc">粘贴密文 → 解密查看 → 阅后即焚</text>
        </view>
        <text class="card-arrow">→</text>
      </view>
    </view>

    <!-- 历史记录 -->
    <view class="section-label">
      <text class="section-label-text">最近解密</text>
      <text class="section-label-clear" @tap="handleClearHistory">清空</text>
    </view>

    <view class="history-list">
      <view
        v-for="(item, index) in history"
        :key="index"
        class="history-item"
        @tap="handleViewHistory(item)"
      >
        <view class="history-top">
          <text class="history-time">{{ item.time }}</text>
          <text class="history-badge">已焚毁</text>
        </view>
        <text class="history-preview">{{ item.preview }}</text>
      </view>

      <view v-if="history.length === 0" class="empty">
        <text class="empty-text">暂无解密记录</text>
        <text class="empty-hint">解密后的消息阅后即焚，不留痕迹</text>
      </view>
    </view>

    <!-- 安全提示 -->
    <view class="footer-tip">
      <text class="tip-text">请通过微信等加密渠道分享密文和密钥</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

interface HistoryItem {
  time: string
  preview: string
}

const history = ref<HistoryItem[]>([])

function handleEncrypt() {
  uni.navigateTo({ url: '/pages/encrypt/index' })
}

function handleDecrypt() {
  uni.navigateTo({ url: '/pages/decrypt/index' })
}

function handleViewHistory(item: HistoryItem) {
  uni.showModal({
    title: item.time,
    content: item.preview,
    confirmText: '关闭'
  })
}

function handleClearHistory() {
  if (history.value.length === 0) return
  uni.showModal({
    title: '确认清空',
    content: '清空后无法恢复',
    success: (res) => {
      if (res.confirm) {
        history.value = []
        uni.setStorageSync('decrypt-history', [])
        uni.showToast({ title: '已清空', icon: 'none' })
      }
    }
  })
}

onShow(() => {
  const saved = uni.getStorageSync('decrypt-history')
  if (saved) {
    history.value = saved
  }
})
</script>

<style lang="scss">
.page {
  min-height: 100vh;
  padding: 32rpx;
  padding-bottom: 120rpx;
  background: #0F0F1A;
}

.header {
  margin-bottom: 40rpx;
}

.header-title {
  font-size: 44rpx;
  font-weight: 700;
  color: #FFFFFF;
  display: block;
  margin-bottom: 12rpx;
}

.header-desc {
  font-size: 24rpx;
  color: #666680;
}

.action-cards {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 48rpx;
}

.card {
  background: #1A1A2E;
  border: 1px solid #2A2A3E;
  border-radius: 20rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.card:active {
  opacity: 0.85;
  border-color: #7B93FF;
}

.card-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon-encrypt {
  background: linear-gradient(135deg, #4F6EF7, #7B93FF);
}

.card-icon-decrypt {
  background: linear-gradient(135deg, #00B42A, #47D764);
}

.card-icon-text {
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
}

.card-body {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #FFFFFF;
  display: block;
  margin-bottom: 6rpx;
}

.card-desc {
  font-size: 24rpx;
  color: #888;
}

.card-arrow {
  font-size: 32rpx;
  color: #555;
  flex-shrink: 0;
}

.section-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-label-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #FFFFFF;
}

.section-label-clear {
  font-size: 24rpx;
  color: #FF6B6B;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.history-item {
  background: #1A1A2E;
  border: 1px solid #2A2A3E;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
}

.history-item:active {
  opacity: 0.85;
}

.history-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.history-time {
  font-size: 22rpx;
  color: #666680;
}

.history-badge {
  font-size: 20rpx;
  color: #FF6B6B;
  background: rgba(255, 107, 107, 0.1);
  padding: 2rpx 12rpx;
  border-radius: 6rpx;
}

.history-preview {
  font-size: 26rpx;
  color: #AAA;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.empty {
  text-align: center;
  padding: 64rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #666680;
  display: block;
  margin-bottom: 8rpx;
}

.empty-hint {
  font-size: 22rpx;
  color: #444;
}

.footer-tip {
  margin-top: 48rpx;
  text-align: center;
}

.tip-text {
  font-size: 22rpx;
  color: #555;
}
</style>
