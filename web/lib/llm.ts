import type { FlowNode } from "./types";
import { resolveSkill } from "./types";

export type RunNodeRequest = {
  flowId: string;
  flowName: string;
  nodeId: string;
  node: FlowNode;
  vars: Record<string, string>;
  topic?: string;
  userMessage?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
};

function buildSystemPrompt(req: RunNodeRequest, skillBody?: string): string {
  const skill = resolveSkill(req.node, req.vars);
  const skillLabel = Array.isArray(skill) ? skill.join(", ") : skill || "（无）";
  const typeNames: Record<string, string> = {
    gate: "门禁",
    skill: "技能",
    choice: "选择",
    router: "路由",
    compose: "汇总",
    sequence: "顺序",
    info: "说明",
  };
  const typeLabel = typeNames[req.node.type] || req.node.type;
  const askBlock = req.node.ask?.length
    ? `待澄清问题：\n${req.node.ask.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
    : "";
  const optionsBlock = req.node.options?.length
    ? `可选选项：\n${req.node.options
        .map((o, i) => {
          const target = o.next || o.flow || o.node_skill || "";
          return `${i + 1}. ${o.label}${target ? ` → ${target}` : ""}`;
        })
        .join("\n")}`
    : "";

  return `你是「产品经理AI空间站」的执行引擎。按节点类型完成当前步骤，输出结构清晰的中文结果。

流程：${req.flowName}（${req.flowId}）
节点：${req.nodeId} — ${req.node.title || typeLabel}
类型：${typeLabel}
关联技能：${skillLabel}
变量：${JSON.stringify(req.vars)}
主题：${req.topic || "（未指定）"}
${askBlock ? `\n${askBlock}` : ""}
${optionsBlock ? `\n${optionsBlock}` : ""}

规则：
- 类型=门禁：根据 ask 列表向用户澄清，或在已有信息足够时总结上下文并给出可进入下一步的结论。
- 类型=技能：严格遵循下方技能说明执行，给出可交付产出；必须紧扣主题与变量，不要另起无关产品。
- 类型=选择/路由：必须基于上方「可选选项」列出并给出推荐（说明理由），等待用户选择；不要声称没有选项。
- 类型=汇总：汇总前序产出，生成文档草稿。
- 类型=顺序：按步骤技能依次给出简要产出。
- 若有检查点，结尾用「【检查点】」列出需用户确认的问题。
- 不要编造无法核实的数据；假设处请标注。

${skillBody ? `--- 技能说明 ---\n${skillBody}\n--- 结束 ---` : ""}`;
}

function buildUserMessage(req: RunNodeRequest): string {
  const parts: string[] = [];
  if (req.userMessage) parts.push(req.userMessage);
  else if (req.node.ask?.length) {
    parts.push(`请处理本节点。已知信息：${JSON.stringify(req.vars)}。待澄清：${req.node.ask.join(" / ")}`);
  } else {
    parts.push(`请执行节点「${req.node.title || req.nodeId}」。`);
  }

  if (req.node.options?.length) {
    parts.push(
      "本节点可选选项（请基于这些选项推荐，不要说没有选项）：\n" +
        req.node.options
          .map((o, i) => {
            const target = o.next || o.flow || o.node_skill || "";
            return `${i + 1}. ${o.label}${target ? ` → ${target}` : ""}`;
          })
          .join("\n")
    );
  }
  if (req.node.ask?.length && req.userMessage) {
    parts.push(`参考问题：${req.node.ask.join(" / ")}`);
  }
  return parts.join("\n\n");
}

export async function callLLM(req: RunNodeRequest, skillBody?: string): Promise<string> {
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = (process.env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.LLM_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("未配置 LLM_API_KEY。请在 web/.env.local 中设置（见 .env.example）。");
  }

  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: buildSystemPrompt(req, skillBody) },
    ...(req.history || []).map((h) => ({ role: h.role, content: h.content })),
    {
      role: "user",
      content: buildUserMessage(req),
    },
  ];

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM 请求失败 ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("LLM 返回空内容");
  return content;
}
