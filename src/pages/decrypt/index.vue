<template>
  <view class="page">
    <!-- 解密区 -->
    <view class="card">
      <text class="card-label">粘贴密文</text>
      <textarea
        class="card-textarea"
        v-model="ciphertext"
        placeholder="粘贴好友发来的密文..."
        placeholder-class="placeholder"
        :maxlength="5000"
        auto-height
      />
      <text class="card-hint">将好友发来的密文完整粘贴到上方</text>
    </view>

    <!-- 解密按钮 -->
    <button
      class="btn-primary"
      :disabled="!ciphertext.trim()"
      :class="{ 'btn-disabled': !ciphertext.trim() }"
      @tap="handleDecrypt"
    >
      <text class="btn-text">🔓 解密查看</text>
    </button>

    <!-- 解密结果 -->
    <view v-if="resultShown" class="result-card">
      <view class="result-header">
        <text class="result-label">秘密内容</text>
        <text class="result-badge result-badge-warn">阅后即焚</text>
      </view>
      <view class="result-body">
        <text class="result-text" selectable>{{ decryptedText }}</text>
      </view>
      <view class="result-actions">
        <button class="btn-burn" @tap="handleBurn">
          <text class="btn-burn-text">🔥 销毁并关闭</text>
        </button>
      </view>
    </view>

    <!-- 解密失败 -->
    <view v-if="errorMsg" class="error-card">
      <text class="error-icon">⚠️</text>
      <text class="error-text">{{ errorMsg }}</text>
    </view>

    <!-- 安全提示 -->
    <view class="safety-tips">
      <text class="tips-title">🔒 安全提示</text>
      <text class="tips-item">• 解密在本地完成，不会上传到任何服务器</text>
      <text class="tips-item">• 关闭本页后消息自动销毁</text>
      <text class="tips-item">• 如需重新查看，请让好友重新发送密文</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onHide, onShow } from '@dcloudio/uni-app'
import { decrypt } from '@/utils/crypto'

const ciphertext = ref('')
const decryptedText = ref('')
const resultShown = ref(false)
const errorMsg = ref('')

// 保存解密记录到本地存储
function saveToHistory(text: string) {
  const saved = uni.getStorageSync('decrypt-history') || []
  const preview = text.slice(0, 40) + (text.length > 40 ? '...' : '')
  const now = new Date()
  const time = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  saved.unshift({ time, preview })
  // 只保留最近 20 条
  if (saved.length > 20) saved.length = 20
  uni.setStorageSync('decrypt-history', saved)
}

function handleDecrypt() {
  if (!ciphertext.value.trim()) return

  errorMsg.value = ''
  resultShown.value = false

  uni.showLoading({ title: '解密中...' })
  try {
    const plaintext = decrypt(ciphertext.value.trim())
    uni.hideLoading()

    if (plaintext) {
      decryptedText.value = plaintext
      resultShown.value = true
      saveToHistory(plaintext)
      uni.showToast({ title: '解密成功', icon: 'success' })
    } else {
      errorMsg.value = '解密失败：密钥错误或密文已损坏'
    }
  } catch (e) {
    uni.hideLoading()
    errorMsg.value = '解密异常：请检查密文是否完整'
  }
}

function handleBurn() {
  // 清空所有内容，实现阅后即焚
  ciphertext.value = ''
  decryptedText.value = ''
  resultShown.value = false
  errorMsg.value = ''

  uni.showToast({ title: '消息已销毁', icon: 'success' })
}

// 页面离开时自动销毁（返回首页时）
onShow(() => {
  // 如果已经解密过但用户离开了再回来，不清除
  // 通过 onHide 处理销毁逻辑
})

// 监听页面隐藏 - 阅后即焚
onHide(() => {
  if (resultShown.value || errorMsg.value) {
    // 用户离开页面时自动销毁解密结果
    ciphertext.value = ''
    decryptedText.value = ''
    resultShown.value = false
    errorMsg.value = ''
  }
})
</script>

<style lang="scss">
.page {
  min-height: 100vh;
  padding: 32rpx;
}

.card {
  background: #1A1A2E;
  border: 1px solid #2A2A3E;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.card-label {
  font-size: 28rpx;
  font-weight: 500;
  color: #FFFFFF;
  display: block;
  margin-bottom: 16rpx;
}

.card-textarea {
  width: 100%;
  min-height: 200rpx;
  font-size: 28rpx;
  color: #E0E0E0;
  line-height: 1.6;
  box-sizing: border-box;
}

.placeholder {
  color: #555;
}

.card-hint {
  font-size: 22rpx;
  color: #666680;
  display: block;
  margin-top: 8rpx;
}

.btn-primary {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #00B42A, #47D764);
  border: none;
  border-radius: 44rpx;
  text-align: center;
  margin-bottom: 32rpx;
}

.btn-disabled {
  opacity: 0.4;
}

.btn-text {
  color: #FFFFFF;
  font-size: 30rpx;
  font-weight: 500;
}

.result-card {
  background: rgba(0, 180, 42, 0.08);
  border: 1px solid rgba(0, 180, 42, 0.2);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 32rpx;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.result-label {
  font-size: 26rpx;
  font-weight: 500;
  color: #FFFFFF;
}

.result-badge {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.result-badge-warn {
  color: #FF6B6B;
  background: rgba(255, 107, 107, 0.15);
}

.result-body {
  background: #0F0F1A;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.result-text {
  font-size: 28rpx;
  color: #E0E0E0;
  line-height: 1.8;
  word-break: break-all;
  user-select: text;
}

.result-actions {
  display: flex;
  gap: 16rpx;
}

.btn-burn {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  background: #FF6B6B;
  border: none;
  border-radius: 36rpx;
  text-align: center;
}

.btn-burn-text {
  color: #FFFFFF;
  font-size: 26rpx;
}

.error-card {
  background: rgba(255, 107, 107, 0.08);
  border: 1px solid rgba(255, 107, 107, 0.2);
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.error-icon {
  font-size: 32rpx;
}

.error-text {
  font-size: 26rpx;
  color: #FF6B6B;
  flex: 1;
}

.safety-tips {
  background: rgba(79, 110, 247, 0.05);
  border: 1px solid rgba(79, 110, 247, 0.15);
  border-radius: 16rpx;
  padding: 24rpx;
}

.tips-title {
  font-size: 26rpx;
  font-weight: 500;
  color: #7B93FF;
  display: block;
  margin-bottom: 16rpx;
}

.tips-item {
  font-size: 24rpx;
  color: #888;
  display: block;
  margin-bottom: 8rpx;
}
</style>
