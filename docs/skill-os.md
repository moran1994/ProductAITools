# Skill OS（系统级）

把 Cursor Agent Skills 做成可管理、可识别、可按节点执行的系统。默认安装在用户目录，**任意项目**可用。

## 系统级 vs 项目级

| 层级 | 路径 | 作用 |
|------|------|------|
| **系统级（默认）** | `~/.cursor/skills`、`~/.cursor/commands`、`~/.cursor/skill-os` | 跨项目；技能 / 命令 / 流程状态 |
| **项目级（可选）** | 仓库 `.cursor/` | 版本备份、团队共享；运行时仍优先 `~/.cursor` |
| **用户规则** | Cursor Settings → Rules | 让 Agent 在所有项目自动按流程路由 |
| **Canvas** | 各工作区 `~/.cursor/projects/<ws>/canvases/` | 可视化仅当前工作区（Cursor 限制） |

## 已安装内容

| 来源 | 位置 |
|------|------|
| 70+ PM skills | `~/.cursor/skills/` |
| `/pm*` `/skills` 命令 | `~/.cursor/commands/` |
| 流程图 + CLI + 状态 | `~/.cursor/skill-os/` |
| 元技能 | `skill-os`、`pm-workflow` |

## 怎么用（任意项目）

新开 Agent 对话后：

```text
/pm
/pm-discover 你的产品想法
/pm-next
/pm-status
/skills
```

CLI：

```bash
python3 ~/.cursor/skill-os/scripts/flow_cli.py list
python3 ~/.cursor/skill-os/scripts/flow_cli.py start discover --topic "..." --stage new --force
python3 ~/.cursor/skill-os/scripts/flow_cli.py next --note "..."
```

## 启用「全项目自动路由」

到 **Cursor Settings → Rules → User Rules**，添加一条指向 Skill OS 的规则（或让 Agent 用 `cursor_dialog` 写入）。有了用户规则后，即使在没有本仓库的项目里，也会优先走 `/pm*` 节点流程。

## 维护

```bash
python3 ~/.cursor/skill-os/scripts/sync_catalog.py
# 从本仓库同步最新 flows/commands 到系统：
# cp -R .cursor/skill-os/flows/* ~/.cursor/skill-os/flows/
# cp .cursor/commands/*.md ~/.cursor/commands/
```
