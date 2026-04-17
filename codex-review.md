# con-oo-CHEF-Ch - Review

## Review 结论

领域对象本体有一定封装基础，但当前提交没有把 `src/domain/*` 真正变成 Svelte 游戏流程的核心。UI 仍主要依赖旧的 `@sudoku/*` store/函数，且接线本身存在静态不闭合；同时 `Sudoku` 的规则模型与现有数独界面的错误输入语义也不一致，因此整体上更接近“有领域对象实现，但未完成真实接入”。

## 总体评价

| 维度 | 评价 |
| --- | --- |
| OOP | fair |
| JS Convention | fair |
| Sudoku Business | poor |
| OOD | fair |

## 缺点

### 1. 真实游戏流程没有消费 `src/domain/*`

- 严重程度：core
- 位置：src/App.svelte:4-29
- 原因：静态搜索显示，`src` 中除 `src/domain/*` 自身外，没有任何应用代码引用 `createGame`、`createSudoku` 或 `src/domain/*`。启动流程、胜利监听、输入、撤销/重做都仍然走 `@sudoku/game` 与 `@sudoku/stores/*`，这直接违背了作业要求中“View 真正消费领域对象”的核心目标。

### 2. Svelte 接线接口本身不闭合

- 严重程度：core
- 位置：src/node_modules/@sudoku/game.js:13-56
- 原因：`@sudoku/game` 只静态可见地导出了 `startNew`、`startCustom`、`pause`、`resume`，但消费侧又在 `src/App.svelte:28` 调用 `game.start(...)`，在 `src/components/Controls/Keyboard.svelte:5` 导入 `inputNumber`，在 `src/components/Controls/ActionBar/Actions.svelte:8` 导入 `undo`、`redo`、`applyHint`。同时 `src/node_modules/@sudoku/stores/game.js` 也没有导出 `gameState`，说明当前所谓“接入层”从静态结构上就不自洽。

### 3. Game 没有提供可被 Svelte 消费的响应式边界

- 严重程度：major
- 位置：src/domain/Game.js:17-88
- 原因：`Game` 内部会替换 `currentSudoku` 和历史栈，但对外只有同步 getter/command，没有 `subscribe`、没有 custom store，也没有显式版本信号。按照 Svelte 3 的响应式机制，单纯修改对象内部状态并不会自动驱动界面刷新，因此这个设计还没有完成“领域对象与 Svelte 协作”的关键一层。

### 4. 领域规则与当前数独产品语义不一致

- 严重程度：major
- 位置：src/domain/Sudoku.js:145-150
- 原因：`guess()` 在产生冲突时直接抛错，意味着盘面不会进入“已输入但有错误”的状态；而现有界面明显预留了 `invalidCells`、冲突高亮以及基于错误状态的胜利判断。对这个项目的业务语义而言，更自然的建模通常是允许录入，再由校验结果表达错误，而不是在领域层直接拒绝这类输入。

### 5. 旧 store 仍在承担核心业务，且通过原地 mutate 驱动刷新

- 严重程度：major
- 位置：src/node_modules/@sudoku/stores/grid.js:73-86
- 原因：`userGrid.set()` 和 `applyHint()` 直接改写二维数组后返回同一引用，说明输入与提示逻辑仍然保留在旧 store，而没有收敛到 `Game`/`Sudoku`。这种写法虽然可能借助 store 通知工作，但会把正确性建立在 Svelte store 的对象通知语义上，既不利于解释响应式原理，也削弱了 OOD 边界。

### 6. 无变化输入也会进入 undo 历史

- 严重程度：minor
- 位置：src/domain/Game.js:42-48
- 原因：只要 `guess()` 不抛错，`Game.guess()` 就会先保存快照并压入 undo 栈；如果用户把一个格子再次写成当前相同的值，也会生成一次 no-op 历史记录。这样会让撤销序列混入无意义步骤，影响交互质量。

### 7. 工厂对象方法混用 `this`，不够稳健

- 严重程度：minor
- 位置：src/domain/Sudoku.js:153-170
- 原因：`guess()`、`clone()`、`toJSON()` 依赖调用时的 `this` 绑定。对 JS 生态中的工厂函数对象来说，这种写法比闭包变量或显式对象引用更脆弱，一旦方法被解构或作为回调传递，就可能出现语义漂移。

## 优点

### 1. Sudoku 本体职责相对集中

- 位置：src/domain/Sudoku.js:93-186
- 原因：构造时统一校验盘面形状、数值范围和初始冲突，并提供 `guess`、`canPlace`、`getInvalidCells`、`isSolved`、`toJSON`、`toString` 等接口，明显优于把这些规则散落在组件事件处理器中。

### 2. 聚合边界有明确的防御性复制意识

- 位置：src/domain/Game.js:25-35
- 原因：`currentSudoku` 通过快照重建，`getSudoku()` 返回副本，`toJSON()` 返回纯数据快照，避免外部代码直接持有内部引用污染聚合状态，这一点符合较好的封装习惯。

### 3. Undo/Redo 的基本状态演进模型是清晰的

- 位置：src/domain/Game.js:42-60
- 原因：成功操作后才写入 undo 栈，撤销时把当前快照推入 redo 栈，重做反向恢复，核心语义是完整的，后续如果补上 UI 适配层，演进路径是可复用的。

### 4. 棋盘组件基本保持了展示层职责

- 位置：src/components/Board/index.svelte:35-47
- 原因：Board 主要消费状态并映射成 Cell props，本身没有直接承担数独规则判定或历史管理。这个分层方向是对的，只是当前数据源仍是旧 store，而不是领域对象适配层。

## 补充说明

- 本次结论完全基于静态审查；按要求未运行测试，也未启动 Svelte 应用。
- “`src/domain/*` 未接入真实 UI”的结论基于对 `src` 的全文搜索：除 `src/domain/*` 自身外，没有找到 `createGame`、`createSudoku` 或 `src/domain/*` 的应用层引用。
- “接口不闭合/导出缺失”的判断来自静态比对消费点与导出点，例如 `game.start`、`undo`、`redo`、`applyHint`、`inputNumber`、`gameState` 在消费侧出现，但在对应模块中未找到导出。
- 关于数独业务语义的判断来自现有组件和 store 中对 `invalidCells`、冲突高亮、胜利判定的静态契约，而不是运行时验证。
