# Debug Session: crypto-miniprogram-encrypt-fail

## Status
[OPEN]

## Symptoms
用户点击加密按钮后，弹窗报错「加密失败」，加密功能不可用。Node.js 环境下加解密正常，微信小程序运行时异常。

## Hypotheses

### [A] CryptoJS 随机数生成失败
crypto-js 使用 password-based key derivation，内部需要 `crypto.getRandomValues()` 或 `crypto.randomBytes()` 生成盐值(salt)。微信小程序运行时不提供这些原生加密 API，导致随机数生成函数抛出 `"Native crypto module could not be used to get secure random number."` 错误。

**Evidence needed**: 确认 `CryptoJS.AES.encrypt()` 调用过程中是否抛出与随机数相关的异常。

### [B] CryptoJS 模块未正确加载
构建产物虽然包含了 crypto-js 代码，但导出结构不匹配，运行时 `CryptoJS` 对象可能不包含 `AES` 或 `enc` 子模块。

**Evidence needed**: 确认 `typeof CryptoJS`, `!!CryptoJS.AES`, `!!CryptoJS.enc` 的运行时值。

### [C] CryptoJS.lib 内部依赖缺失
crypto-js 的 UMD → ESM 转换可能破坏了内部模块注册顺序。`CryptoJS.AES` 依赖于 `CryptoJS.lib` 等基础模块，如果模块初始化顺序不对，AES 可能为 undefined。

**Evidence needed**: 检查 `CryptoJS.AES` 是否可调用。

### [D] uni-app 构建过程中 crypto-js 代码被 tree-shaking 移除
虽然 dist 产物中有 crypto-js-lib.js 文件，但工具链可能移除了某些关键路径（如随机数生成分支），导致运行时缺失依赖。

**Evidence needed**: 对比 dist 中的 crypto-js-lib.js 与 src 版本的关键函数是否存在。

## Plan
1. 在 encrypt 页面插入 instrumentation 点（加密前后 + 错误 catch）
2. 在 crypto.ts 中插入模块加载时的探测点
3. 用户重新在微信开发者工具中测试
4. 分析日志确定根因
5. 修复
6. 验证
