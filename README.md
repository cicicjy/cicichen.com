# Cici Portfolio — Air / Motion

当前版本是一套桌面优先的个人 portfolio：Apple 式留白、纤细系统字体和高级黑白影像构成主体，荧光绿只承担人物贴纸描边、关键词、极细线条与交互反馈。760px 以下继续显示原有移动版，未重做手机布局。

## 页面结构（桌面）

1. **Hero / About** — 极简白底构图；未经重绘、未经压缩的高清黑白竖幅照片位于页面中间偏右，左侧以 `INNOVATION / BRAND / GROWTH` 三行标题概括职业方向
2. **Capabilities** — 滚轮驱动的 sticky section；初始只有四张聚合贴纸，卡片、标题与文案随后分阶段显现；四张文案分隔线和人物底部使用统一基线
   - Consumer Insights / 用户洞察
   - New Product Development / 产品开发
   - Category Growth / 品类增长
   - O2O Strategy / 即时零售策略
3. **Selected Work** — 九个单品正面透明 PNG 保持原彩，以瓶盖宽度为共同标尺校准视觉比例，缩小后在一个桌面视口内错落分布于九个灰色亚克力台座上
4. **Experience** — 编辑部档案式双栏简历：左侧为精简个人介绍与完整 4:3 原始写真，右侧以公司、职位、成果三层信息整理工作经历、教育背景和 Skill
5. **Contact** — 邮件入口与复制邮箱反馈

Business Thinking 与 AI Lab 已暂时从桌面版移除，相关素材仍保留，方便后续重新设计。

## 素材

- `assets/hero-minimal-original.png` — 桌面 Hero 原始高清照片，保留原有单侧绿色描边与影棚光影
- `assets/stickers/` — 直接从用户指定健身原图抠出的四张透明底人物贴纸；描边统一为 `#CFFF00`，已清理旧抠图的深色消光边缘，最高边长保留至 2600px
- `assets/works/processed/` — 页面实际使用的九张单品正面透明 PNG；四视图与三视图素材已拆为单品
- `assets/resume-profile.jpg` — Experience 双栏简历使用的原始高清写真，网页仅做黑白处理并按原始 4:3 比例完整展示

`source-*.png` 是贴纸透明化前的中间素材，不参与页面加载。

## 内容来源与公开边界

Experience 文案以 `Jiaying_Chen_English_Resume.docx` 为主来源，已统一公司、职位、日期与专业表达，并从简历中的项目细节提炼为适合公开 portfolio 的短句。页面没有写入客户机密、供应商信息、数据库路径或非公开明细。

## 交互与适配

- 新桌面体验：`min-width: 761px`
- 原移动体验：`max-width: 760px`
- Sticky 人物动效采用反向 FLIP：人物最终天然属于对应卡片，JavaScript 只计算聚合态到终态的 transform
- 滚动阶段：0–10% 只有贴纸；10–38% 卡片显现；18–74% 贴纸落位；36–56% 标题出现；64–88% 文案出现
- Capabilities 的四张贴纸已按确认值固定大小与位置，临时调节器已移除；sticky 聚合动画仍从同一组终态位置反向计算
- 产品始终保持原彩，按各自瓶盖宽度校准包装比例；hover 时平滑放大到 110%，同时出现绿色阴影与荧光绿台座折射
- 产品的最终独立尺寸已按确认值固定为 `63 / 70 / 63 / 50 / 49 / 63 / 46 / 50 / 63`；产品调节器已移除，展示台尺寸保持不变
- Selected Work 的最终坐标已按确认值固定为 `X/Y: 6/20 · 44/0 · 81/4 · 27/36 · 65/29 · 96/32 · 14/67 · 47/60 · 83/64`；临时位置调节器与浏览器存储逻辑已移除
- 桌面端的大区块标题统一为全大写编辑排版，并以清晰绿色文字标出核心关键词
- 桌面鼠标替换为 8px 荧光绿圆点；移动时生成不同尺度与角度的软雾、散点和轻微漂移，形成非连续的绿色喷雾残影，并在约 3 秒内消散
- `prefers-reduced-motion` 下取消 sticky 长滚动并直接显示完整终态
- 页面无框架、无第三方依赖、无网络字体

## 校验

运行：

```sh
python3 scripts/validate_portfolio_html.py site-high-vis/index.html
```

校验会检查 HTML 标签闭合、重复 ID 与所有本地资源路径；内联 JavaScript 也已单独做语法检查。
