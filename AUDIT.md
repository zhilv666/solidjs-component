# 全库一致性审计

审计日期：2026-11-02。源码基线：`feature/component-library` 的 `21bff2e`；Kobalte 版本为锁文件中的 `0.13.14`。

本轮未发现需要修改组件或新增授权的不一致项。已确认的 API 差异与交互限制保留，并在下文说明；没有新增待决事项。

## 范围与方法

- 阅读 29 个组件实现文件，用 TypeScript 类型检查器核对导出的 Props、原生属性继承、默认值、组合 API 和 Kobalte 依赖。
- 检查 28 个演示页面，包括主题概览；覆盖默认蓝、樱花粉、清新绿、薰衣草紫、暖杏橙的明暗配色。
- 常规展示区累计 35,700 次文字采样；另外打开 Select、Tooltip、Popover、Dialog、DropdownMenu、Toast 的固定对比示例，检查四种外观的 24 个实际弹层表面。
- 弹层累计 2,120 次文字采样，补查 Select 高亮与选中、DropdownMenu 高亮及危险项悬停/按下；核对可访问名称与 `aria-labelledby / aria-describedby` 引用。
- 对比度按浏览器最终计算颜色检查，透明背景沿祖先合成；有限 CSS 过渡完成后采样。隐藏装饰、隐藏原生输入框及禁用半透明内容不纳入正文 AA 判定。

此次是现有实现的审计。组件交互与窄屏验收结果沿用各任务在 [PLAN.md](PLAN.md) 中记录的浏览器和回归检查，未将逐项验收描述为本轮重新执行。

## Props 与默认值

所有接受 `size` 的公共样式 API 均使用 `sm / md / lg`，默认 `md`；Radio 和组合子组件优先继承父级设置。除冻结的 Button 外，组件使用 `appearance`，未显式指定时继承响应式上下文，无 Provider 时为 `default`。

`variant` 表示组件自身的语义或视觉变体，不要求不同组件拥有相同枚举。控件属性用 `mergeProps / splitProps` 处理，外部 `class` 经 clsx 合并并排在内部类之后。原生可选属性、回调和受控值保留 `undefined` 的含义，不用默认空值强行切换受控模式。

| 组件                       | 主要默认值与状态 API                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Button                     | `variant="solid"`、`type="button"`；`disabled / loading=false`；保留独立麻将变体                                        |
| Input / Textarea           | `invalid / disabled / readonly=false`；`value / defaultValue / onValueChange`；Textarea `rows=3`、`autoResize=false`    |
| Checkbox / Switch          | `checked / defaultChecked / onCheckedChange`，非受控默认未选；Checkbox 的 `indeterminate=false` 独立展示                |
| RadioGroup / Radio         | 组默认纵向；`value / defaultValue / onValueChange`；Radio 的尺寸与外观默认继承组                                        |
| Select                     | 单选，`defaultOpen=false`，默认占位；`value / defaultValue / onValueChange` 与 `open / defaultOpen / onOpenChange` 独立 |
| FormField                  | `invalid / disabled / required / group=false`；通过响应式插槽关联标签、帮助、错误与控件                                 |
| Badge / Tag                | `variant="solid"`；Tag 默认不可关闭，关闭模式要求 `closeLabel / onClose`                                                |
| Card / Alert               | Card `variant="outline"`；Alert `variant="info"`，标题可选                                                              |
| Spinner / Skeleton         | Spinner `variant="primary"`、默认可读状态标签；Skeleton `variant="line"`、默认 `aria-hidden=true`                       |
| Avatar / Divider           | Avatar `variant="circle"`、默认回退 `?`；Divider `variant="solid"`、横向且非装饰                                        |
| Tooltip / Popover / Dialog | Root 管理尺寸/外观；触发器默认 outline，关闭按钮默认 ghost；Popover 默认非模态，Dialog 默认模态                         |
| DropdownMenu               | 默认模态；普通项目 `closeOnSelect=true`，复选/单选项目默认保持展开                                                      |
| Toast / Toaster            | 消息默认 info、非持续、high 优先级；消息继承 Region 的尺寸/外观，允许单项覆盖                                           |
| Tabs                       | outline、横向、自动激活；`value / defaultValue / onValueChange`；面板 `forceMount=false`                                |
| Breadcrumb                 | plain，默认 `/` 分隔符；整组/单项默认可用，当前页由调用方设置                                                           |
| List                       | outline、`selectionMode="none"`；选择模式的值统一为字符串 key 数组                                                      |
| Pagination                 | outline、`defaultPage=1`、`siblingCount=1`，默认显示首尾页                                                              |
| Table                      | outline；选择/斑马纹/分页默认关闭，`pageSize=10`；选择、排序、页码分别受控或非受控                                      |
| Layout / Sidebar           | Layout 默认 plain，Header/Content/Footer 默认 outline；Sidebar 默认 responsive，展开与折叠分别管理                      |

Input、Textarea、Checkbox、Switch 兼容原生 `readOnly` 与已有 `readonly` API；RadioGroup 使用 `readOnly`。这些别名沿用已完成组件的兼容约定，没有为统一名称改写既有 API。

## class 与原生属性落点

| API                                                           | `class` 和原生属性的落点                                               |
| ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Input / Textarea                                              | 原生 input / textarea；前后缀和字段根布局独立                          |
| Checkbox / Switch / Radio                                     | 可见整行包装；输入事件/ref 由已有 Props 转交原生输入控件               |
| Select                                                        | 触发按钮；隐藏原生 select 通过 `nativeRef`、表单属性及原生事件接口配置 |
| 展示组件、FormField、Layout 子区域                            | 对应语义元素或字段根节点                                               |
| Tooltip / Popover / Dialog / DropdownMenu / Tabs / Breadcrumb | 每个组合子组件分别透传；Root 的样式设置由上下文继承                    |
| Toast / Toaster                                               | 消息、Region、List 和关闭按钮各自透传                                  |
| List / Pagination                                             | 列表或导航根表面；内部项保持集合与原生语义                             |
| Table                                                         | `class` 给原生 table；`containerClass` 给滚动外框                      |
| Sidebar                                                       | Trigger、Panel、Item、关闭按钮分别透传；Root 提供状态上下文            |

包装结构与 class 落点不同是已有 API 约定。统一调用时应以各组件导出的 Props 为准，不能假设外部 class 总会落在最外层节点。

## 状态、主题与外观

| 检查项       | 结果                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------- |
| 常规文字     | 35,700 次采样无失败，最低对比度 **4.928:1**，来自 Tabs                                              |
| 实际弹层文字 | 2,120 次采样无失败，最低对比度 **5.254:1**，来自 DropdownMenu                                       |
| 正文与字重   | 采样最小字号 **14px**，字重仅 **400 / 500**                                                         |
| 弹层外观     | 六类弹层的 default/keycap/mahjong 表面均为 **4px** 圆角；pixel 均为 **0px**，有局部标记和对应底座类 |
| 可访问关联   | 24 个固定对比弹层有有效名称，未发现悬空标签/说明引用                                                |

Select 的圆角与底座位于 Content 表面，不能用内部 listbox 的 0px 圆角判断外观。部分 live 示例有显式外观状态，固定矩阵才是四种外观的本轮检查对象。

交互状态沿用以下规则，代码与已有回归覆盖一致：

- 原生按钮和链接提供 hover、active、2px token `focus-visible` 环及禁用反馈。
- Checkbox、Radio、Switch 把隐藏原生输入控件的焦点/按下状态映射到可见表面；禁用/只读不收短底座。
- Select、List、Tabs、DropdownMenu 保留 Kobalte 的高亮、选中、禁用与键盘逻辑；错误和语义颜色不被外观覆盖。
- 纯展示组件、布局和弹层外框保持静止，不模拟按钮、不新增 Tab 停靠点；Tag 只有直属关闭按钮能触发外框按下效果。
- Spinner 只旋转内部图形，减少动态效果时停止；必要圆形例外与像素表面例外保持局部作用。

像素深色 Dialog 与像素浅色危险菜单的截图已实际查看，文字、焦点、直角及底座正常。截图位于忽略的 `.playwright-mcp/`，不作为源码制品提交。

## 已确认差异与验收边界

1. Button 保留冻结的 variant API 和原有键帽/麻将风格，不增加 `appearance` 或改写为像素；颜色仍跟随主题。
2. Checkbox/Switch 使用布尔 `checked`，文本及选择控件使用 `value`；List/Table 选择使用 key 数组。不同状态模型的命名不作强行统一。
3. Kobalte `0.13.14` 的 Tabs Enter/空格可能通过 keydown 与原生 click 请求同值两次；回调业务副作用需自行避免重复。
4. 同版本 DropdownMenu 的 Escape 回调中 `preventDefault()` 无法阻止关闭请求；受控 `open` 可拒绝请求。保留已有键盘与焦点逻辑。
5. Select 是单选；List/Table 没有远程数据或虚拟滚动；Table 跨页编辑值由调用方保存。纯展示组件不需要按钮状态。
6. 本轮测量是浏览器最终状态和已列出的示例范围，不代表任意外部 class、任意内容或过渡中间帧都经过对比度验收。
7. 尚未进行实际屏幕阅读器朗读或完整无障碍认证；库制品与独立消费者验证属于后续 7.3，不由本次源码审计替代。

基线上的 394 项整库测试、生产构建及三项必需检查已在 Breadcrumb 任务通过。本次文档提交另行通过 `pnpm typecheck`、完整 `pnpm lint` 和 `pnpm check:tokens`；未修改组件源码或重复执行无变化的整库测试。
