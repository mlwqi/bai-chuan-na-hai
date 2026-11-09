# -*- coding: utf-8 -*-
"""把主题 Markdown 解析为静态站数据。零运行时依赖。"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG = os.path.join(ROOT, "content", "topics.json")
OUT_DIR = os.path.join(ROOT, "public", "data")


def parse_topic(md):
    lines = md.splitlines()
    title = ""
    for line in lines:
        if line.startswith("# "):
            title = line[2:].strip()
            break
    sections = []
    section = None
    text = None
    entry = None
    in_note = False

    for line in lines:
        if not line.strip():
            continue
        if line.startswith("## "):
            section = {"title": line[3:].strip(), "texts": []}
            sections.append(section)
            text = None
            entry = None
            in_note = False
        elif line.startswith("### "):
            if section is None:
                continue
            text = {"title": line[4:].strip(), "entries": [], "notes": []}
            section["texts"].append(text)
            entry = None
            in_note = False
        elif line.startswith("- 文句"):
            if text is None:
                continue
            entry = {"label": line[2:].strip(), "quote": "", "source": "", "explain": ""}
            text["entries"].append(entry)
            in_note = False
        elif line.startswith("- 说明"):
            in_note = True
            entry = None
        elif line.startswith("  - "):
            body = line[4:].strip()
            if in_note and text is not None:
                text["notes"].append(body)
            elif entry is not None:
                if body.startswith("原文："):
                    entry["quote"] = body[3:].strip()
                elif body.startswith("出处："):
                    entry["source"] = body[3:].strip()
                elif body.startswith("释义："):
                    entry["explain"] = body[3:].strip()

    for section in sections:
        for text in section["texts"]:
            for entry in text["entries"]:
                if not entry["quote"] or not entry["source"] or not entry["explain"]:
                    raise ValueError(f"条目不完整：{text['title']} / {entry['label']}")

    texts = sum(len(s["texts"]) for s in sections)
    entries = sum(len(t["entries"]) for s in sections for t in s["texts"])
    chars = len(re.sub(r"\s", "", md))
    return title, sections, {"sectionCount": sections.__len__(), "textCount": texts,
                             "entryCount": entries, "charCount": chars}


def main():
    cfg = json.load(open(CONFIG, encoding="utf-8"))
    os.makedirs(os.path.join(OUT_DIR, "topics"), exist_ok=True)
    catalog = {"site": cfg["site"], "topics": []}

    for topic in cfg["topics"]:
        src = os.path.join(ROOT, topic["source"])
        md = open(src, encoding="utf-8-sig").read()
        title, sections, stats = parse_topic(md)
        data = {
            "id": topic["id"],
            "title": title,
            "subtitle": topic.get("subtitle", ""),
            "summary": topic.get("summary", ""),
            "tags": topic.get("tags", []),
            "updated": topic.get("updated", ""),
            "stats": stats,
            "sections": sections,
        }
        out = os.path.join(OUT_DIR, "topics", topic["id"] + ".json")
        json.dump(data, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        item = {k: topic.get(k, "") for k in ("id", "title", "subtitle", "summary", "tags", "updated")}
        item.update(stats)
        catalog["topics"].append(item)
        print(f"{topic['id']}: {stats['sectionCount']} 部类 / {stats['textCount']} 部 / "
              f"{stats['entryCount']} 条 / {stats['charCount']} 字")

    json.dump(catalog, open(os.path.join(OUT_DIR, "catalog.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)
    print("output:", os.path.join(OUT_DIR, "catalog.json"))


if __name__ == "__main__":
    main()
