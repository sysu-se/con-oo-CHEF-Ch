const SIZE = 9
const BOX = 3
const EMPTY = 0

function deepCopyGrid(grid) {
  return grid.map(row => row.slice())
}

function assertGridShape(grid) {
  if (!Array.isArray(grid) || grid.length !== SIZE) {
    throw new Error(`Invalid grid: must be ${SIZE}x${SIZE}`)
  }
  for (const row of grid) {
    if (!Array.isArray(row) || row.length !== SIZE) {
      throw new Error(`Invalid grid: must be ${SIZE}x${SIZE}`)
    }
  }
}

function assertCellValue(v) {
  if (!Number.isInteger(v) || v < 0 || v > 9) {
    throw new Error('Invalid cell value: must be integer in [0, 9]')
  }
}

function validateGridValues(grid) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      assertCellValue(grid[r][c])
    }
  }
}

function inRange(row, col) {
  return (
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    row < SIZE &&
    col >= 0 &&
    col < SIZE
  )
}

function hasConflictAt(grid, row, col) {
  const val = grid[row][col]
  if (val === EMPTY) return false

  // row
  for (let c = 0; c < SIZE; c++) {
    if (c !== col && grid[row][c] === val) return true
  }

  // col
  for (let r = 0; r < SIZE; r++) {
    if (r !== row && grid[r][col] === val) return true
  }

  // box
  const br = Math.floor(row / BOX) * BOX
  const bc = Math.floor(col / BOX) * BOX
  for (let r = br; r < br + BOX; r++) {
    for (let c = bc; c < bc + BOX; c++) {
      if ((r !== row || c !== col) && grid[r][c] === val) return true
    }
  }

  return false
}

function collectInvalidCells(grid) {
  const invalid = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] !== EMPTY && hasConflictAt(grid, r, c)) {
        invalid.push({ row: r, col: c })
      }
    }
  }
  return invalid
}

function isSolved(grid) {
  // every cell filled and no conflict
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === EMPTY) return false
    }
  }
  return collectInvalidCells(grid).length === 0
}

export function createSudoku(input, options = {}) {
  assertGridShape(input)
  validateGridValues(input)

  // 默认：初始非 0 为固定格
  const fixed =
    options.fixed ??
    input.map(row => row.map(v => v !== EMPTY))

  assertGridShape(fixed)

  let grid = deepCopyGrid(input)

  // 初始盘面自身也要合法
  const initInvalid = collectInvalidCells(grid)
  if (initInvalid.length > 0) {
    throw new Error('Invalid initial grid: contains conflicts')
  }

  return {
    getGrid() {
      return deepCopyGrid(grid)
    },

    isFixedCell(row, col) {
      if (!inRange(row, col)) throw new Error('Cell out of range')
      return !!fixed[row][col]
    },

    canPlace(row, col, value) {
      if (!inRange(row, col)) return false
      if (!Number.isInteger(value) || value < 0 || value > 9) return false
      if (fixed[row][col]) return false

      const next = deepCopyGrid(grid)
      next[row][col] = value
      return !hasConflictAt(next, row, col)
    },

    guess(move) {
      const { row, col, value } = move ?? {}

      if (!inRange(row, col)) {
        throw new Error('Invalid move: row/col out of range')
      }
      if (!Number.isInteger(value) || value < 0 || value > 9) {
        throw new Error('Invalid move: value must be integer in [0, 9]')
      }
      if (fixed[row][col]) {
        throw new Error('Invalid move: fixed clue cell cannot be modified')
      }

      const next = deepCopyGrid(grid)
      next[row][col] = value

      if (value !== EMPTY && hasConflictAt(next, row, col)) {
        throw new Error('Invalid move: violates sudoku constraints')
      }

      grid = next
      return this
    },

    getInvalidCells() {
      return collectInvalidCells(grid)
    },

    isSolved() {
      return isSolved(grid)
    },

    clone() {
      return createSudoku(this.getGrid(), { fixed: fixed.map(row => row.slice()) })
    },

    toJSON() {
      return {
        grid: this.getGrid(),
        fixed: fixed.map(row => row.slice())
      }
    },

    toString() {
      return grid.map(row => row.join(' ')).join('\n')
    }
  }
}

export function createSudokuFromJSON(json) {
  if (!json || typeof json !== 'object') {
    throw new Error('Invalid sudoku JSON')
  }
  const { grid, fixed } = json
  return createSudoku(grid, { fixed })
}