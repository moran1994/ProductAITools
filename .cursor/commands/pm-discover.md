---
description: 产品发现全流程（ideation → 假设 → 优先级 → 实验）
argument-hint: "<产品或功能想法> [--stage existing|new]"
---

# /pm-discover

1. 遵循 **pm-workflow**
2. 从 `$ARGUMENTS` 解析 topic；若含 existing/new 则作为 stage，否则先问
3. 启动：

```bash
python3 ~/.cursor/skill-os/scripts/flow_cli.py start discover --topic "$ARGUMENTS" --stage <existing|new> --force
```

4. 从 `context` 节点开始，逐步：ideate → assumptions → prioritize → experiments → plan
5. 每步 Read 解析出的 skill；checkpoint 处停顿
6. 完成后写 `discovery-plan.md` 到工作区，并给出 handoff 选项
