# Skill OS

把 Cursor 里零散的 Agent Skills，收成一套可管理、可识别、可按节点执行的系统——尤其适合 PM 工作流。

## 你现在拥有什么

| 来源 | 数量 | 说明 |
|------|------|------|
| 个人 Skills（`~/.cursor/skills`） | ~70 | 含 pm-skills 全量 + 本地 write-prd / skill-creator |
| Cursor 内置 | ~19 | `~/.cursor/skills-cursor` |
| 插件 Skills | ~19 | ChatPRD / Figma / docs-canvas 等 |

完整清单：[.cursor/skill-os/catalog/INDEX.md](../.cursor/skill-os/catalog/INDEX.md)

### 个人 Skills 按域

| 域 | 数量 |
|----|------|
| 产品发现 | 13 |
| 产品战略 | 12 |
| 市场研究 | 7 |
| 数据分析 | 3 |
| Go-to-Market | 6 |
| 营销增长 | 5 |
| 执行交付 | 16 |
| AI Shipping | 2 |
| PM 工具箱 | 4 |
| 本地 PRD / 元技能 | 2+ |

## 架构

```
意图 → skill-os 识别
         ├─ 单点任务 → 匹配 catalog → Read SKILL.md → 执行
         └─ PM 多步骤 → pm-workflow
                          → flows/*.flow.json 节点图
                          → 每节点引用 skill
                          → checkpoint → flow_cli next
                          → 产物 markdown
```

### 与 Cursor 的结合点

| 机制 | 作用 |
|------|------|
| `.cursor/skills/skill-os` + `pm-workflow` | Agent 自动/按需加载的元技能 |
| `.cursor/commands/pm*.md` `/skills` | 斜杠命令触发 |
| `.cursor/rules/skill-os.mdc` | 始终提醒按流程路由 |
| `.cursor/skill-os/*` | 目录、流程图、状态、CLI |
| `~/.cursor/skills/*` | 实际 skill 正文 |
| `~/.cursor/skill-os/*` | 个人级镜像（跨项目） |

## 怎么用

| 命令 | 作用 |
|------|------|
| `/skills` | 列出 / 搜索 / 应用 / 同步 |
| `/pm` | 生命周期总入口 |
| `/pm-discover` | 发现流程 |
| `/pm-strategy` | 战略 Canvas |
| `/pm-prd` | PRD 流程 |
| `/pm-interview` | 访谈 |
| `/pm-launch` | GTM |
| `/pm-execute` | OKR/Sprint/… |
| `/pm-research` | 研究 |
| `/pm-analytics` | 数据 |
| `/pm-ship` | 发版检查 |
| `/pm-next` | 下一步 |
| `/pm-status` | 当前状态 |

自然语言也可以：「按发现流程帮我验证这个想法」——Agent 应走 `pm-workflow`。

## 节点示例（discover）

```
context (gate)
  → ideate (brainstorm-ideas-*)
  → assumptions (identify-assumptions-*)
  → prioritize (prioritize-assumptions)
  → experiments (brainstorm-experiments-*)
  → plan (compose discovery-plan.md)
  → handoff (router → prd / interview / metrics …)
```

## 维护

```bash
python3 .cursor/skill-os/scripts/sync_catalog.py
python3 .cursor/skill-os/scripts/flow_cli.py list
python3 .cursor/skill-os/scripts/flow_cli.py status
```

新增 flow：在 `.cursor/skill-os/flows/` 增加 `*.flow.json`，并更新 `index.json`；可选加对应 `.cursor/commands/pm-*.md`。
