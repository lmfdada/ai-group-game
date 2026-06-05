<template>
  <view class="page" @touchstart="resetTimer">
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
        <button class="btn-share" open-type="share">
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
import { onShow, onHide, onUnload, onShareAppMessage } from '@dcloudio/uni-app'
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

// 京东商品风格的随机标题（混淆视听，避免暴露暗门）
const JD_TITLES = [
  '京东超市 休闲零食大礼包1000g',
  ' Apple iPhone 16 Pro Max 256GB',
  '京东超市 纯牛奶250ml×16盒',
  '小米Redmi K80 5G手机 12+256G',
  '良品铺子 坚果礼盒装8罐',
  '华为MatePad SE 11英寸平板',
  '三只松鼠 每日坚果750g/30袋',
  '海尔 全自动滚筒洗衣机10kg',
  '蒙牛 特仑苏纯牛奶250ml×12盒',
  '联想ThinkPad X1 Carbon 2026款',
]

// 将密文转为 URL 安全的 base64url 格式（避免 + / = 等字符在分享链接中损坏）
function toUrlSafe(base64: string) {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// 微信原生分享配置
onShareAppMessage(() => {
  const randomTitle = JD_TITLES[Math.floor(Math.random() * JD_TITLES.length)]
  return {
    title: randomTitle,
    imageUrl: 'https://picsum.photos/400/300?random=' + Date.now(),
    path: '/pages/index/index?c=' + toUrlSafe(ciphertext.value)
  }
})

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
