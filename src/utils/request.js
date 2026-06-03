import axios from 'axios'

// 创建 axios 实例
const request = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 可在此添加 token
    // const token = uni.getStorageSync('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    console.log('[Request]', config.method?.toUpperCase(), config.url, config.params || config.data)
    return config
  },
  (error) => {
    console.error('[Request Error]', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data
    console.log('[Response]', response.config.url, res)
    if (res.code !== 0) {
      uni.showToast({
        title: res.message || '请求失败',
        icon: 'none'
      })
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    console.error('[Response Error]', error)
    const message = error.response?.data?.message || error.message || '网络错误'
    uni.showToast({
      title: message,
      icon: 'none'
    })
    return Promise.reject(error)
  }
)

export default request
