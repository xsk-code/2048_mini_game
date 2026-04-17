import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Tile {
  id: number
  value: number
  x: number
  y: number
  isNew: boolean
  merged: boolean
}

export const useGameStore = defineStore('game', () => {
  const GRID_SIZE = 4
  const CELL_SIZE = 95
  const GAP = 12

  const board = ref<(Tile | null)[][]>([])
  const score = ref(0)
  const bestScore = ref(0)
  const isGameOver = ref(false)
  const hasWon = ref(false)
  const keepPlaying = ref(false)
  const isDark = ref(false)
  let tileId = 0

  const tiles = computed(() => {
    const result: Tile[] = []
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = board.value[y]?.[x]
        if (tile) {
          result.push({ ...tile, x, y })
        }
      }
    }
    return result
  })

  function initGame() {
    board.value = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
    score.value = 0
    isGameOver.value = false
    hasWon.value = false
    keepPlaying.value = false
    tileId = 0

    loadBestScore()
    addRandomTile()
    addRandomTile()
  }

  function loadBestScore() {
    try {
      const saved = uni.getStorageSync('2048-best')
      if (saved) {
        bestScore.value = parseInt(saved as string, 10) || 0
      }

      const savedTheme = uni.getStorageSync('2048-theme')
      if (savedTheme === 'dark') {
        isDark.value = true
      }
    } catch (e) {
      console.error('Failed to load from storage:', e)
    }
  }

  function saveBestScore() {
    try {
      uni.setStorageSync('2048-best', bestScore.value.toString())
    } catch (e) {
      console.error('Failed to save best score:', e)
    }
  }

  function saveTheme() {
    try {
      uni.setStorageSync('2048-theme', isDark.value ? 'dark' : 'light')
    } catch (e) {
      console.error('Failed to save theme:', e)
    }
  }

  function addRandomTile(): boolean {
    const emptyCells: { x: number; y: number }[] = []
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!board.value[y][x]) {
          emptyCells.push({ x, y })
        }
      }
    }
    if (emptyCells.length === 0) return false

    const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)]
    const value = Math.random() < 0.9 ? 2 : 4
    board.value[y][x] = {
      id: ++tileId,
      value,
      x,
      y,
      isNew: true,
      merged: false
    }
    return true
  }

  function move(direction: 'left' | 'right' | 'up' | 'down') {
    if (isGameOver.value && !keepPlaying.value) return

    const oldBoard = JSON.stringify(board.value)
    let scoreGain = 0

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (board.value[y][x]) {
          board.value[y][x]!.merged = false
        }
      }
    }

    if (direction === 'left') {
      for (let y = 0; y < GRID_SIZE; y++) {
        const row = board.value[y].filter(t => t !== null)
        const newRow: (Tile | null)[] = []
        let i = 0
        while (i < row.length) {
          if (i + 1 < row.length && row[i].value === row[i + 1].value) {
            const merged: Tile = {
              id: ++tileId,
              value: row[i].value * 2,
              x: newRow.length,
              y,
              merged: true,
              isNew: false
            }
            newRow.push(merged)
            scoreGain += merged.value
            i += 2
          } else {
            row[i].x = newRow.length
            row[i].y = y
            newRow.push(row[i])
            i++
          }
        }
        while (newRow.length < GRID_SIZE) newRow.push(null)
        board.value[y] = newRow
      }
    } else if (direction === 'right') {
      for (let y = 0; y < GRID_SIZE; y++) {
        const row = board.value[y].filter(t => t !== null).reverse()
        const newRow: (Tile | null)[] = []
        let i = 0
        while (i < row.length) {
          if (i + 1 < row.length && row[i].value === row[i + 1].value) {
            const merged: Tile = {
              id: ++tileId,
              value: row[i].value * 2,
              x: GRID_SIZE - 1 - newRow.length,
              y,
              merged: true,
              isNew: false
            }
            newRow.push(merged)
            scoreGain += merged.value
            i += 2
          } else {
            row[i].x = GRID_SIZE - 1 - newRow.length
            row[i].y = y
            newRow.push(row[i])
            i++
          }
        }
        while (newRow.length < GRID_SIZE) newRow.push(null)
        board.value[y] = newRow.reverse()
      }
    } else if (direction === 'up') {
      for (let x = 0; x < GRID_SIZE; x++) {
        const col: (Tile | null)[] = []
        for (let y = 0; y < GRID_SIZE; y++) {
          if (board.value[y][x]) col.push(board.value[y][x])
        }
        const newCol: (Tile | null)[] = []
        let i = 0
        while (i < col.length) {
          if (i + 1 < col.length && col[i]!.value === col[i + 1]!.value) {
            const merged: Tile = {
              id: ++tileId,
              value: col[i]!.value * 2,
              x,
              y: newCol.length,
              merged: true,
              isNew: false
            }
            newCol.push(merged)
            scoreGain += merged.value
            i += 2
          } else {
            col[i]!.x = x
            col[i]!.y = newCol.length
            newCol.push(col[i])
            i++
          }
        }
        while (newCol.length < GRID_SIZE) newCol.push(null)
        for (let y = 0; y < GRID_SIZE; y++) {
          board.value[y][x] = newCol[y]
        }
      }
    } else if (direction === 'down') {
      for (let x = 0; x < GRID_SIZE; x++) {
        const col: (Tile | null)[] = []
        for (let y = GRID_SIZE - 1; y >= 0; y--) {
          if (board.value[y][x]) col.push(board.value[y][x])
        }
        const newCol: (Tile | null)[] = []
        let i = 0
        while (i < col.length) {
          if (i + 1 < col.length && col[i]!.value === col[i + 1]!.value) {
            const merged: Tile = {
              id: ++tileId,
              value: col[i]!.value * 2,
              x,
              y: GRID_SIZE - 1 - newCol.length,
              merged: true,
              isNew: false
            }
            newCol.push(merged)
            scoreGain += merged.value
            i += 2
          } else {
            col[i]!.x = x
            col[i]!.y = GRID_SIZE - 1 - newCol.length
            newCol.push(col[i])
            i++
          }
        }
        while (newCol.length < GRID_SIZE) newCol.push(null)
        for (let y = 0; y < GRID_SIZE; y++) {
          board.value[y][x] = newCol[GRID_SIZE - 1 - y]
        }
      }
    }

    const newBoard = JSON.stringify(board.value)
    if (newBoard !== oldBoard) {
      score.value += scoreGain
      updateBestScore()

      setTimeout(() => {
        addRandomTile()

        if (!hasWon.value && !keepPlaying.value) {
          for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
              if (board.value[y][x]?.value === 2048) {
                hasWon.value = true
                return
              }
            }
          }
        }

        if (!canMove()) {
          isGameOver.value = true
        }
      }, 160)
    }
  }

  function canMove(): boolean {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!board.value[y][x]) return true
        if (x < GRID_SIZE - 1 && board.value[y][x]?.value === board.value[y][x + 1]?.value) return true
        if (y < GRID_SIZE - 1 && board.value[y][x]?.value === board.value[y + 1][x]?.value) return true
      }
    }
    return false
  }

  function updateBestScore() {
    if (score.value > bestScore.value) {
      bestScore.value = score.value
      saveBestScore()
    }
  }

  function toggleTheme() {
    isDark.value = !isDark.value
    saveTheme()
  }

  function handleContinue() {
    if (hasWon.value && !keepPlaying.value) {
      keepPlaying.value = true
    }
  }

  return {
    board,
    score,
    bestScore,
    isGameOver,
    hasWon,
    keepPlaying,
    isDark,
    tiles,
    cellSize: CELL_SIZE,
    gap: GAP,
    initGame,
    move,
    toggleTheme,
    handleContinue
  }
})
