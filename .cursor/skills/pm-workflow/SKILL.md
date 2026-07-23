---
name: pm-workflow
description: >-
  Execute Product Management skills as node-based step workflows (discover,
  strategy, PRD, launch, etc.). Use when the user wants a PM process by steps,
  says /pm, /pm-discover, /pm-next, continue the flow, or asks not to use
  scattered one-off PM skills. Always load the flow graph and advance node by node.
---

# PM Workflow — 节点化执行器

把零散 PM skills 变成 **可逐步执行的流程图**。每个节点引用一个 skill（或 gate/choice/compose），完成后才进入下一节点。

## 必做步骤

### A. 启动

1. 读 `.cursor/skill-os/flows/index.json`（或 `~/.cursor/skill-os/flows/index.json`）选流程
2. 启动状态：

```bash
python3 .cursor/skill-os/scripts/flow_cli.py start <flow_id> --topic "..." --stage existing|new [--force]
```

3. 根据返回的 `node` + `resolved_skill` 执行当前节点
4. 向用户展示：**流程名 → 节点标题 → 将用的 skill → 本步产出**

### B. 执行当前节点

按 `node.type`：

| type | 行为 |
|------|------|
| `gate` | 只提问/收集变量，不调 skill；得到答案后 `--set-var` |
| `skill` | `Read` 对应 SKILL.md 并严格执行；`skill_by` 按 `vars` 解析 |
| `sequence` | 按 `steps[]` 顺序逐个 skill，每步可短暂停顿 |
| `choice` | 列出 `options`，等用户选后 `next --to <node>` |
| `compose` | 汇总前序产出写成 `artifact` markdown |
| `router` | 推荐下一流程/skill；可用 `start <other> --force` 切换 |

**Checkpoint**：若 `checkpoint: true`，必须停住提问（用 `checkpoint_prompt` 或默认确认），用户确认后再 `next`。

### C. 前进

```bash
python3 .cursor/skill-os/scripts/flow_cli.py next --note "本步摘要" [--set-var key=val] [--to node_id]
```

choice/router 必须带 `--to`。

查看状态：

```bash
python3 .cursor/skill-os/scripts/flow_cli.py status
python3 .cursor/skill-os/scripts/flow_cli.py show
```

## 节点引用规范

- Skill：`node://skill/<skill-id>` → 读 `~/.cursor/skills/<skill-id>/SKILL.md`
- Flow：`node://flow/<flow-id>` → 读 `.cursor/skill-os/flows/<flow-id>.flow.json`
- 在回复里写：`应用 skill \`prioritize-assumptions\`（节点 prioritize）`

## 与用户话术

- 开场：预计几步、当前第几步
- 每步结束：给 checkpoint / 下一节点预告
- 结束：列出产物路径 + 推荐 router 选项

## 主流程速查

- `discover`：context → ideate → assumptions → prioritize → experiments → plan → handoff
- `strategy`：context → vision → canvas → doc → handoff
- `prd`：context → draft(create-prd|write-prd) → stress? → stories → done
- `launch`：icp → beachhead → gtm → motions → battlecard? → pack
- `pm-lifecycle`：总入口，只做选择再跳转子流程

## 禁止事项

- 不要一次跑完整条链路不停车（除非用户说「一口气做完」）
- 不要绕过 flow 随机调用同域其他 skill
- 不要在未 Read SKILL.md 的情况下「凭印象」执行
