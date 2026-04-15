export function createSudoku(input) {
  let grid = input.map(row => row.slice())

  return {
    getGrid() {
      return grid.map(row => row.slice())
    },

    guess(move) {
      const { row, col, value } = move
      grid[row][col] = value
    },

    clone() {
      return createSudoku(this.getGrid())
    },

    toJSON() {
      return {
        grid: this.getGrid()
      }
    },

    toString() {
      return grid.map(row => row.join(' ')).join('\n')
    }
  }
}

export function createSudokuFromJSON(json) {
  return createSudoku(json.grid)
}