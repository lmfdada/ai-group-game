/**
 * AES 加密工具
 *
 * 使用本地内联的 crypto-js（免 npm 依赖，完美兼容小程序）
 *
 * 安全注意事项：
 * - 所有秘密在客户端本地加密
 * - 密钥通过安全渠道分享给信任的好友
 */
import CryptoJS from './crypto-js-lib.js'

// #region debug-point A:module-check
(()=>{const u="http://127.0.0.1:7777/event",s="crypto-miniprogram-encrypt-fail",d={sessionId:s,runId:"pre",hypothesisId:"B",location:"crypto.ts:module",msg:"[DEBUG] CryptoJS module check",data:{typeofCryptoJS:typeof CryptoJS,hasAES:!!(CryptoJS as any)?.AES,hasEnc:!!(CryptoJS as any)?.enc,keys:Object.keys(CryptoJS || {}).slice(0,10)},ts:Date.now()};uni.request({url:u,method:"POST",data:d})})();
// #endregion

// 默认密钥 - 通过安全渠道分享给信任的好友
const DEFAULT_KEY = 'pv-secret-d27654c2ec86daaa38d5547e9c4255c6'

// 过期时间前缀标记和有效期（10分钟）
const EXP_PREFIX = '__EXP__'
const EXPIRY_MS = 10 * 60 * 1000

/**
 * 加密文本（含10分钟有效期）
 */
export function encrypt(text: string, key?: string): string {
  const secretKey = key || DEFAULT_KEY
  try {
    // 嵌入时间戳：__EXP__{timestamp}__{原文}
    const payload = EXP_PREFIX + Date.now() + '__' + text
    const result = CryptoJS.AES.encrypt(payload, secretKey).toString()
    return result
  } catch (e: any) {
    throw e
  }
}

/**
 * 解密文本
 * 解密失败或已过期返回空字符串
 */
export function decrypt(ciphertext: string, key?: string): string {
  try {
    const secretKey = key || DEFAULT_KEY
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey)
    const result = bytes.toString(CryptoJS.enc.Utf8)
    if (!result) return ''

    // 检查是否包含过期时间标记
    if (result.startsWith(EXP_PREFIX)) {
      const rest = result.slice(EXP_PREFIX.length) // "1717489200000__原文"
      const sepIdx = rest.indexOf('__')
      if (sepIdx > 0) {
        const embedTime = parseInt(rest.slice(0, sepIdx), 10)
        if (Date.now() - embedTime > EXPIRY_MS) {
          console.warn('[Crypto] 密文已过期')
          return ''
        }
        // 未过期，返回原文
        return rest.slice(sepIdx + 2)
      }
    }

    // 没有时间戳标记（旧版密文），直接返回
    return result
  } catch (e) {
    console.error('[Crypto] 解密失败:', e)
    return ''
  }
}

/**
 * 获取密钥预览
 */
export function getKeyPreview(): string {
  return DEFAULT_KEY.substring(0, 8) + '...'
}
