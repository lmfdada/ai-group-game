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

    <view class="card">
      <view class="image-header">
        <text class="card-label">秘密图片</text>
        <button v-if="imageDataUrl" class="btn-clear-image" @tap="clearImage">移除</button>
      </view>
      <view v-if="imageDataUrl" class="image-preview-wrap">
        <image class="image-preview" :src="imageDataUrl" mode="aspectFit" />
      </view>
      <button v-else class="btn-secondary" @tap="chooseSecretImage">
        <text class="btn-secondary-text">选择图片</text>
      </button>
      <text class="card-hint">图片会先转成密文，解密后只在本机展示</text>
    </view>

    <!-- 加密按钮 -->
    <button
      class="btn-primary"
      :disabled="!canEncrypt"
      :class="{ 'btn-disabled': !canEncrypt }"
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
      <scroll-view class="result-body" scroll-y>
        <text class="result-text" selectable>{{ ciphertext }}</text>
      </scroll-view>
      <view class="result-actions">
        <button v-if="canShareCiphertext" class="btn-share" open-type="share">
          <text class="btn-share-text">💬 发送给好友</text>
        </button>
        <button v-else class="btn-share btn-share-disabled" disabled>
          <text class="btn-share-text">密文过大，暂不可分享</text>
        </button>
      </view>
      <view class="result-tip">
        <text class="tip-text">{{ resultTip }}</text>
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

    <view v-if="showPrivacyCover" class="privacy-cover">
      <text class="privacy-cover-text">保护隐私</text>
    </view>

    <view v-if="showScrambleCover" class="scramble-cover">
      <view
        v-for="item in scrambleBlocks"
        :key="item"
        class="scramble-block"
        :class="'scramble-block-' + (item % 8)"
      />
      <text class="scramble-text">内容已乱码</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onShow, onHide, onUnload, onShareAppMessage } from '@dcloudio/uni-app'
import { encrypt, getKeyPreview } from '@/utils/crypto'

const MAX_SHARE_CIPHER_LENGTH = 1800

const plaintext = ref('')
const ciphertext = ref('')
const imageDataUrl = ref('')
const imageMime = ref('image/jpeg')
const showPrivacyCover = ref(false)
const showScrambleCover = ref(false)
const scrambleBlocks = Array.from({ length: 96 }, (_, index) => index)
const keyPreview = computed(() => getKeyPreview())
const canEncrypt = computed(() => Boolean(plaintext.value.trim() || imageDataUrl.value))
const canShareCiphertext = computed(() => Boolean(ciphertext.value && toUrlSafe(ciphertext.value).length <= MAX_SHARE_CIPHER_LENGTH))
const resultTip = computed(() => {
  if (canShareCiphertext.value) return '⚠️ 将密钥通过安全渠道告诉好友'
  return '⚠️ 图片密文通常很长，当前分享链路无法可靠承载，需要接入云端中转后分享'
})

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

const screenshotHandler = () => {
  showScrambleCover.value = true
  plaintext.value = ''
  ciphertext.value = ''
  imageDataUrl.value = ''
  setTimeout(() => {
    showScrambleCover.value = false
  }, 2500)
}

onShow(() => {
  resetTimer()
  setTimeout(() => {
    showPrivacyCover.value = false
  }, 120)
  try {
    uni.onUserCaptureScreen(screenshotHandler)
  } catch (e) {
    // 静默忽略
  }
})
onHide(() => {
  stopTimer()
  showPrivacyCover.value = true
  try {
    uni.offUserCaptureScreen(screenshotHandler)
  } catch (e) {
    // 静默忽略
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

watch(plaintext, () => resetTimer())
watch(imageDataUrl, () => resetTimer())

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
  const safeCiphertext = toUrlSafe(ciphertext.value)
  if (!safeCiphertext || safeCiphertext.length > MAX_SHARE_CIPHER_LENGTH) {
    uni.showToast({ title: '密文过大，暂不可分享', icon: 'none' })
    return {
      title: randomTitle,
      imageUrl: 'https://picsum.photos/400/300?random=' + Date.now(),
      path: '/pages/index/index'
    }
  }
  return {
    title: randomTitle,
    imageUrl: 'https://picsum.photos/400/300?random=' + Date.now(),
    path: '/pages/index/index?c=' + safeCiphertext
  }
})

function getMimeFromPath(path: string) {
  const lower = path.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}

function readFileAsDataUrl(filePath: string, mime: string) {
  return new Promise<string>((resolve, reject) => {
    // #ifdef MP-WEIXIN
    const fs = uni.getFileSystemManager()
    fs.readFile({
      filePath,
      encoding: 'base64',
      success: (res: any) => resolve(`data:${mime};base64,${res.data}`),
      fail: reject
    })
    // #endif
    // #ifndef MP-WEIXIN
    reject(new Error('当前平台暂不支持读取图片文件'))
    // #endif
  })
}

function chooseSecretImage() {
  resetTimer()
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res: any) => {
      const filePath = res.tempFilePaths?.[0]
      if (!filePath) return
      const mime = getMimeFromPath(filePath)
      uni.showLoading({ title: '读取图片...' })
      try {
        imageMime.value = mime
        imageDataUrl.value = await readFileAsDataUrl(filePath, mime)
        uni.hideLoading()
      } catch (e: any) {
        uni.hideLoading()
        uni.showModal({
          title: '读取失败',
          content: e?.message || '图片读取失败，请换一张图片重试',
          showCancel: false
        })
      }
    }
  })
}

function clearImage() {
  imageDataUrl.value = ''
}

function handleEncrypt() {
  if (!canEncrypt.value) return

  uni.showLoading({ title: '加密中...' })
  try {
    const payload = imageDataUrl.value
      ? JSON.stringify({
          pvType: 'image',
          mime: imageMime.value,
          dataUrl: imageDataUrl.value,
          text: plaintext.value.trim()
        })
      : plaintext.value
    ciphertext.value = encrypt(payload)
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

</script>

<style lang="scss">
.page {
  min-height: 100vh;
  padding: 32rpx;
}

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
}

.scramble-cover {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  background: #06060A;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-auto-rows: 1fr;
  overflow: hidden;
}

.scramble-block {
  opacity: 0.92;
}

.scramble-block-0 { background: #0F0F1A; }
.scramble-block-1 { background: #4F6EF7; }
.scramble-block-2 { background: #00B42A; }
.scramble-block-3 { background: #FF6B6B; }
.scramble-block-4 { background: #F6C445; }
.scramble-block-5 { background: #111827; }
.scramble-block-6 { background: #8A8A8A; }
.scramble-block-7 { background: #FFFFFF; }

.scramble-text {
  position: fixed;
  left: 0;
  right: 0;
  top: 46%;
  z-index: 10001;
  color: #FFFFFF;
  font-size: 34rpx;
  font-weight: 700;
  text-align: center;
  text-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.8);
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

.card-hint {
  font-size: 22rpx;
  color: #666680;
  display: block;
  margin-top: 12rpx;
}

.image-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.btn-clear-image {
  width: 120rpx;
  height: 52rpx;
  line-height: 52rpx;
  margin: 0;
  background: rgba(255, 107, 107, 0.12);
  border: 1px solid rgba(255, 107, 107, 0.25);
  border-radius: 10rpx;
  color: #FF8A8A;
  font-size: 22rpx;
}

.btn-secondary {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  margin: 0;
  background: rgba(79, 110, 247, 0.12);
  border: 1px solid rgba(79, 110, 247, 0.28);
  border-radius: 12rpx;
}

.btn-secondary-text {
  color: #AFC0FF;
  font-size: 26rpx;
}

.image-preview-wrap {
  height: 320rpx;
  background: #0F0F1A;
  border-radius: 12rpx;
  overflow: hidden;
}

.image-preview {
  width: 100%;
  height: 100%;
  pointer-events: none;
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
  height: 260rpx;
  box-sizing: border-box;
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

.btn-share {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 36rpx;
  text-align: center;
  border: none;
  background: #00B42A;
}

.btn-share-disabled {
  opacity: 0.45;
}

.btn-share-text {
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
