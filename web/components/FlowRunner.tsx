"use client";

import { useEffect, useMemo, useState } from "react";
import type { Flow } from "@/lib/types";
import { resolveSkill } from "@/lib/types";
import { loadActive, saveActive, type ActiveState } from "@/lib/state";
import styles from "./FlowRunner.module.css";

export function FlowRunner({ flow }: { flow: Flow }) {
  const [active, setActive] = useState<ActiveState | null>(null);
  const [topic, setTopic] = useState("");
  const [userMsg, setUserMsg] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [choiceTo, setChoiceTo] = useState("");
  const [checkpointOk, setCheckpointOk] = useState(false);

  useEffect(() => {
    const existing = loadActive();
    if (existing?.flow_id === flow.id) {
      setActive(existing);
      setTopic(existing.vars.topic || "");
      const last = existing.node_id;
      if (existing.transcripts?.[last]) setOutput(existing.transcripts[last]);
    }
  }, [flow.id]);

  const nodeId = active?.node_id || flow.entry;
  const node = flow.nodes[nodeId];
  const skill = useMemo(
    () => (node ? resolveSkill(node, active?.vars || {}) : null),
    [node, active?.vars]
  );

  const nodeOrder = useMemo(() => Object.keys(flow.nodes), [flow.nodes]);

  function start() {
    const state: ActiveState = {
      flow_id: flow.id,
      flow_name: flow.name,
      node_id: flow.entry,
      status: "running",
      vars: topic ? { topic } : {},
      completed_nodes: [],
      started_at: new Date().toISOString(),
      transcripts: {},
    };
    if (topic) state.vars.topic = topic;
    setActive(state);
    saveActive(state);
    setOutput("");
    setError("");
    setCheckpointOk(false);
  }

  async function runLLM() {
    if (!node || !active) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/run-node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flowId: flow.id,
          flowName: flow.name,
          nodeId,
          node,
          vars: { ...active.vars, ...(topic ? { topic } : {}) },
          topic,
          userMessage: userMsg || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "运行失败");
      setOutput(data.content);
      const nextState: ActiveState = {
        ...active,
        vars: { ...active.vars, ...(topic ? { topic } : {}) },
        transcripts: { ...active.transcripts, [nodeId]: data.content },
      };
      setActive(nextState);
      saveActive(nextState);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function advance() {
    if (!active || !node) return;
    if (node.checkpoint && !checkpointOk) {
      setError(node.checkpoint_prompt || "本节点为 checkpoint，请勾选确认后再进入下一步。");
      return;
    }
    const completed = [
      ...active.completed_nodes,
      { node_id: nodeId, at: new Date().toISOString(), note: userMsg.slice(0, 120) },
    ];

    if (node.terminal && !choiceTo && node.type !== "choice" && node.type !== "router") {
      const done: ActiveState = { ...active, status: "completed", completed_nodes: completed };
      setActive(done);
      saveActive(done);
      return;
    }

    let next = choiceTo || node.next;
    if (node.type === "choice" || node.type === "router") {
      if (!choiceTo) {
        setError("请先选择一个选项再进入下一步");
        return;
      }
      next = choiceTo;
    }

    if (!next || !flow.nodes[next]) {
      const done: ActiveState = { ...active, status: "completed", completed_nodes: completed };
      setActive(done);
      saveActive(done);
      setError("");
      return;
    }

    const nextState: ActiveState = {
      ...active,
      node_id: next,
      completed_nodes: completed,
      status: "running",
    };
    setActive(nextState);
    saveActive(nextState);
    setOutput(nextState.transcripts[next] || "");
    setUserMsg("");
    setChoiceTo("");
    setCheckpointOk(false);
    setError("");
  }

  function copyCursor() {
    const skillLabel = Array.isArray(skill) ? skill.join(",") : skill || "";
    const slash = flow.command ? `/${flow.command} ${topic || ""}`.trim() : "";
    const text = [
      slash ? `Cursor 命令：${slash}` : "",
      `在产品经理AI空间站流程「${flow.name}」的节点「${nodeId}」继续。`,
      `应用 skill: ${skillLabel}`,
      `主题: ${topic || "（无）"}`,
      "",
      "上一步产出:",
      output.slice(0, 2000),
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(text);
  }

  return (
    <div className={`rise ${styles.wrap}`}>
      <div className={styles.head}>
        <p className="pill">/{flow.command || flow.id}</p>
        <h1>{flow.name}</h1>
        <p className="muted">{flow.description || "按节点推进，LLM 执行当前 skill。"}</p>
      </div>

      <div className={styles.track}>
        {nodeOrder.map((id) => (
          <span
            key={id}
            className={`${styles.dot} ${id === nodeId ? styles.dotActive : ""} ${
              active?.completed_nodes.some((c) => c.node_id === id) ? styles.dotDone : ""
            }`}
            title={flow.nodes[id]?.title || id}
          >
            {id}
          </span>
        ))}
      </div>

      <div className={`panel ${styles.controls}`}>
        <label>
          主题 / Topic
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="例如：面向远程团队的 AI 会议纪要"
          />
        </label>
        {!active || active.flow_id !== flow.id ? (
          <button type="button" className="btn btn-primary" onClick={start}>
            启动流程
          </button>
        ) : (
          <span className="muted">
            状态：{active.status} · 节点 {nodeId}
          </span>
        )}
      </div>

      {active && node && (
        <div className={styles.grid}>
          <section className={`panel ${styles.panel}`}>
            <h2>{node.title || nodeId}</h2>
            <p className="muted">
              type: <code>{node.type}</code>
              {skill ? (
                <>
                  {" "}
                  · skill: <code>{Array.isArray(skill) ? skill.join(", ") : skill}</code>
                </>
              ) : null}
              {node.checkpoint ? " · checkpoint" : ""}
            </p>
            {node.ask && (
              <ul className={styles.ask}>
                {node.ask.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            )}
            {(node.type === "choice" || node.type === "router") && node.options && (
              <div className={styles.choices}>
                {node.options.map((opt) => {
                  const target = opt.next || opt.flow || "";
                  return (
                    <label key={opt.label} className={styles.choice}>
                      <input
                        type="radio"
                        name="choice"
                        checked={choiceTo === target}
                        onChange={() => setChoiceTo(target)}
                      />
                      {opt.label}
                      {opt.node_skill ? ` → skill:${opt.node_skill}` : ""}
                      {opt.flow ? ` → flow:${opt.flow}` : ""}
                    </label>
                  );
                })}
              </div>
            )}
            <label>
              补充输入（可选）
              <textarea
                value={userMsg}
                onChange={(e) => setUserMsg(e.target.value)}
                rows={4}
                placeholder="回答 checkpoint / 提供上下文…"
              />
            </label>
            {node.checkpoint && (
              <label className={styles.choice}>
                <input
                  type="checkbox"
                  checked={checkpointOk}
                  onChange={(e) => setCheckpointOk(e.target.checked)}
                />
                {node.checkpoint_prompt || "已确认本节点产出，可以进入下一步"}
              </label>
            )}
            <div className={styles.actions}>
              <button type="button" className="btn btn-primary" disabled={loading} onClick={runLLM}>
                {loading ? "LLM 执行中…" : "用 LLM 执行本节点"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={advance} disabled={!active}>
                下一步
              </button>
              <button type="button" className="btn btn-ghost" onClick={copyCursor} disabled={!output}>
                复制到 Cursor
              </button>
            </div>
            {error && <p className={styles.error}>{error}</p>}
          </section>

          <section className={`panel ${styles.panel}`}>
            <h2>节点产出</h2>
            <pre className={styles.out}>{output || "执行后将显示 LLM 结果。"}</pre>
          </section>
        </div>
      )}
    </div>
  );
}
