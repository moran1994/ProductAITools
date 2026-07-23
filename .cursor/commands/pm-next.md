---
description: 推进当前 PM 流程到下一节点
argument-hint: "[可选备注] 或 choice 目标节点"
---

# /pm-next

1. 遵循 **pm-workflow**
2. `python3 ~/.cursor/skill-os/scripts/flow_cli.py show` 查看当前节点
3. 若当前节点未完成：先完成再 next
4. 前进：

```bash
python3 ~/.cursor/skill-os/scripts/flow_cli.py next --note "$ARGUMENTS"
```

若是 choice/router，解析用户选择后加 `--to <node_id>`。
5. 展示新节点并立即开始执行（除非用户只要状态）
