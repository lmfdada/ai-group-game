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
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const expression = ref('')
const result = ref('0')

// 从分享卡片携带的密文参数（需要先时间验证，再跳转解密页）
const pendingCiphertext = ref('')

onLoad((query) => {
  // 从路由参数获取密文
  if (query?.c) {
    pendingCiphertext.value = query.c
    console.debug('[calc] 从路由参数获取密文')
  }
  // 兜底：从入口参数获取（某些场景路由参数可能为空）
  if (!pendingCiphertext.value) {
    try {
      const enterOptions = uni.getEnterOptionsSync()
      if (enterOptions?.query?.c) {
        pendingCiphertext.value = enterOptions.query.c as string
        console.debug('[calc] 从入口参数获取密文')
      }
    } catch (e) {
      // 静默
    }
  }
  if (pendingCiphertext.value) {
    console.debug('[calc] 已捕获密文参数，等待时间验证')
  }
})
const currentInput = ref('0')
const operator = ref('')
const prevValue = ref<number | null>(null)
const justCalculated = ref(false)

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
          uni.reLaunch({ url: '/pages/decrypt/index?c=' + pendingCiphertext.value })
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
        uni.reLaunch({ url: '/pages/decrypt/index?c=' + pendingCiphertext.value })
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
</style>
