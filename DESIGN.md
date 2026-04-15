# Homework 1.1 DESIGN

## 1. 目标

本次改造目标是将领域对象（`Sudoku`、`Game`）真正接入 Svelte 应用流程，形成：

**UI 触发行为 → 领域对象处理规则/流程 → store 发布状态 → UI 响应更新**

而不是在组件里直接堆业务逻辑。

---

## 2. 分层设计

### 2.1 Domain 层

- `src/domain/Sudoku.js`
  - 建模数独规则与盘面约束；
  - 提供 `guess()`、`canPlace()`、`getInvalidCells()`、`isSolved()`、`toJSON()` 等能力；
  - 处理固定格（`fixed`）不可修改约束。

- `src/domain/Game.js`
  - 建模游戏过程与历史（`undoStack` / `redoStack`）；
  - 在 `guess()` 时记录快照并清空 redo；
  - `undo()` / `redo()` 可回退/重做；
  - 通过 `toJSON()` 输出可序列化状态。

### 2.2 Store / Adapter 层

- `@sudoku/stores/game` 向 UI 提供 `gameState`、`gamePaused`、`gameWon`；
- `gameState` 聚合了渲染需要的盘面、候选、冲突及历史能力（如 `canUndo/canRedo`）；
- 负责把领域状态转成 Svelte 可订阅状态。

### 2.3 View 层

- `App.svelte`：应用启动与弹窗流程控制，订阅 `gameWon`。
- `Board/index.svelte`：只负责渲染，主要消费 `$gameState`。
- `Keyboard.svelte`：输入行为通过 `inputNumber` 进入领域流程。
- `Actions.svelte`：Undo/Redo/Hint 通过 `undo/redo/applyHint` 进入领域流程。

---

## 3. 关键交互链路

### 3.1 数字输入

`Keyboard.svelte` 调用 `inputNumber($cursor, num, $notes)`，  
而不是直接 `userGrid.set(...)`。  
这样输入校验、历史记录、候选处理可以统一在领域流程里完成。

### 3.2 撤销 / 重做

`Actions.svelte` 调用 `undo()` / `redo()`，并通过 `$gameState.canUndo` / `$gameState.canRedo` 控制按钮可用性。  
历史管理逻辑集中在 `Game` 领域对象与其适配流程中。

### 3.3 胜利与暂停

`App.svelte` 订阅 `gameWon`，胜利时调用 `game.pause()` 并弹出 `gameover`。  
暂停/恢复行为由 `game` 统一提供入口。

---

## 4. 响应式机制说明

本项目使用 Svelte store 响应式：

1. 组件通过 `$store` 订阅状态（如 `$gameState`）。
2. 领域操作触发状态变更后，store 使用 `set/update` 发布新值。
3. 组件自动重渲染。

这保证了“领域变更 → 视图同步”链路稳定，避免 UI 自己维护重复状态。

---

## 5. 相比 HW1 的改进

1. **职责更清晰**：规则在 `Sudoku`，流程在 `Game`，UI 只触发行为与渲染。
2. **交互更统一**：输入/提示/撤销重做统一走 `@sudoku/game` 入口。
3. **可维护性提升**：新增规则或模式时，优先改 domain/adapter，减少 UI 散改。
4. **可测试性提升**：`Sudoku` 和 `Game` 为纯 JS 逻辑，便于独立测试。

---

## 6. Trade-off

- 代价：引入领域层与适配层后，代码结构更复杂，初学者理解成本上升。
- 收益：获得更好的分层、可扩展性与可验证性，后续功能演进（如更复杂提示策略）更稳。

---

## 7. 结论

当前实现已满足“领域对象真实接入 Svelte 应用”的核心要求：
- 领域对象不只是定义存在，而是参与关键交互链路；
- UI 层主要消费领域适配后的状态，并通过统一入口触发行为；
- 响应式更新链路完整可追踪。