const GRID_SIZE = 4
const TILE_STEP = 154

Page({
  data: {
    board: [],
    score: 0,
    bestScore: 0,
    isGameOver: false,
    hasWon: false,
    keepPlaying: false,
    isDark: false,
    tiles: [],
    tileStep: TILE_STEP
  },

  tileId: 0,
  touchStartX: 0,
  touchStartY: 0,
  isMoving: false,

  onLoad() {
    this.initGame()
  },

  onShow() {
    if (this.data.tiles.length === 0) {
      this.initGame()
    }
  },

  initGame() {
    const board = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
    this.setData({
      board,
      score: 0,
      isGameOver: false,
      hasWon: false,
      keepPlaying: false,
      tiles: []
    })
    this.tileId = 0
    this.loadBestScore()
    this.addRandomTile()
    this.addRandomTile()
  },

  loadBestScore() {
    try {
      const saved = wx.getStorageSync('2048-best')
      if (saved) {
        this.setData({
          bestScore: parseInt(saved, 10) || 0
        })
      }

      const savedTheme = wx.getStorageSync('2048-theme')
      if (savedTheme === 'dark') {
        this.setData({
          isDark: true
        })
      }
    } catch (e) {
      console.error('Failed to load from storage:', e)
    }
  },

  saveBestScore() {
    try {
      wx.setStorageSync('2048-best', this.data.bestScore.toString())
    } catch (e) {
      console.error('Failed to save best score:', e)
    }
  },

  saveTheme() {
    try {
      wx.setStorageSync('2048-theme', this.data.isDark ? 'dark' : 'light')
    } catch (e) {
      console.error('Failed to save theme:', e)
    }
  },

  addRandomTile() {
    const board = this.data.board
    const emptyCells = []
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!board[y][x]) {
          emptyCells.push({ x, y })
        }
      }
    }
    if (emptyCells.length === 0) return false

    const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)]
    const value = Math.random() < 0.9 ? 2 : 4
    board[y][x] = {
      id: ++this.tileId,
      value,
      x,
      y,
      isNew: true,
      merged: false
    }

    this.setData({
      board,
      tiles: this.getTiles(board)
    })
    return true
  },

  getTiles(board) {
    const result = []
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = board[y]?.[x]
        if (tile) {
          result.push({ ...tile, x, y })
        }
      }
    }
    return result
  },

  handleTouchStart(e) {
    if (this.data.isGameOver && !this.data.keepPlaying) return
    this.touchStartX = e.touches[0].clientX
    this.touchStartY = e.touches[0].clientY
    this.isMoving = false
  },

  handleTouchEnd(e) {
    if (this.data.isGameOver && !this.data.keepPlaying) return
    if (!this.touchStartX || !this.touchStartY) return

    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY

    const dx = touchEndX - this.touchStartX
    const dy = touchEndY - this.touchStartY

    const minSwipe = 30

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > minSwipe) {
        this.moveInDirection(dx > 0 ? 'right' : 'left')
      }
    } else {
      if (Math.abs(dy) > minSwipe) {
        this.moveInDirection(dy > 0 ? 'down' : 'up')
      }
    }

    this.touchStartX = 0
    this.touchStartY = 0
  },

  moveInDirection(direction) {
    if (this.data.isGameOver && !this.data.keepPlaying) return
    if (this.isMoving) return

    this.isMoving = true

    const board = JSON.parse(JSON.stringify(this.data.board))
    const oldBoard = JSON.stringify(board)
    let scoreGain = 0

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (board[y][x]) {
          board[y][x].merged = false
          board[y][x].isNew = false
        }
      }
    }

    if (direction === 'left') {
      for (let y = 0; y < GRID_SIZE; y++) {
        const row = board[y].filter(t => t !== null)
        const newRow = []
        let i = 0
        while (i < row.length) {
          if (i + 1 < row.length && row[i].value === row[i + 1].value) {
            const merged = {
              id: ++this.tileId,
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
        board[y] = newRow
      }
    } else if (direction === 'right') {
      for (let y = 0; y < GRID_SIZE; y++) {
        const row = board[y].filter(t => t !== null).reverse()
        const newRow = []
        let i = 0
        while (i < row.length) {
          if (i + 1 < row.length && row[i].value === row[i + 1].value) {
            const merged = {
              id: ++this.tileId,
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
        board[y] = newRow.reverse()
      }
    } else if (direction === 'up') {
      for (let x = 0; x < GRID_SIZE; x++) {
        const col = []
        for (let y = 0; y < GRID_SIZE; y++) {
          if (board[y][x]) col.push(board[y][x])
        }
        const newCol = []
        let i = 0
        while (i < col.length) {
          if (i + 1 < col.length && col[i].value === col[i + 1].value) {
            const merged = {
              id: ++this.tileId,
              value: col[i].value * 2,
              x,
              y: newCol.length,
              merged: true,
              isNew: false
            }
            newCol.push(merged)
            scoreGain += merged.value
            i += 2
          } else {
            col[i].x = x
            col[i].y = newCol.length
            newCol.push(col[i])
            i++
          }
        }
        while (newCol.length < GRID_SIZE) newCol.push(null)
        for (let y = 0; y < GRID_SIZE; y++) {
          board[y][x] = newCol[y]
        }
      }
    } else if (direction === 'down') {
      for (let x = 0; x < GRID_SIZE; x++) {
        const col = []
        for (let y = GRID_SIZE - 1; y >= 0; y--) {
          if (board[y][x]) col.push(board[y][x])
        }
        const newCol = []
        let i = 0
        while (i < col.length) {
          if (i + 1 < col.length && col[i].value === col[i + 1].value) {
            const merged = {
              id: ++this.tileId,
              value: col[i].value * 2,
              x,
              y: GRID_SIZE - 1 - newCol.length,
              merged: true,
              isNew: false
            }
            newCol.push(merged)
            scoreGain += merged.value
            i += 2
          } else {
            col[i].x = x
            col[i].y = GRID_SIZE - 1 - newCol.length
            newCol.push(col[i])
            i++
          }
        }
        while (newCol.length < GRID_SIZE) newCol.push(null)
        for (let y = 0; y < GRID_SIZE; y++) {
          board[y][x] = newCol[GRID_SIZE - 1 - y]
        }
      }
    }

    const newBoard = JSON.stringify(board)
    if (newBoard !== oldBoard) {
      const newScore = this.data.score + scoreGain
      this.setData({
        board,
        score: newScore,
        tiles: this.getTiles(board)
      })
      this.updateBestScore()

      setTimeout(() => {
        this.addRandomTile()

        if (!this.data.hasWon && !this.data.keepPlaying) {
          for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
              if (board[y][x]?.value === 2048) {
                this.setData({ hasWon: true })
                this.isMoving = false
                return
              }
            }
          }
        }

        if (!this.canMove(board)) {
          this.setData({ isGameOver: true })
        }
        this.isMoving = false
      }, 160)
    } else {
      this.isMoving = false
    }
  },

  canMove(board) {
    const checkBoard = board || this.data.board
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!checkBoard[y][x]) return true
        if (x < GRID_SIZE - 1 && checkBoard[y][x]?.value === checkBoard[y][x + 1]?.value) return true
        if (y < GRID_SIZE - 1 && checkBoard[y][x]?.value === checkBoard[y + 1][x]?.value) return true
      }
    }
    return false
  },

  updateBestScore() {
    if (this.data.score > this.data.bestScore) {
      this.setData({
        bestScore: this.data.score
      })
      this.saveBestScore()
    }
  },

  toggleTheme() {
    this.setData({
      isDark: !this.data.isDark
    })
    this.saveTheme()
  },

  handleContinue() {
    if (this.data.hasWon && !this.data.keepPlaying) {
      this.setData({
        keepPlaying: true
      })
    }
  },

  handleOverlayTap() {
    if (this.data.isGameOver) {
      this.initGame()
    } else if (this.data.hasWon && !this.data.keepPlaying) {
      this.handleContinue()
    }
  }
})
