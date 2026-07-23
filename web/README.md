# 产品经理AI空间站 · Web

品牌落地页 + 流程工作台；节点执行通过 OpenAI 兼容 LLM API。

## 启动

需要 Node 18+（推荐 `/usr/local/opt/node@22/bin`）。

```bash
cd web
cp .env.example .env.local   # 填入 LLM_API_KEY 等
npm install
npm run sync                 # 从 ../.cursor/skill-os 同步 flows/catalog
npm run dev
```

打开 http://localhost:3000

## LLM 配置（OpenAI 兼容）

在 `web/.env.local`：

```bash
LLM_API_KEY=sk-...
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

也可指向 DeepSeek、通义、本地 Ollama（如 `http://127.0.0.1:11434/v1`）等兼容接口。

## 路由

| 路径 | 说明 |
|------|------|
| `/` | 品牌落地页 |
| `/app` | 工作台总览 |
| `/app/flows` | 流程列表 |
| `/app/flows/[id]` | 节点推进器 + LLM 执行 |
| `/app/skills` | 技能星图 |
| `POST /api/run-node` | LLM 执行当前节点 |

## 能力

- 10 条 PM 流程节点推进（localStorage 状态）
- Checkpoint 确认后再下一步
- LLM 按 skill 说明执行节点
- 「复制到 Cursor」导出斜杠命令与上下文
