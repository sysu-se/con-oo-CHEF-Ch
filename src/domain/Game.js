import { createSudokuFromJSON } from './Sudoku.js'

function deepCloneJSON(v) {
  return JSON.parse(JSON.stringify(v))
}

function snapshotSudoku(sudoku) {
  return deepCloneJSON(sudoku.toJSON())
}

/**
 * @param {Object} params
 * @param {Object} params.sudoku - Sudoku domain object
 * @param {Array} [params.undoStack=[]] - serialized sudoku snapshots
 * @param {Array} [params.redoStack=[]] - serialized sudoku snapshots
 */
export function createGame({ sudoku, undoStack = [], redoStack = [] }) {
  if (!sudoku || typeof sudoku.toJSON !== 'function' || typeof sudoku.guess !== 'function') {
    throw new Error('Invalid sudoku instance')
  }
  if (!Array.isArray(undoStack) || !Array.isArray(redoStack)) {
    throw new Error('Invalid history stacks: must be arrays')
  }

  // 防御性复制：避免外部别名污染
  let currentSudoku = createSudokuFromJSON(snapshotSudoku(sudoku))

  // 防御性复制：避免与外部数组共享引用
  let _undoStack = deepCloneJSON(undoStack)
  let _redoStack = deepCloneJSON(redoStack)

  return {
    // 返回副本，守住聚合边界
    getSudoku() {
      return createSudokuFromJSON(snapshotSudoku(currentSudoku))
    },

    getGrid() {
      return currentSudoku.getGrid()
    },

    guess(move) {
      const before = snapshotSudoku(currentSudoku)
      // 先尝试执行，只有成功才写历史
      currentSudoku.guess(move)
      _undoStack.push(before)
      _redoStack = []
    },

    undo() {
      if (_undoStack.length === 0) return false
      _redoStack.push(snapshotSudoku(currentSudoku))
      currentSudoku = createSudokuFromJSON(_undoStack.pop())
      return true
    },

    redo() {
      if (_redoStack.length === 0) return false
      _undoStack.push(snapshotSudoku(currentSudoku))
      currentSudoku = createSudokuFromJSON(_redoStack.pop())
      return true
    },

    canUndo() {
      return _undoStack.length > 0
    },

    canRedo() {
      return _redoStack.length > 0
    },

    isSolved() {
      return currentSudoku.isSolved()
    },

    getInvalidCells() {
      return currentSudoku.getInvalidCells()
    },

    toJSON() {
      // 返回纯快照，不泄露内部引用
      return {
        sudoku: snapshotSudoku(currentSudoku),
        undoStack: deepCloneJSON(_undoStack),
        redoStack: deepCloneJSON(_redoStack)
      }
    }
  }
}

export function createGameFromJSON(json) {
  if (!json || typeof json !== 'object') {
    throw new Error('Invalid game JSON')
  }

  const { sudoku, undoStack = [], redoStack = [] } = json

  if (!sudoku) {
    throw new Error('Invalid game JSON: missing sudoku')
  }
  if (!Array.isArray(undoStack) || !Array.isArray(redoStack)) {
    throw new Error('Invalid game JSON: undoStack/redoStack must be arrays')
  }

  // 校验每个历史快照可反序列化为合法 Sudoku
  for (const snap of undoStack) createSudokuFromJSON(snap)
  for (const snap of redoStack) createSudokuFromJSON(snap)

  return createGame({
    sudoku: createSudokuFromJSON(sudoku),
    undoStack,
    redoStack
  })
}