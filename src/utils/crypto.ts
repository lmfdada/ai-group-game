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

/**
 * 加密文本
 */
export function encrypt(text: string, key?: string): string {
  const secretKey = key || DEFAULT_KEY
  try {
    const result = CryptoJS.AES.encrypt(text, secretKey).toString()
    // #region debug-point A:encrypt-success
    ;(()=>{uni.request({url:"http://127.0.0.1:7777/event",method:"POST",data:{sessionId:"crypto-miniprogram-encrypt-fail",runId:"pre",hypothesisId:"A",location:"crypto.ts:encrypt",msg:"[DEBUG] encrypt success",data:{textLength:text.length,resultLength:result.length},ts:Date.now()}})})();
    // #endregion
    return result
  } catch (e: any) {
    // #region debug-point A:encrypt-error
    ;(()=>{uni.request({url:"http://127.0.0.1:7777/event",method:"POST",data:{sessionId:"crypto-miniprogram-encrypt-fail",runId:"pre",hypothesisId:"A",location:"crypto.ts:encrypt-catch",msg:"[DEBUG] encrypt threw",data:{errorMessage:e?.message,errorStack:e?.stack,errorType:e?.constructor?.name,errorString:String(e)},ts:Date.now()}})})();
    // #endregion
    throw e
  }
}

/**
 * 解密文本
 * 解密失败返回空字符串
 */
export function decrypt(ciphertext: string, key?: string): string {
  try {
    const secretKey = key || DEFAULT_KEY
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey)
    const result = bytes.toString(CryptoJS.enc.Utf8)
    if (!result) return ''
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
