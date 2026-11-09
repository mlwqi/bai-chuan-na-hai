# 佰川纳海，积微知化（project-019）

线上：<https://mlwqi.github.io/bai-chuan-na-hai/>  
仓库：<https://github.com/mlwqi/bai-chuan-na-hai>

## 目标

以知识库为基，提取、归纳其中某个方面，展开叙述。首页是主题目录；每个主题从原典出发，先摘文句，再结合上下文释义，最后归入部类。

当前第一个主题：**《诸法如幻经文文句汇编》**（48 部经论、126 条文句、13 个部类）。网页内容取自 `content/topics/zhufa-ruhuan.md`，已去掉「编制说明」。

## 本地运行

```bash
cd D:/Claude-workspace/project-019-佰川纳海
python scripts/build_site.py
python -m http.server 8766 --directory public
```

- 首页：<http://localhost:8766/#/>
- 第一个主题：<http://localhost:8766/#/topic/zhufa-ruhuan>

## 功能

- 首页：顶栏站点名 + 主题目录，不设大标题行；主题卡显示部数、条数、部类与标签，不显示更新时间。
- 阅读页：顶栏返回图标（护眼模式左侧）+ 主题名称、窄目录与正文；逐条呈现原文、出处、释义。
- 三种阅读模式：纸白 / 护眼 / 夜间，记住上次选择。
- 纯静态、零前端依赖，适配手机与打印。

## 目录

```
content/
  topics.json                 站点与主题元数据
  topics/zhufa-ruhuan.md      第一个主题的源 Markdown（无编制说明）
scripts/
  build_site.py               解析 Markdown → public/data
public/                       唯一部署目录
  index.html
  style.css
  app.js
  data/catalog.json
  data/topics/zhufa-ruhuan.json
docs/
  screenshots/                本地验证截图
  dev/debug.html              临时调试页（不部署）
```

## 新增主题

1. 把主题 Markdown 放入 `content/topics/`，保持「部类 → 经名 → 文句 → 原文/出处/释义」结构。
2. 在 `content/topics.json` 的 `topics` 数组增加条目（id、title、subtitle、summary、tags、source、updated）。
3. 运行 `python scripts/build_site.py`。
4. 本地验证后，再发布 `public/`。

## 发布

已部署到 GitHub Pages：<https://mlwqi.github.io/bai-chuan-na-hai/>

推送 `main` 会触发 `.github/workflows/pages.yml`，只发布 `public/`。首次部署后若 Actions 被取消，先启用 Pages（`build_type=workflow`）再手动触发 workflow。

后续新增/补充主题使用 skill `bai-chuan-na-hai`；其验证脚本：

```bash
python "C:/Users/User/.claude/skills/bai-chuan-na-hai/scripts/verify_site.py" "D:/Claude-workspace/project-019-佰川纳海"
```
