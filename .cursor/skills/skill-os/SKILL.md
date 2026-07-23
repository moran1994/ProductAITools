---
name: skill-os
description: >-
  Manage, recognize, and apply Cursor skills via the Skill OS catalog.
  Use whenever the user asks which skills they have, how to find/route a skill,
  install/sync/list skills, or when choosing among many PM/product skills.
  Prefer this over guessing scattered skill names.
---

# Skill OS — 管理 / 识别 / 应用

## 系统位置

| 资源 | 路径 |
|------|------|
| 清单 | `.cursor/skill-os/catalog/skills.json` 与 `INDEX.md` |
| 流程 | `.cursor/skill-os/flows/*.flow.json` |
| 状态 | `.cursor/skill-os/state/active.json` |
| CLI | `.cursor/skill-os/scripts/flow_cli.py` / `sync_catalog.py` |
| 个人镜像 | `~/.cursor/skill-os/` |

若项目内无 `.cursor/skill-os/`，回退到 `~/.cursor/skill-os/`。

## 三大能力

### 1. 管理（Manage）

- **列出**：读 `catalog/INDEX.md` 或 `skills.json`
- **同步**：`python3 .cursor/skill-os/scripts/sync_catalog.py`
- **分类**：按 `domain`（产品发现 / 战略 / 研究 / 数据 / GTM / 增长 / 执行 / shipping / 工具箱）
- **引用**：统一用 `node://skill/<id>` 或 `` `skill-id` ``，不要只口头说「那个 brainstorm skill」

### 2. 识别（Recognize）

收到用户意图时：

1. 先判断是否应走 **PM 流程**（多步骤）→ 交给 `pm-workflow`，不要单点乱点 skill
2. 否则在 catalog 里按 `domain` + `description`/`triggers` 匹配 1–3 个候选
3. 向用户确认后 **Read** 对应 `SKILL.md` 再执行

意图 → 流程快表：

| 用户说法 | 流程 id | 命令 |
|----------|---------|------|
| 做发现 / discovery / 验证想法 | `discover` | `/pm-discover` |
| 定战略 / strategy canvas | `strategy` | `/pm-strategy` |
| 写 PRD / 需求文档 | `prd` | `/pm-prd` |
| 访谈脚本/总结 | `interview` | `/pm-interview` |
| 上市 / GTM / launch | `launch` | `/pm-launch` |
| OKR / sprint / retro | `execution` | `/pm-execute` |
| 用户研究 / 竞品 / SWOT | `research` | `/pm-research` |
| A/B / cohort / SQL / 北极星 | `analytics` | `/pm-analytics` |
| 发版检查 / shipping | `ship` | `/pm-ship` |
| 不知道从哪开始 | `pm-lifecycle` | `/pm` |

### 3. 应用（Apply）

- **单 skill**：`Read` `~/.cursor/skills/<id>/SKILL.md`（或 catalog 中的 path），严格按该 skill 执行
- **流程节点**：用 `pm-workflow`；每个节点解析 `skill` / `skill_by` 后再 Read 应用
- **禁止**：一次堆叠多个无关 skill；流程中途不要跳过 checkpoint（除非用户明确 skip）

## 输出约定

列出技能时用紧凑表：

```
| id | domain | 一句话 |
```

启动流程时说明：当前流程、当前节点、将应用的 skill、checkpoint 问题。
