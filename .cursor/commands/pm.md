---
description: PM 全生命周期入口 — 按阶段选择节点化流程
argument-hint: "[可选：一句话描述当前产品/问题]"
---

# /pm — PM Lifecycle

1. 加载并遵循 **pm-workflow** skill
2. 启动流程：

```bash
python3 ~/.cursor/skill-os/scripts/flow_cli.py start pm-lifecycle --topic "$ARGUMENTS" --force
```

3. 展示阶段选项（发现 / 战略 / 研究 / PRD / 上市 / 执行 / 数据 / 发版）
4. 用户选择后 `start <子flow> --force`，再逐步执行节点

不要直接堆 skill；始终节点 → skill 引用 → checkpoint → next。
