<template>
  <view class="page">
    <!-- 顶部品牌区 -->
    <view class="hero">
      <view class="hero-content">
        <text class="hero-title">AI Group Game</text>
        <text class="hero-subtitle">智能分组，快乐游戏</text>
      </view>
    </view>

    <!-- 功能入口卡片 -->
    <view class="section">
      <view class="section-title">
        <text class="section-title-text">功能入口</text>
      </view>
      <view class="card-grid">
        <view
          v-for="item in features"
          :key="item.id"
          class="card"
          hover-class="card-hover"
          @tap="handleFeatureTap(item)"
        >
          <view class="card-icon" :style="{ backgroundColor: item.color }">
            <text class="card-icon-text">{{ item.icon }}</text>
          </view>
          <text class="card-name">{{ item.name }}</text>
          <text class="card-desc">{{ item.desc }}</text>
        </view>
      </view>
    </view>

    <!-- 最近活动 -->
    <view class="section">
      <view class="section-title">
        <text class="section-title-text">最近活动</text>
        <text class="section-more" @tap="handleMore">查看更多</text>
      </view>
      <view v-if="activities.length > 0" class="activity-list">
        <view
          v-for="item in activities"
          :key="item.id"
          class="activity-item"
          hover-class="activity-hover"
          @tap="handleActivityTap(item)"
        >
          <image
            class="activity-img"
            :src="item.image"
            mode="aspectFill"
          />
          <view class="activity-info">
            <text class="activity-name">{{ item.name }}</text>
            <text class="activity-meta">{{ item.time }} · {{ item.players }}人参与</text>
          </view>
        </view>
      </view>
      <view v-else class="empty">
        <text class="empty-text">暂无活动，快去创建一个吧</text>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="footer">
      <button class="btn-primary" @tap="handleCreate">
        <text class="btn-text">创建新活动</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 功能入口数据
const features = ref([
  {
    id: 1,
    name: '随机分组',
    icon: '🎲',
    color: '#4F6EF7',
    desc: '智能均衡分组'
  },
  {
    id: 2,
    name: '组队匹配',
    icon: '🤝',
    color: '#FF7D00',
    desc: '快速匹配队友'
  },
  {
    id: 3,
    name: '活动创建',
    icon: '📋',
    color: '#00B42A',
    desc: '自定义游戏活动'
  }
])

// 最近活动数据
const activities = ref([])

const fetchActivities = () => {
  activities.value = [
    {
      id: 1,
      name: '王者荣耀内战',
      image: 'https://picsum.photos/id/160/300/200',
      time: '2024-01-15',
      players: 10
    },
    {
      id: 2,
      name: '狼人杀之夜',
      image: 'https://picsum.photos/id/119/300/200',
      time: '2024-01-14',
      players: 12
    },
    {
      id: 3,
      name: '桌游大乱斗',
      image: 'https://picsum.photos/id/201/300/200',
      time: '2024-01-13',
      players: 8
    }
  ]
}

const handleFeatureTap = (item) => {
  uni.showToast({
    title: `${item.name} - 开发中`,
    icon: 'none'
  })
}

const handleActivityTap = (item) => {
  uni.showToast({
    title: item.name,
    icon: 'none'
  })
}

const handleMore = () => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const handleCreate = () => {
  uni.showToast({
    title: '创建功能开发中',
    icon: 'none'
  })
}

onMounted(() => {
  fetchActivities()
})
</script>

<style lang="scss">
.page {
  min-height: 100vh;
  padding-bottom: 120rpx;
}

.hero {
  background: linear-gradient(135deg, #4F6EF7 0%, #7B93FF 100%);
  padding: 64rpx 32rpx 80rpx;
  border-radius: 0 0 32rpx 32rpx;
}

.hero-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: 2rpx;
}

.hero-subtitle {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 16rpx;
}

.section {
  padding: 0 32rpx;
  margin-top: 32rpx;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title-text {
  font-size: 34rpx;
  font-weight: 600;
  color: #1D2129;
}

.section-more {
  font-size: 24rpx;
  color: #86909C;
}

.card-grid {
  display: flex;
  gap: 24rpx;
}

.card {
  flex: 1;
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 32rpx 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
}

.card-hover {
  opacity: 0.9;
  transform: scale(0.96);
}

.card-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
}

.card-icon-text {
  font-size: 40rpx;
}

.card-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #1D2129;
  margin-bottom: 8rpx;
}

.card-desc {
  font-size: 22rpx;
  color: #86909C;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.activity-item {
  display: flex;
  background: #FFFFFF;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.activity-hover {
  opacity: 0.95;
}

.activity-img {
  width: 200rpx;
  height: 160rpx;
  flex-shrink: 0;
}

.activity-info {
  flex: 1;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.activity-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #1D2129;
  margin-bottom: 12rpx;
}

.activity-meta {
  font-size: 24rpx;
  color: #86909C;
}

.empty {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 64rpx 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.empty-text {
  font-size: 28rpx;
  color: #86909C;
}

.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx 32rpx 32rpx;
  background: linear-gradient(transparent, #F5F6FA 20%);
}

.btn-primary {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: linear-gradient(135deg, #4F6EF7 0%, #7B93FF 100%);
  border: none;
  border-radius: 48rpx;
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: 500;
  text-align: center;
  box-shadow: 0 4rpx 20rpx rgba(79, 110, 247, 0.4);
}

.btn-primary:active {
  opacity: 0.9;
}

.btn-text {
  color: #FFFFFF;
}
</style>
