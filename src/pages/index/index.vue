<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

let touchStartX = 0
let touchStartY = 0

function handleTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}

function handleTouchEnd(e: TouchEvent) {
  if (!touchStartX || !touchStartY) return

  const touchEndX = e.changedTouches[0].clientX
  const touchEndY = e.changedTouches[0].clientY

  const dx = touchEndX - touchStartX
  const dy = touchEndY - touchStartY

  const minSwipe = 30

  if (Math.abs(dx) > Math.abs(dy)) {
    if (Math.abs(dx) > minSwipe) {
      gameStore.move(dx > 0 ? 'right' : 'left')
    }
  } else {
    if (Math.abs(dy) > minSwipe) {
      gameStore.move(dy > 0 ? 'down' : 'up')
    }
  }

  touchStartX = 0
  touchStartY = 0
}

function handleKeydown(e: KeyboardEvent) {
  const keyMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right'
  }
  if (keyMap[e.key]) {
    e.preventDefault()
    gameStore.move(keyMap[e.key])
  }
}

onMounted(() => {
  gameStore.initGame()
  uni.onKeyDown?.(handleKeydown as any)
})

onUnmounted(() => {
  uni.offKeyDown?.(handleKeydown as any)
})
</script>

<template>
  <view
    class="app-container"
    :class="{ dark: gameStore.isDark }"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <view class="header">
      <view class="logo">
        <text class="title">2048</text>
        <text class="subtitle">Macaron & Night</text>
      </view>
      <view class="header-right">
        <view class="scores">
          <view class="score-box">
            <text class="label">Score</text>
            <text class="value">{{ gameStore.score }}</text>
          </view>
          <view class="score-box">
            <text class="label">Best</text>
            <text class="value">{{ gameStore.bestScore }}</text>
          </view>
        </view>
        <view class="theme-toggle" @tap="gameStore.toggleTheme">
          <text class="icon">{{ gameStore.isDark ? '☀️' : '🌙' }}</text>
        </view>
      </view>
    </view>

    <view class="game-container">
      <view class="controls">
        <button class="btn-new-game" @tap="gameStore.initGame">New Game</button>
        <view class="instructions">
          <text>← ↑ ↓ → to move</text>
        </view>
      </view>

      <view class="board">
        <view v-for="i in 16" :key="i" class="cell"></view>

        <view class="tiles-container">
          <view
            v-for="tile in gameStore.tiles"
            :key="tile.id"
            class="tile"
            :class="[
              `tile-${tile.value}`,
              { 'tile-new': tile.isNew, 'tile-merged': tile.merged }
            ]"
            :style="{
              transform: `translate(${tile.x * (gameStore.cellSize + gameStore.gap)}rpx, ${tile.y * (gameStore.cellSize + gameStore.gap)}rpx)`
            }"
          >
            {{ tile.value }}
          </view>
        </view>

        <view v-if="gameStore.isGameOver" class="game-overlay" @tap="gameStore.initGame">
          <text class="message">Game Over</text>
          <text class="sub-message">Score: {{ gameStore.score }}</text>
        </view>

        <view v-if="gameStore.hasWon && !gameStore.keepPlaying" class="game-overlay" @tap="gameStore.handleContinue">
          <text class="message">You Win!</text>
          <text class="sub-message">Tap to continue</text>
        </view>
      </view>
    </view>

    <view class="footer">
      <text>Join the numbers and get to 2048!</text>
    </view>
  </view>
</template>

<style lang="scss">
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx;
  background: var(--bg);
  transition: background 400ms ease;

  &.dark {
    background: var(--night-bg);

    .board {
      background: var(--night-grid);
      box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.4);
    }

    .cell {
      background: var(--night-cell);
    }

    .score-box {
      background: var(--night-grid);

      &::before {
        background: linear-gradient(90deg, var(--night-primary), var(--night-accent));
      }

      .value {
        color: var(--night-text);
      }

      .label {
        color: var(--night-text-light);
      }
    }

    .title {
      background: linear-gradient(135deg, var(--night-primary), var(--night-accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      color: transparent;
    }

    .subtitle {
      color: var(--night-text-light);
    }

    .btn-new-game {
      background: var(--night-primary);
      color: var(--night-bg);
      box-shadow: 0 4rpx 12rpx rgba(136, 216, 176, 0.3);
    }

    .instructions {
      color: var(--night-text-light);
    }

    .footer text {
      color: var(--night-text-light);
    }

    .game-overlay {
      background: rgba(26, 26, 46, 0.95);

      .message {
        background: linear-gradient(135deg, var(--night-primary), var(--night-accent));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .sub-message {
        color: var(--night-text-light);
      }
    }

    .theme-toggle {
      background: var(--night-grid);

      &::before {
        background: var(--night-primary);
      }
    }
  }
}

.header {
  width: 100%;
  max-width: 500rpx;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 40rpx;
}

.logo {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.title {
  font-family: 'Outfit', sans-serif;
  font-size: 80rpx;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
}

.subtitle {
  font-family: 'Outfit', sans-serif;
  font-size: 24rpx;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-light);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.theme-toggle {
  width: 56rpx;
  height: 32rpx;
  background: var(--grid);
  border-radius: 16rpx;
  position: relative;

  .icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 24rpx;
  }
}

.scores {
  display: flex;
  gap: 12rpx;
}

.score-box {
  background: var(--grid);
  border-radius: 8rpx;
  padding: 8rpx 16rpx;
  min-width: 120rpx;
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6rpx;
    background: linear-gradient(90deg, var(--primary), var(--accent));
  }

  .label {
    font-family: 'Outfit', sans-serif;
    font-size: 20rpx;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-light);
    display: block;
  }

  .value {
    font-family: 'Outfit', sans-serif;
    font-size: 36rpx;
    font-weight: 700;
    color: var(--text);
    display: block;
  }
}

.game-container {
  width: 100%;
  max-width: calc(95rpx * 4 + 12rpx * 5);
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.btn-new-game {
  font-family: 'Outfit', sans-serif;
  font-size: 28rpx;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: var(--primary);
  color: white;
  border: none;
  padding: 24rpx 48rpx;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(255, 112, 146, 0.3);
}

.instructions {
  font-size: 24rpx;
  color: var(--text-light);
}

.board {
  background: var(--grid);
  border-radius: 24rpx;
  padding: 12rpx;
  display: grid;
  grid-template-columns: repeat(4, 95rpx);
  grid-template-rows: repeat(4, 95rpx);
  gap: 12rpx;
  position: relative;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1);
}

.cell {
  background: var(--cell);
  border-radius: 16rpx;
  transition: background 300ms ease;
}

.tiles-container {
  position: absolute;
  top: 12rpx;
  left: 12rpx;
  right: 12rpx;
  bottom: 12rpx;
  pointer-events: none;
}

.tile {
  position: absolute;
  width: 95rpx;
  height: 95rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 48rpx;
  transition: transform 150ms ease-out;
  will-change: transform;

  &.tile-new {
    animation: tile-appear 150ms ease-out;
  }

  &.tile-merged {
    animation: tile-pop 100ms ease-out;
  }
}

@keyframes tile-appear {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes tile-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.tile-2 { background: var(--tile-2); color: var(--tile-text-dark); box-shadow: 0 4rpx 0 var(--tile-shadow-2); }
.tile-4 { background: var(--tile-4); color: var(--tile-text-dark); box-shadow: 0 4rpx 0 var(--tile-shadow-4); }
.tile-8 { background: var(--tile-8); color: var(--tile-text-light); box-shadow: 0 4rpx 0 var(--tile-shadow-8); }
.tile-16 { background: var(--tile-16); color: var(--tile-text-light); box-shadow: 0 4rpx 0 var(--tile-shadow-16); }
.tile-32 { background: var(--tile-32); color: var(--tile-text-light); box-shadow: 0 4rpx 0 var(--tile-shadow-32); }
.tile-64 { background: var(--tile-64); color: var(--tile-text-light); box-shadow: 0 4rpx 0 var(--tile-shadow-64); }
.tile-128 { background: var(--tile-128); color: var(--tile-text-dark); box-shadow: 0 4rpx 0 var(--tile-shadow-128), 0 0 20rpx var(--glow-128); font-size: 40rpx; }
.tile-256 { background: var(--tile-256); color: var(--tile-text-dark); box-shadow: 0 4rpx 0 var(--tile-shadow-256), 0 0 25rpx var(--glow-256); font-size: 40rpx; }
.tile-512 { background: var(--tile-512); color: var(--tile-text-light); box-shadow: 0 4rpx 0 var(--tile-shadow-512), 0 0 30rpx var(--glow-512); font-size: 40rpx; }
.tile-1024 { background: var(--tile-1024); color: var(--tile-text-light); box-shadow: 0 4rpx 0 var(--tile-shadow-1024), 0 0 40rpx var(--glow-1024); font-size: 32rpx; }
.tile-2048 { background: var(--tile-2048); color: var(--tile-text-light); box-shadow: 0 4rpx 0 var(--tile-shadow-2048), 0 0 50rpx var(--glow-2048); font-size: 32rpx; }

.game-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 248, 249, 0.95);
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  backdrop-filter: blur(8rpx);

  .message {
    font-family: 'Outfit', sans-serif;
    font-size: 64rpx;
    font-weight: 800;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .sub-message {
    font-size: 28rpx;
    color: var(--text-light);
  }
}

.footer {
  margin-top: 48rpx;
  text-align: center;

  text {
    font-size: 24rpx;
    color: var(--text-light);
  }
}
</style>
