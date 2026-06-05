<template>
  <view class="page" @touchstart="resetTimer">
    <!-- 解密区 -->
    <view class="card">
      <text class="card-label">粘贴密文</text>
      <textarea
        class="card-textarea"
        v-model="ciphertext"
        placeholder="粘贴好友发来的密文..."
        placeholder-class="placeholder"
        :maxlength="-1"
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

    <!-- 隐私遮罩：切到后台时覆盖内容，防止 app switcher 截图 -->
    <view v-if="showPrivacyCover" class="privacy-cover">
      <text class="privacy-cover-text">离开即焚 · 保护隐私</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { onShow, onHide, onUnload, onLoad } from '@dcloudio/uni-app'
import { decrypt } from '@/utils/crypto'

const ciphertext = ref('')
const decryptedText = ref('')
const resultShown = ref(false)
const errorMsg = ref('')

// 隐私遮罩：切到后台时覆盖内容
const showPrivacyCover = ref(false)

// 10秒无操作自动跳回计算器
let timerId: ReturnType<typeof setTimeout> | null = null

function resetTimer() {
  if (timerId) clearTimeout(timerId)
  timerId = setTimeout(() => {
    uni.reLaunch({ url: '/pages/index/index' })
  }, 10000)
}

function stopTimer() {
  if (timerId) {
    clearTimeout(timerId)
    timerId = null
  }
}

// 截图销毁回调（保存引用以便移除监听）
const screenshotHandler = () => {
  if (resultShown.value || errorMsg.value) {
    ciphertext.value = ''
    decryptedText.value = ''
    resultShown.value = false
    errorMsg.value = ''
  }
}

onShow(() => {
  resetTimer()
  // 回到前台时隐藏隐私遮罩
  showPrivacyCover.value = false
  // 注册截图监听：检测到截图就销毁消息
  try {
    uni.onUserCaptureScreen(screenshotHandler)
  } catch (e) {
    // 静默忽略
  }
})

onHide(() => {
  stopTimer()
  // 切到后台时显示隐私遮罩，防止 app switcher 截图
  showPrivacyCover.value = true
  // 取消截图监听
  try {
    uni.offUserCaptureScreen(screenshotHandler)
  } catch (e) {
    // 静默忽略
  }
  if (resultShown.value || errorMsg.value) {
    ciphertext.value = ''
    decryptedText.value = ''
    resultShown.value = false
    errorMsg.value = ''
  }
})

onUnload(() => {
  stopTimer()
  try {
    uni.offUserCaptureScreen(screenshotHandler)
  } catch (e) {
    // 静默忽略
  }
})

// 将 base64url 还原为标准 base64
function fromUrlSafe(s: string) {
  let result = s.replace(/-/g, '+').replace(/_/g, '/')
  while (result.length % 4) result += '='
  return result
}

// 接收来自分享的密文参数（好友通过小程序卡片打开）
onLoad((query) => {
  if (query?.c) {
    ciphertext.value = fromUrlSafe(query.c)
    // 自动执行解密
    handleDecrypt()
  }
})

watch(ciphertext, () => resetTimer())

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

/* 隐私遮罩 */
.privacy-cover {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: #0D0D1A;
  display: flex;
  align-items: center;
  justify-content: center;
}

.privacy-cover-text {
  font-size: 28rpx;
  color: #555;
  letter-spacing: 4rpx;
}
</style>
