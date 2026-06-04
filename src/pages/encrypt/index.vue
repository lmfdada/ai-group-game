<template>
  <view class="page" @tap="resetTimer">
    <!-- 加密区 -->
    <view class="card">
      <text class="card-label">输入秘密消息</text>
      <textarea
        class="card-textarea"
        v-model="plaintext"
        placeholder="在此输入你要加密的秘密..."
        placeholder-class="placeholder"
        :maxlength="2000"
        auto-height
      />
      <text class="card-counter">{{ plaintext.length }}/2000</text>
    </view>

    <!-- 加密按钮 -->
    <button
      class="btn-primary"
      :disabled="!plaintext.trim()"
      :class="{ 'btn-disabled': !plaintext.trim() }"
      @tap="handleEncrypt"
    >
      <text class="btn-text">🔐 加密生成密文</text>
    </button>

    <!-- 结果区 -->
    <view v-if="ciphertext" class="result-card">
      <view class="result-header">
        <text class="result-label">密文（已加密）</text>
        <text class="result-badge">AES-256</text>
      </view>
      <view class="result-body">
        <text class="result-text" selectable>{{ ciphertext }}</text>
      </view>
      <view class="result-actions">
        <button class="btn-copy" @tap="handleCopy">
          <text class="btn-copy-text">📋 复制密文</text>
        </button>
        <button class="btn-share" @tap="handleShare">
          <text class="btn-share-text">💬 发送给好友</text>
        </button>
      </view>
      <view class="result-tip">
        <text class="tip-text">⚠️ 将上方密文和密钥一起发给好友</text>
      </view>
    </view>

    <!-- 安全提示 -->
    <view class="safety-tips">
      <text class="tips-title">🔒 安全提示</text>
      <text class="tips-item">• 密钥仅你和信任的好友知道</text>
      <text class="tips-item">• 同一密钥可多次使用</text>
      <text class="tips-item">• 密文通过微信发送即可，不怕服务器泄露</text>
      <view class="tips-divider" />
      <text class="tips-item">
        当前密钥：
        <text class="tips-key" user-select>{{ keyPreview }}</text>
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onShow, onHide, onUnload } from '@dcloudio/uni-app'
import { encrypt, getKeyPreview } from '@/utils/crypto'

const plaintext = ref('')
const ciphertext = ref('')
const keyPreview = computed(() => getKeyPreview())

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

onShow(() => resetTimer())
onHide(() => stopTimer())
onUnload(() => stopTimer())

watch(plaintext, () => resetTimer())

function handleEncrypt() {
  if (!plaintext.value.trim()) return

  uni.showLoading({ title: '加密中...' })
  try {
    ciphertext.value = encrypt(plaintext.value)
    uni.hideLoading()
    uni.showToast({ title: '加密成功', icon: 'success' })
  } catch (e: any) {
    uni.hideLoading()
    console.error('[Encrypt] 加密异常:', e)
    uni.showModal({
      title: '加密失败',
      content: e?.message || '请检查控制台错误信息',
      showCancel: false
    })
    // #region debug-point C:page-error
    ;(()=>{uni.request({url:"http://127.0.0.1:7777/event",method:"POST",data:{sessionId:"crypto-miniprogram-encrypt-fail",runId:"pre",hypothesisId:"C",location:"encrypt.vue:catch",msg:"[DEBUG] page caught encrypt error",data:{message:e?.message,stack:e?.stack,type:e?.constructor?.name,full:String(e)},ts:Date.now()}})})();
    // #endregion
  }
}

function handleCopy() {
  if (!ciphertext.value) return
  uni.setClipboardData({
    data: ciphertext.value,
    success: () => {
      uni.showToast({ title: '密文已复制', icon: 'success' })
    }
  })
}

function handleShare() {
  if (!ciphertext.value) return
  // 复制后引导用户去微信粘贴
  uni.setClipboardData({
    data: ciphertext.value,
    success: () => {
      uni.showModal({
        title: '密文已复制',
        content: '现在打开微信，粘贴密文发给好友。\n\n别忘了同时把密钥告诉对方！',
        confirmText: '知道了'
      })
    }
  })
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
  min-height: 240rpx;
  font-size: 28rpx;
  color: #E0E0E0;
  line-height: 1.6;
  box-sizing: border-box;
}

.placeholder {
  color: #555;
}

.card-counter {
  font-size: 22rpx;
  color: #666680;
  text-align: right;
  display: block;
  margin-top: 8rpx;
}

.btn-primary {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #4F6EF7, #7B93FF);
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
  background: rgba(79, 110, 247, 0.08);
  border: 1px solid rgba(79, 110, 247, 0.2);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 32rpx;
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
  color: #7B93FF;
  background: rgba(79, 110, 247, 0.15);
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.result-body {
  background: #0F0F1A;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.result-text {
  font-size: 24rpx;
  color: #AAA;
  font-family: monospace;
  word-break: break-all;
  line-height: 1.6;
  user-select: text;
}

.result-actions {
  display: flex;
  gap: 16rpx;
}

.btn-copy, .btn-share {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 36rpx;
  text-align: center;
  border: none;
}

.btn-copy {
  background: #4F6EF7;
}

.btn-share {
  background: #00B42A;
}

.btn-copy-text, .btn-share-text {
  color: #FFFFFF;
  font-size: 26rpx;
}

.result-tip {
  margin-top: 16rpx;
}

.tip-text {
  font-size: 22rpx;
  color: #FF6B6B;
}

.safety-tips {
  background: rgba(255, 107, 107, 0.05);
  border: 1px solid rgba(255, 107, 107, 0.15);
  border-radius: 16rpx;
  padding: 24rpx;
}

.tips-title {
  font-size: 26rpx;
  font-weight: 500;
  color: #FF6B6B;
  display: block;
  margin-bottom: 16rpx;
}

.tips-item {
  font-size: 24rpx;
  color: #888;
  display: block;
  margin-bottom: 8rpx;
}

.tips-divider {
  height: 1px;
  background: rgba(255, 107, 107, 0.1);
  margin: 12rpx 0;
}

.tips-key {
  color: #7B93FF;
  font-family: monospace;
  font-size: 22rpx;
}
</style>
