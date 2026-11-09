# 项目约定

线上：<https://mlwqi.github.io/bai-chuan-na-hai/>  
仓库：<https://github.com/mlwqi/bai-chuan-na-hai>

## 定位

「佰川纳海，积微知化」是一个主题汇编静态站：以知识库为基，提取、归纳某一主题，展开叙述。首页是主题目录，阅读页逐条呈现原文、出处、释义。

## 目录与数据流

- `content/topics.json`：站点信息与主题元数据（唯一手工维护的配置）。
- `content/topics/<id>.md`：主题源文件，结构为「部类 → 经名 → 文句 → 原文/出处/释义」。
- `scripts/build_site.py`：解析 Markdown，生成 `public/data/catalog.json` 与 `public/data/topics/<id>.json`。
- `public/`：唯一部署目录，零构建、零前端依赖。

不要手工修改 `public/data/`；改源 Markdown 或 `content/topics.json` 后重新构建。

## 内容规范

- 第一个主题《诸法如幻经文文句汇编》的网页版不含「编制说明」；源文件同样保持无编制说明。
- 引文必须来自原典语料，可省略但不可改写；释义为二次撰写。
- 同本异译合并注明；偈颂标点若为后加，需在源文件中说明。
- 新增主题沿用同一 Markdown 结构，构建脚本会自动统计部类、部数、条数、字数。

## 构建与本地验证

```bash
python scripts/build_site.py
python -m http.server 8766 --directory public
```

验证要点：
- 首页第一张卡片的名称与源文件 H1 完全一致。
- 首页只保留顶栏与主题目录，不出现大标题行、更新时间、「如何生成」等说明。
- 阅读页只保留顶栏返回图标（护眼模式左侧）、主题名称、目录与正文；不出现「编制说明」、搜索栏、部/条/类统计与副标题。
- 条目数、部数、部类数与构建输出一致。
- 目录锚点、三种阅读模式、手机宽度均正常。

## 发布

只发布 `public/`。推送 `main` 触发 `.github/workflows/pages.yml`；发布/部署属于外部动作，用户未明确要求时先本地验证。

本机 `git push` 可能被 Git Credential Manager 阻塞，必须清空 helper 后用 gh：

```bash
GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=never \
  git -c credential.helper= -c credential.helper="!gh auth git-credential" push origin main
```

后续新增/补充主题使用 skill `bai-chuan-na-hai`，并用其 `scripts/verify_site.py` 校验。
