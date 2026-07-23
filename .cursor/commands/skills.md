---
description: Skill OS 总控 — 列出技能、识别意图、路由到 PM 流程或单 skill
argument-hint: "[list|search <kw>|apply <skill-id>|sync]"
---

# /skills — Skill OS

按参数处理：

## list（默认）
1. 读取 `~/~/.cursor/skill-os/catalog/INDEX.md`（没有则 `~/~/.cursor/skill-os/catalog/`）
2. 按域摘要展示个人 skills 数量；询问用户要展开哪一域
3. 提醒：多步骤 PM 工作请用 `/pm`，不要零散点 skill

## search <kw>
在 `skills.json` 的 id/description/triggers 中匹配，返回最多 8 条候选，并建议对应 flow（若有）

## apply <skill-id>
1. 确认 catalog 中存在
2. Read `~/.cursor/skills/<skill-id>/SKILL.md`
3. 按 skill 执行；若该 skill 属于某 flow 的中间节点，提示「更推荐从 `/pm-*` 流程进入」

## sync
运行：`python3 ~/.cursor/skill-os/scripts/sync_catalog.py` 并汇报新计数

若用户目标是完整 PM 过程，改用 `pm-workflow` 与 `/pm`。
