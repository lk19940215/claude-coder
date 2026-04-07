# .pen 文件格式规范

> 本文件为所有 design 类型（init / new / fix）共享的 .pen 格式规则。

---

## 核心原则
  .pen 文件是 JSON 格式, 禁止任何破坏 JSON 格式的行为。

## 语法铁律

| # | 规则 | 正确 | 错误 |
|---|------|------|------|
| 1 | version `"2.9"` | `"version": "2.9"` | `"2.8"` |
| 2 | 跨文件引用用**冒号** | `$sys:color.primary` / `ref: "sys:header"` | `$sys/color.primary` / `sys/header` |
| 3 | 跨文件 descendants key 也用冒号 | `"sys:card-title": { "content": "..." }` | `"card-title": { "content": "..." }` |
| 4 | 圆角是 `cornerRadius` | `"cornerRadius": 12` | `"borderRadius": 12` |
| 5 | 独立 `x`, `y` | `"x": 0, "y": 0` | `"position": {"x":0,"y":0}` |
| 6 | stroke 是对象 | `{"align":"center","thickness":2,"fill":"#ccc"}` | `"stroke":"#ccc"` |
| 6b | stroke 支持个别边和虚线 | `{"thickness":{"top":1,"right":0,"bottom":0,"left":0},"dashPattern":[5,3]}` | — |
| 7 | 颜色 hex 格式 | `"#RRGGBB"` / `"#RRGGBBAA"` | `rgba(...)` / `transparent` |
| 8 | frame 默认 horizontal | 只写 `"layout":"vertical"` | 不写 `"layout":"horizontal"` |
| 9 | fontFamily 直接写字体名 | `"Inter, system-ui, sans-serif"` | `"$sys:font.primary"` |
| 10 | content 中禁止裸双引号 | 用 `「」` 替代，或 `\"` 转义 | `"点击"执行"按钮"` (破坏 JSON) |

---

## 属性白名单

**只写白名单内的属性。其余属性（margin*, border*, display, cursor, transition 等）会被 Pencil 静默丢弃。**

- **通用**: id, type, name, x, y, width, height, rotation, opacity, enabled, reusable, layoutPosition, flipX, flipY, metadata, context, theme
- **frame**: fill, stroke, effect, cornerRadius, layout, gap, padding, justifyContent, alignItems, children, clip, placeholder, slot, layoutIncludeStroke
- **text**: fill, stroke, effect, content, fontFamily, fontSize, fontWeight, fontStyle, letterSpacing, lineHeight, textAlign, textAlignVertical, textGrowth, underline, strikethrough, href
- **ref**: ref, descendants（+ 可覆盖根属性）
- **rectangle**: fill, stroke, effect, cornerRadius
- **ellipse**: fill, stroke, effect, innerRadius, startAngle, sweepAngle
- **icon_font**: fill, effect, iconFontName, iconFontFamily, weight — 可用字体: `lucide` / `feather` / `Material Symbols Outlined` / `Material Symbols Rounded` / `Material Symbols Sharp` / `phosphor`
- **group**: effect, layout, gap, padding, justifyContent, alignItems, children

---

## 布局陷阱

| 陷阱 | 正确做法 |
|------|----------|
| 多行子元素水平溢出 | 包裹行的外层 frame 必须 `layout: "vertical"` |
| `fill_container` 子元素宽度坍缩为 0/1px | 所有祖先 frame 必须有确定宽度（数值或 `fill_container`），不能是 `fit_content` |
| .pen 没有 flex-wrap | 手动分行（6 卡片 → 2 个水平 frame，每行 3 个） |
| 子元素溢出父容器 | 子元素总宽度 + gap ≤ 父 frame 宽度 |
| 文字挤在一行 | 描述文字必须 `textGrowth: "fixed-width"` + `width` |
| 间距用 margin | 不存在 margin，用 gap 或嵌套 frame + padding |
| page-root / section 写死 height | 不写 height，让内容撑开；只给 page-root 设 width |
| 水平等分卡片用固定 width | 同行卡片都用 `width: "fill_container"` 自动等分 |

---

## 属性速查

### 渐变 Fill

```json
{ "type": "gradient", "gradientType": "linear", "enabled": true,
  "colors": [{"color":"#8B5CF6","position":0},{"color":"#EC4899","position":1}],
  "rotation": 135, "size": {"width":1,"height":1} }
```

### 图片 Fill

```json
{ "type": "image", "url": "./images/hero.png", "mode": "fill" }
```
mode: `"stretch"` | `"fill"` | `"fit"`，url 为相对 .pen 文件的路径

### 阴影 Effect

```json
{ "type": "shadow", "blur": 8, "color": "#00000019", "offset": {"x":0,"y":2} }
```

### 背景模糊（毛玻璃）

```json
{ "type": "background_blur", "radius": 10 }
```

### ref 实例与 descendants

- `descendants` 是对象，不是数组
- 跨文件 ref: `"ref": "sys:btn-primary"`，descendants key: `"sys:child-id"`
- 嵌套 ref 的 descendants 路径用斜杠: `"ok-button/label": { "content": "Save" }`

**descendants 支持 3 种模式：**

1. **属性覆盖**（无 id/type/children）— 只修改属性值：
```json
"sys:card-title": { "content": "新标题", "fill": "#FFF" }
```

2. **对象替换**（有 type）— 完全替换该节点为新对象：
```json
"sys:card-icon": { "id": "icon", "type": "icon_font", "iconFontFamily": "lucide", "iconFontName": "check", "fill": "#FFF" }
```

3. **children 替换**（有 children，无 type）— 保留节点自身，替换其子元素（适用于容器型组件如面板、卡片、侧边栏）：
```json
"sys:sidebar-content": { "children": [
  { "type": "ref", "id": "home-btn", "ref": "sys:btn-primary", "descendants": { "sys:btn-primary-label": { "content": "首页" } } },
  { "type": "ref", "id": "settings-btn", "ref": "sys:btn-primary", "descendants": { "sys:btn-primary-label": { "content": "设置" } } }
] }
```

### 枚举值

- justifyContent: `"start"` | `"center"` | `"end"` | `"space_between"` | `"space_around"`
- alignItems: `"start"` | `"center"` | `"end"`
- textGrowth: `"auto"` | `"fixed-width"` | `"fixed-width-height"`
- slot（frame 属性）: 字符串数组，标记该 frame 为插槽，值为推荐填充的 reusable 组件 ID，如 `"slot": ["btn-primary", "icon-button"]`

---

## 设计原则

- 8px 网格系统，ID 使用 kebab-case
- 颜色/间距用 `$变量名` 引用
- reusable 组件：固定宽高 + 必须有子节点
- 变量类型只有 4 种: `boolean` / `color` / `number` / `string`
- 变量扁平 key-value: `"color.bg": {"type":"color","value":"#0F172A"}`

---

## ⚠️ 关键复述（结尾锚点）

1. 跨文件引用用 **冒号**: `sys:xxx`、`$sys:xxx`、descendants key `"sys:child-id"`
2. 只写**白名单内的属性**
3. `fill_container` 子元素的所有祖先必须有确定宽度
4. 多行容器必须 `layout: "vertical"`
5. 间距用 gap/padding，**不存在 margin**
