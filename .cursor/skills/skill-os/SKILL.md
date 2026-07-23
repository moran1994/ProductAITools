---
name: skill-os
description: >-
  Manage, recognize, and apply Cursor skills via the Skill OS catalog.
  Use whenever the user asks which skills they have, how to find/route a skill,
  install/sync/list skills, or when choosing among many PM/product skills.
  Prefer this over guessing scattered skill names.
---

# Skill OS — 管理 / 识别 / 应用（系统级）

## 系统位置（跨项目）

默认以用户级路径为准，**任意项目**可用：

| 资源 | 路径 |
|------|------|
| Skills | `~/.cursor/skills/<id>/SKILL.md` |
| 斜杠命令 | `~/.cursor/commands/` |
| 清单 | `~/.cursor/skill-os/catalog/skills.json` / `INDEX.md` |
| 流程 | `~/.cursor/skill-os/flows/*.flow.json` |
| 状态 | `~/.cursor/skill-os/state/active.json` |
| CLI | `python3 ~/.cursor/skill-os/scripts/flow_cli.py` |

项目内 `.cursor/skill-os/` 仅作仓库备份；运行时优先 `~/.cursor/skill-os/`。

## 三大能力

### 1. 管理（Manage）

- **列出**：读 `~/.cursor/skill-os/catalog/INDEX.md`
- **同步**：`python3 ~/.cursor/skill-os/scripts/sync_catalog.py`
- **分类**：按 `domain`
- **引用**：`node://skill/<id>` 或 `` `skill-id` ``

### 2. 识别（Recognize）

1. 多步骤 PM → `pm-workflow`，不要零散点 skill
2. 单点任务 → catalog 匹配后 Read 再执行
3. 不确定 → `/pm`

| 用户说法 | 流程 | 命令 |
|----------|------|------|
| 发现 / discovery | `discover` | `/pm-discover` |
| 战略 | `strategy` | `/pm-strategy` |
| PRD | `prd` | `/pm-prd` |
| 访谈 | `interview` | `/pm-interview` |
| 上市 / GTM | `launch` | `/pm-launch` |
| OKR / sprint | `execution` | `/pm-execute` |
| 研究 | `research` | `/pm-research` |
| 数据 | `analytics` | `/pm-analytics` |
| 发版 | `ship` | `/pm-ship` |
| 不知道从哪开始 | `pm-lifecycle` | `/pm` |

### 3. 应用（Apply）

- 单 skill：Read `~/.cursor/skills/<id>/SKILL.md`
- 流程：用 `pm-workflow` + `flow_cli.py`
