---
name: pm-workflow
description: >-
  Execute Product Management skills as node-based step workflows (discover,
  strategy, PRD, launch, etc.). Use when the user wants a PM process by steps,
  says /pm, /pm-discover, /pm-next, continue the flow, or asks not to use
  scattered one-off PM skills. Always load the flow graph and advance node by node.
---

# PM Workflow — 节点化执行器（系统级）

运行时根目录：`~/.cursor/skill-os`（跨项目共享状态与流程图）。

## A. 启动

```bash
python3 ~/.cursor/skill-os/scripts/flow_cli.py start <flow_id> --topic "..." --stage existing|new [--force]
```

读返回的 `node` + `resolved_skill`，向用户展示：流程 → 节点 → skill → 产出。

## B. 执行节点

| type | 行为 |
|------|------|
| `gate` | 提问/收集变量；`--set-var` |
| `skill` | Read `~/.cursor/skills/<id>/SKILL.md` 并执行 |
| `sequence` | 按 `steps[]` 逐个 skill |
| `choice` | 等用户选后 `next --to` |
| `compose` | 写 artifact 到**当前工作区** |
| `router` | 推荐下一流程 |

`checkpoint: true` 必须停顿确认后再 next。

## C. 前进 / 状态

```bash
python3 ~/.cursor/skill-os/scripts/flow_cli.py next --note "摘要" [--set-var k=v] [--to node]
python3 ~/.cursor/skill-os/scripts/flow_cli.py status
python3 ~/.cursor/skill-os/scripts/flow_cli.py show
```

## 禁止

- 一口气跑完不停车（除非用户明确要求）
- 绕过 flow 乱点同域 skill
- 未 Read SKILL.md 就凭印象执行
