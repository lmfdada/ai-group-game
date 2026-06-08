<template>
  <view class="calc">
    <!-- 显示区域 -->
    <view class="display">
      <text class="display-expr">{{ expression }}</text>
      <text class="display-result" :class="{ 'result-small': result.length > 12 }">{{ result }}</text>
    </view>

    <!-- 按键区域 -->
    <view class="buttons">
      <view
        v-for="btn in buttons"
        :key="btn.key"
        :class="[
          'btn',
          'btn--' + btn.type,
          btn.blank ? 'btn--blank' : ''
        ]"
        @tap="handlePress(btn.key)"
      >
        <text v-if="!btn.blank">{{ btn.label }}</text>
      </view>
    </view>

    <view v-if="showShareConfirm || showTimePrompt" class="gate-mask">
      <view class="gate-dialog">
        <view v-if="showShareConfirm">
          <text class="gate-title">是否打开京东</text>
          <text class="gate-desc">即将离开当前小程序，前往京东查看商品详情。</text>
          <view class="gate-actions">
            <button class="gate-btn gate-btn-secondary" @tap="handleRejectJd">否</button>
            <button class="gate-btn gate-btn-primary" @tap="handleOpenJd">是</button>
          </view>
        </view>

        <view v-else>
          <text class="gate-title">请输入验证码</text>
          <input
            class="gate-input"
            v-model="gateInput"
            type="number"
            maxlength="4"
            password
            focus
            @confirm="submitGateInput"
          />
          <view class="gate-actions">
            <button class="gate-btn gate-btn-secondary" @tap="cancelGateInput">取消</button>
            <button class="gate-btn gate-btn-primary" @tap="submitGateInput">确认</button>
          </view>
        </view>
      </view>
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
import { ref, computed } from 'vue'
import { onHide, onLoad, onShow, onUnload } from '@dcloudio/uni-app'

const expression = ref('')
const result = ref('0')
const showScrambleCover = ref(false)
const scrambleBlocks = Array.from({ length: 96 }, (_, index) => index)
const showShareConfirm = ref(false)
const showTimePrompt = ref(false)
const gateInput = ref('')
const gatedCiphertext = ref('')

// 京东购物小程序 appId。如目标小程序调整，只需要改这里。
const JD_MINI_PROGRAM_APP_ID = 'wx91d27dbf599dff74'

// 从分享卡片携带的密文参数（需要先时间验证，再跳转解密页）
const pendingCiphertext = ref('')

function openShareGate() {
  if (!pendingCiphertext.value || gatedCiphertext.value === pendingCiphertext.value) return
  gatedCiphertext.value = pendingCiphertext.value
  gateInput.value = ''
  showTimePrompt.value = false
  showShareConfirm.value = true
}

function captureCiphertextFromQuery(query?: Record<string, any>) {
  if (query?.c) {
    const nextCiphertext = String(query.c)
    if (nextCiphertext !== pendingCiphertext.value) {
      gatedCiphertext.value = ''
    }
    pendingCiphertext.value = nextCiphertext
    console.debug('[calc] 从路由参数获取密文')
    openShareGate()
    return true
  }
  return false
}

function captureCiphertextFromEnterOptions() {
  try {
    const enterOptions = uni.getEnterOptionsSync()
    if (enterOptions?.query?.c) {
      const nextCiphertext = String(enterOptions.query.c)
      if (nextCiphertext !== pendingCiphertext.value) {
        gatedCiphertext.value = ''
        pendingCiphertext.value = nextCiphertext
        console.debug('[calc] 从入口参数获取密文')
      }
      openShareGate()
    }
  } catch (e) {
    // 静默
  }
}

function getDecryptUrl() {
  return '/pages/decrypt/index?c=' + encodeURIComponent(pendingCiphertext.value)
}

function blockSharedDecrypt() {
  pendingCiphertext.value = ''
  showShareConfirm.value = false
  showTimePrompt.value = false
  gateInput.value = ''
  clear()
}

function handleOpenJd() {
  blockSharedDecrypt()
  uni.navigateToMiniProgram({
    appId: JD_MINI_PROGRAM_APP_ID,
    fail: () => {
      uni.showToast({ title: '暂时无法打开京东', icon: 'none' })
    }
  })
}

function handleRejectJd() {
  showShareConfirm.value = false
  showTimePrompt.value = true
  gateInput.value = ''
}

function cancelGateInput() {
  blockSharedDecrypt()
}

function exitToWechat() {
  blockSharedDecrypt()
  // #ifdef MP-WEIXIN
  wx.exitMiniProgram({
    fail: () => {
      uni.reLaunch({ url: '/pages/index/index' })
    }
  })
  // #endif
  // #ifndef MP-WEIXIN
  uni.reLaunch({ url: '/pages/index/index' })
  // #endif
}

function submitGateInput() {
  const input = gateInput.value.trim()
  if (checkTimeUnlock(input) && pendingCiphertext.value) {
    showShareConfirm.value = false
    showTimePrompt.value = false
    gateInput.value = ''
    uni.reLaunch({ url: getDecryptUrl() })
    return
  }
  exitToWechat()
}

onLoad((query) => {
  // 从路由参数获取密文；热启动分享场景下，再从入口参数兜底获取。
  captureCiphertextFromQuery(query)
  captureCiphertextFromEnterOptions()
  if (pendingCiphertext.value) {
    console.debug('[calc] 已捕获密文参数，等待时间验证')
  }
})

onShow(() => {
  // 小程序从分享卡片热启动时，页面可能不会重新 onLoad。
  captureCiphertextFromEnterOptions()
  try {
    uni.onUserCaptureScreen(screenshotHandler)
  } catch (e) {
    // 静默
  }
})

onHide(() => {
  try {
    uni.offUserCaptureScreen(screenshotHandler)
  } catch (e) {
    // 静默
  }
})

onUnload(() => {
  try {
    uni.offUserCaptureScreen(screenshotHandler)
  } catch (e) {
    // 静默
  }
})
const currentInput = ref('0')
const operator = ref('')
const prevValue = ref<number | null>(null)
const justCalculated = ref(false)

const screenshotHandler = () => {
  showScrambleCover.value = true
  clear()
  setTimeout(() => {
    showScrambleCover.value = false
  }, 2500)
}

type BtnType = 'number' | 'operator' | 'func' | 'equals' | 'blank'

interface ButtonConfig {
  key: string
  label: string
  type: BtnType
  blank?: boolean
}

const buttons = computed<ButtonConfig[]>(() => [
  { key: 'C', label: 'C', type: 'func' },
  { key: '±', label: '±', type: 'func' },
  { key: '%', label: '%', type: 'func' },
  { key: '÷', label: '÷', type: 'operator' },

  { key: '7', label: '7', type: 'number' },
  { key: '8', label: '8', type: 'number' },
  { key: '9', label: '9', type: 'number' },
  { key: '×', label: '×', type: 'operator' },

  { key: '4', label: '4', type: 'number' },
  { key: '5', label: '5', type: 'number' },
  { key: '6', label: '6', type: 'number' },
  { key: '-', label: '-', type: 'operator' },

  { key: '1', label: '1', type: 'number' },
  { key: '2', label: '2', type: 'number' },
  { key: '3', label: '3', type: 'number' },
  { key: '+', label: '+', type: 'operator' },

  { key: 'blank1', label: '', type: 'blank' },
  { key: '0', label: '0', type: 'number' },
  { key: '.', label: '.', type: 'number' },
  { key: '=', label: '=', type: 'equals' },
])

function handlePress(key: string) {
  if (key === 'C') {
    clear()
  } else if (key === '±') {
    toggleSign()
  } else if (key === '%') {
    percent()
  } else if (['+', '-', '×', '÷'].includes(key)) {
    pressOperator(key)
  } else if (key === '=') {
    calculate()
  } else if (key === '.') {
    inputDot()
  } else {
    inputNumber(key)
  }
}

function clear() {
  expression.value = ''
  result.value = '0'
  currentInput.value = '0'
  operator.value = ''
  prevValue.value = null
  justCalculated.value = false
}

function toggleSign() {
  const num = parseFloat(currentInput.value)
  if (num !== 0) {
    currentInput.value = String(-num)
    result.value = currentInput.value
  }
}

function percent() {
  const num = parseFloat(currentInput.value)
  currentInput.value = String(num / 100)
  result.value = currentInput.value
}

function inputNumber(key: string) {
  if (justCalculated.value) {
    clear()
  }
  if (currentInput.value === '0' && key !== '.') {
    currentInput.value = key
  } else {
    currentInput.value += key
  }
  result.value = formatNumber(currentInput.value)
}

function inputDot() {
  if (justCalculated.value) {
    clear()
  }
  if (!currentInput.value.includes('.')) {
    currentInput.value += '.'
    result.value = currentInput.value
  }
}

function pressOperator(op: string) {
  if (operator.value && !justCalculated.value) {
    calculate()
  }
  const num = parseFloat(currentInput.value)
  prevValue.value = num
  operator.value = op
  justCalculated.value = false
  currentInput.value = '0'
  expression.value = formatNumber(String(num)) + ' ' + op
}

function getCurrentTimeNumber(): number {
  const now = new Date()
  return now.getHours() * 100 + now.getMinutes()
}

function checkTimeUnlock(input: string): boolean {
  // 支持纯数字输入匹配当前时间（HHMM），例如 14:30 对应 1430
  const num = parseInt(input, 10)
  if (isNaN(num)) return false
  return num === getCurrentTimeNumber()
}

function calculate() {
  // 没有运算符的情况：纯数字输入，检测是否为时间解锁
  if (!operator.value || prevValue.value === null) {
    // console.debug 仅用于开发调试，发布版会移除
    console.debug('[calc] checkTimeUnlock:', currentInput.value, 'target:', getCurrentTimeNumber())
    if (checkTimeUnlock(currentInput.value)) {
      expression.value = '验证通过'
      result.value = '欢迎回来'
      justCalculated.value = true
      setTimeout(() => {
        if (pendingCiphertext.value) {
          uni.reLaunch({ url: getDecryptUrl() })
        } else {
          uni.reLaunch({ url: '/pages/home/index' })
        }
      }, 400)
      return
    }
    return
  }

  const a = prevValue.value
  const b = parseFloat(currentInput.value)
  let calcResult = 0

  switch (operator.value) {
    case '+': calcResult = a + b; break
    case '-': calcResult = a - b; break
    case '×': calcResult = a * b; break
    case '÷': calcResult = b !== 0 ? a / b : NaN; break
  }

  if (isNaN(calcResult) || !isFinite(calcResult)) {
    expression.value = '错误'
    result.value = '不能除以零'
    operator.value = ''
    prevValue.value = null
    currentInput.value = '0'
    justCalculated.value = true
    return
  }

  expression.value = formatNumber(String(a)) + ' ' + operator.value + ' ' + formatNumber(String(b)) + ' ='
  currentInput.value = String(calcResult)
  result.value = formatNumber(currentInput.value)
  operator.value = ''
  prevValue.value = null
  justCalculated.value = true

  // 运算结果匹配时间也触发解锁
  if (checkTimeUnlock(currentInput.value)) {
    expression.value = '验证通过'
    result.value = '欢迎回来'
    justCalculated.value = true
    setTimeout(() => {
      if (pendingCiphertext.value) {
        uni.reLaunch({ url: getDecryptUrl() })
      } else {
        uni.reLaunch({ url: '/pages/home/index' })
      }
    }, 400)
  }
}

function formatNumber(str: string): string {
  const num = parseFloat(str)
  if (isNaN(num)) return '0'
  if (Number.isInteger(num) && Math.abs(num) < 1e15) {
    return String(num)
  }
  // 限制显示位数
  if (String(num).length > 15) {
    return num.toExponential(6)
  }
  return String(num)
}
</script>

<style lang="scss">
.calc {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #0F0F1A;
  padding-bottom: 40rpx;
}

/* 显示区域 */
.display {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
  padding: 60rpx 40rpx 40rpx;
  min-height: 280rpx;
}

.display-expr {
  font-size: 32rpx;
  color: #666680;
  margin-bottom: 16rpx;
  word-break: break-all;
  text-align: right;
  width: 100%;
}

.display-result {
  font-size: 88rpx;
  font-weight: 300;
  color: #FFFFFF;
  word-break: break-all;
  text-align: right;
  width: 100%;
  line-height: 1.1;
}

.display-result.result-small {
  font-size: 60rpx;
}

/* 按键区域 */
.buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
  padding: 0 20rpx 20rpx;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 116rpx;
  border-radius: 58rpx;
  font-size: 40rpx;
  user-select: none;
}

.btn:active {
  opacity: 0.7;
}

.btn--number {
  background: #1A1A2E;
  color: #FFFFFF;
}

.btn--operator {
  background: #7B93FF;
  color: #FFFFFF;
  font-size: 44rpx;
}

.btn--func {
  background: #2A2A3E;
  color: #FFFFFF;
  font-size: 36rpx;
}

.btn--equals {
  background: #7B93FF;
  color: #FFFFFF;
  font-size: 44rpx;
}

.btn--blank {
  background: transparent;
  pointer-events: none;
}

.gate-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9000;
  background: rgba(0, 0, 0, 0.58);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
  box-sizing: border-box;
}

.gate-dialog {
  width: 100%;
  max-width: 620rpx;
  background: #FFFFFF;
  border-radius: 18rpx;
  padding: 44rpx 36rpx 32rpx;
  box-sizing: border-box;
  box-shadow: 0 20rpx 70rpx rgba(0, 0, 0, 0.34);
}

.gate-title {
  display: block;
  color: #111111;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1.35;
  text-align: center;
  margin-bottom: 18rpx;
}

.gate-desc {
  display: block;
  color: #666666;
  font-size: 27rpx;
  line-height: 1.55;
  text-align: center;
  margin-bottom: 34rpx;
}

.gate-input {
  height: 88rpx;
  line-height: 88rpx;
  margin: 10rpx 0 34rpx;
  padding: 0 24rpx;
  border: 1px solid #DDDDDD;
  border-radius: 12rpx;
  background: #F7F7F7;
  color: #111111;
  font-size: 32rpx;
  text-align: center;
  box-sizing: border-box;
}

.gate-actions {
  display: flex;
  gap: 20rpx;
}

.gate-btn {
  flex: 1;
  height: 78rpx;
  line-height: 78rpx;
  margin: 0;
  border-radius: 10rpx;
  font-size: 29rpx;
  border: none;
}

.gate-btn-secondary {
  background: #F1F1F1;
  color: #333333;
}

.gate-btn-primary {
  background: #E1251B;
  color: #FFFFFF;
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
</style>
