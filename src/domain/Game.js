import { createSudokuFromJSON } from './Sudoku.js'

export function createGame({ sudoku }) {
  let currentSudoku = sudoku
  let undoStack = []
  let redoStack = []

  return {
    getSudoku() {
      return currentSudoku
    },

    guess(move) {
      undoStack.push(currentSudoku.toJSON())
      redoStack = []
      currentSudoku.guess(move)
    },

    undo() {
      if (undoStack.length === 0) return
      redoStack.push(currentSudoku.toJSON())
      currentSudoku = createSudokuFromJSON(undoStack.pop())
    },

    redo() {
      if (redoStack.length === 0) return
      undoStack.push(currentSudoku.toJSON())
      currentSudoku = createSudokuFromJSON(redoStack.pop())
    },

    canUndo() {
      return undoStack.length > 0
    },

    canRedo() {
      return redoStack.length > 0
    },

    toJSON() {
      return {
        sudoku: currentSudoku.toJSON(),
        undoStack,
        redoStack
      }
    }
  }
}

export function createGameFromJSON(json) {
  const game = createGame({
    sudoku: createSudokuFromJSON(json.sudoku)
  })
  return game
}