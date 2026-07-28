"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Flow, FlowNode } from "@/lib/types";
import { resolveSkill } from "@/lib/types";
import { loadActive, saveActive, saveHandoff, consumeHandoff, type ActiveState } from "@/lib/state";
import styles from "./FlowRunner.module.css";

type FieldKey = "topic" | "choice" | "checkpoint" | "output" | "stage" | "";

type OptionTarget =
  | { kind: "next"; value: string }
  | { kind: "flow"; value: string }
  | { kind: "skill"; value: string };

function optionTarget(opt: { next?: string; flow?: string; node_skill?: string }): OptionTarget | null {
  if (opt.next) return { kind: "next", value: opt.next };
  if (opt.flow) return { kind: "flow", value: opt.flow };
  if (opt.node_skill) return { kind: "skill", value: opt.node_skill };
  return null;
}

function optionKey(opt: { next?: string; flow?: string; node_skill?: string; label: string }, index: number) {
  const t = optionTarget(opt);
  if (!t) return `idx:${index}:${opt.label}`;
  return `${t.kind}:${t.value}`;
}

function parseOptionKey(key: string): OptionTarget | null {
  const i = key.indexOf(":");
  if (i < 0) return null;
  const kind = key.slice(0, i);
  const value = key.slice(i + 1);
  if (kind === "next" || kind === "flow" || kind === "skill") return { kind, value };
  return null;
}

export function FlowRunner({ flow }: { flow: Flow }) {
  const router = useRouter();
  const [active, setActive] = useState<ActiveState | null>(null);
  const [topic, setTopic] = useState("");
  const [productStage, setProductStage] = useState("");
  const [userMsg, setUserMsg] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<FieldKey>("");
  const [choiceKey, setChoiceKey] = useState("");
  const [checkpointOk, setCheckpointOk] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  const needsProductStage = useMemo(
    () => Object.values(flow.nodes).some((n) => n.skill_by?.when === "product_stage"),
    [flow.nodes]
  );

  useEffect(() => {
    const existing = loadActive();
    const handoff = consumeHandoff(flow.id);
    if (handoff?.topic) setTopic(handoff.topic);
    if (handoff?.product_stage) setProductStage(handoff.product_stage);

    if (existing?.flow_id === flow.id) {
      setActive(existing);
      setTopic(existing.vars.topic || handoff?.topic || "");
      setProductStage(existing.vars.product_stage || handoff?.product_stage || "");
      const last = existing.node_id;
      if (existing.transcripts?.[last]) setOutput(existing.transcripts[last]);
    } else {
      setActive(null);
      setOutput("");
      setChoiceKey("");
      setCheckpointOk(false);
      clearValidation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.id]);

  useEffect(() => {
    if (error && alertRef.current) {
      alertRef.current.focus();
      alertRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [error]);

  const nodeId = active?.node_id || flow.entry;
  const node = flow.nodes[nodeId];
  const mergedVars = useMemo(
    () => ({
      ...(active?.vars || {}),
      ...(topic.trim() ? { topic: topic.trim() } : {}),
      ...(productStage ? { product_stage: productStage } : {}),
    }),
    [active?.vars, topic, productStage]
  );
  const skill = useMemo(() => (node ? resolveSkill(node, mergedVars) : null), [node, mergedVars]);
  const nodeOrder = useMemo(() => Object.keys(flow.nodes), [flow.nodes]);
  const stepIndex = Math.max(0, nodeOrder.indexOf(nodeId));
  const stepNumber = stepIndex + 1;
  const stepTotal = nodeOrder.length;
  const progressPct = Math.round((stepNumber / Math.max(stepTotal, 1)) * 100);

  function showValidation(message: string, field: FieldKey) {
    setError(message);
    setFieldError(field);
  }

  function clearValidation() {
    setError("");
    setFieldError("");
  }

  function buildVars() {
    const vars: Record<string, string> = { ...mergedVars };
    if (topic.trim()) vars.topic = topic.trim();
    if (productStage) vars.product_stage = productStage;
    return vars;
  }

  function start() {
    const trimmed = topic.trim();
    if (!trimmed) {
      showValidation("请先填写主题，例如「面向远程团队的 AI 会议纪要」。", "topic");
      return;
    }
    if (needsProductStage && !productStage) {
      showValidation("请选择产品阶段：已有产品或新产品。", "stage");
      return;
    }
    const state: ActiveState = {
      flow_id: flow.id,
      flow_name: flow.name,
      node_id: flow.entry,
      status: "running",
      vars: buildVars(),
      completed_nodes: [],
      started_at: new Date().toISOString(),
      transcripts: {},
    };
    setActive(state);
    saveActive(state);
    setOutput("");
    setChoiceKey("");
    setCheckpointOk(false);
    clearValidation();
  }

  function restart() {
    saveActive(null);
    setActive(null);
    setOutput("");
    setUserMsg("");
    setChoiceKey("");
    setCheckpointOk(false);
    clearValidation();
  }

  async function callNodeLLM(targetNode: FlowNode, targetNodeId: string, extraUserMsg?: string) {
    const vars = buildVars();
    const res = await fetch("/api/run-node", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        flowId: flow.id,
        flowName: flow.name,
        nodeId: targetNodeId,
        node: targetNode,
        vars,
        topic: vars.topic,
        userMessage: extraUserMsg || userMsg || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "运行失败，请检查大模型服务（Ollama）是否已启动。");
    }
    return data.content as string;
  }

  async function runLLM() {
    if (!node || !active) return;
    if (!topic.trim()) {
      showValidation("执行前请填写主题。", "topic");
      return;
    }
    if (needsProductStage && !productStage) {
      showValidation("请选择产品阶段后再执行。", "stage");
      return;
    }
    setLoading(true);
    clearValidation();
    try {
      const content = await callNodeLLM(node, nodeId);
      setOutput(content);
      const nextState: ActiveState = {
        ...active,
        vars: buildVars(),
        transcripts: { ...active.transcripts, [nodeId]: content },
      };
      setActive(nextState);
      saveActive(nextState);
    } catch (e) {
      showValidation(e instanceof Error ? e.message : String(e), "");
    } finally {
      setLoading(false);
    }
  }

  async function advance() {
    if (!active || !node) return;

    if (!topic.trim()) {
      showValidation("主题不能为空。", "topic");
      return;
    }

    const isBranch = node.type === "choice" || node.type === "router";
    if (isBranch && !choiceKey) {
      showValidation("请先选择一项，再继续（可先执行大模型获取推荐）。", "choice");
      return;
    }

    const needsOutput =
      node.type === "skill" || node.type === "gate" || node.type === "compose" || node.type === "sequence";
    if (needsOutput && !output.trim()) {
      showValidation("请先执行本节点，确认有产出后再继续。", "output");
      return;
    }

    if (node.checkpoint && !checkpointOk) {
      showValidation(
        node.checkpoint_prompt ? `需确认：${node.checkpoint_prompt}` : "请勾选检查点确认后再继续。",
        "checkpoint"
      );
      return;
    }

    const completed = [
      ...active.completed_nodes,
      { node_id: nodeId, at: new Date().toISOString(), note: userMsg.slice(0, 120) },
    ];
    const vars = buildVars();

    if (isBranch && choiceKey) {
      const target = parseOptionKey(choiceKey);
      if (!target) {
        showValidation("选项无效，请重新选择。", "choice");
        return;
      }

      if (target.kind === "flow") {
        const done: ActiveState = { ...active, status: "completed", completed_nodes: completed, vars };
        setActive(done);
        saveActive(done);
        saveHandoff({
          topic: vars.topic,
          product_stage: vars.product_stage,
          from_flow: flow.id,
          to_flow: target.value,
        });
        clearValidation();
        router.push(`/app/flows/${target.value}`);
        return;
      }

      if (target.kind === "skill") {
        setLoading(true);
        clearValidation();
        try {
          const skillNode: FlowNode = {
            type: "skill",
            title: `执行技能：${target.value}`,
            skill: target.value,
            terminal: true,
          };
          const content = await callNodeLLM(
            skillNode,
            `skill:${target.value}`,
            `请围绕主题执行技能 ${target.value}。`
          );
          setOutput(content);
          const done: ActiveState = {
            ...active,
            status: "completed",
            completed_nodes: [...completed, { node_id: `skill:${target.value}`, at: new Date().toISOString() }],
            vars,
            transcripts: { ...active.transcripts, [nodeId]: content, [`skill:${target.value}`]: content },
          };
          setActive(done);
          saveActive(done);
        } catch (e) {
          showValidation(e instanceof Error ? e.message : String(e), "");
        } finally {
          setLoading(false);
        }
        return;
      }

      if (!flow.nodes[target.value]) {
        showValidation(`目标节点「${target.value}」不存在。`, "choice");
        return;
      }
      const nextState: ActiveState = {
        ...active,
        node_id: target.value,
        completed_nodes: completed,
        status: "running",
        vars,
      };
      setActive(nextState);
      saveActive(nextState);
      setOutput(nextState.transcripts[target.value] || "");
      setUserMsg("");
      setChoiceKey("");
      setCheckpointOk(false);
      clearValidation();
      return;
    }

    if (node.terminal) {
      const done: ActiveState = { ...active, status: "completed", completed_nodes: completed, vars };
      setActive(done);
      saveActive(done);
      clearValidation();
      return;
    }

    const next = node.next;
    if (!next || !flow.nodes[next]) {
      const done: ActiveState = { ...active, status: "completed", completed_nodes: completed, vars };
      setActive(done);
      saveActive(done);
      clearValidation();
      return;
    }

    const nextState: ActiveState = {
      ...active,
      node_id: next,
      completed_nodes: completed,
      status: "running",
      vars,
    };
    setActive(nextState);
    saveActive(nextState);
    setOutput(nextState.transcripts[next] || "");
    setUserMsg("");
    setChoiceKey("");
    setCheckpointOk(false);
    clearValidation();
  }

  function copyCursor() {
    if (!output.trim()) {
      showValidation("暂无产出可复制，请先执行本节点。", "output");
      return;
    }
    const skillLabel = Array.isArray(skill) ? skill.join(",") : skill || "";
    const slash = flow.command ? `/${flow.command} ${topic || ""}`.trim() : "";
    const text = [
      slash ? `Cursor 命令：${slash}` : "",
      `在产品经理AI空间站流程「${flow.name}」的节点「${nodeId}」继续。`,
      `应用技能：${skillLabel}`,
      `主题：${topic || "（无）"}`,
      productStage ? `产品阶段：${productStage === "existing" ? "已有产品" : "新产品"}` : "",
      "",
      "上一步产出：",
      output.slice(0, 2000),
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(text);
    clearValidation();
  }

  const statusLabel =
    active?.status === "completed" ? "已完成" : active?.status === "running" ? "进行中" : "";

  const typeLabel: Record<string, string> = {
    gate: "门禁",
    skill: "技能",
    choice: "选择",
    router: "路由",
    info: "说明",
    compose: "汇总",
    sequence: "顺序",
  };

  const running = Boolean(active && active.flow_id === flow.id);
  const skillText = Array.isArray(skill) ? skill.join(", ") : skill;

  return (
    <div className={`rise ${styles.wrap}`}>
      <header className={styles.head}>
        <div className={styles.headTop}>
          <p className="pill">/{flow.command || flow.id}</p>
          {running && (
            <button type="button" className={styles.linkBtn} onClick={restart} disabled={loading}>
              重新开始
            </button>
          )}
        </div>
        <h1>{flow.name}</h1>
        <p className={styles.desc}>{flow.description || "按节点推进，由大模型执行当前技能。"}</p>
      </header>

      {error && (
        <div ref={alertRef} className={styles.alert} role="alert" tabIndex={-1}>
          <strong>需要先处理</strong>
          <span>{error}</span>
        </div>
      )}

      {!running && (
        <section className={`panel ${styles.setup}`}>
          <h2 className={styles.setupTitle}>开始前先填好上下文</h2>
          <p className={styles.setupHint}>主题会贯穿整条流程；产品阶段决定后续用哪套技能。</p>
          <div className={styles.setupFields}>
            <label className={fieldError === "topic" ? styles.fieldInvalid : undefined}>
              <span className={styles.labelRow}>
                主题
                <span className={styles.required}>必填</span>
              </span>
              <input
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  if (fieldError === "topic") clearValidation();
                }}
                placeholder="例如：面向远程团队的 AI 会议纪要"
                aria-invalid={fieldError === "topic"}
              />
              {fieldError === "topic" && <span className={styles.fieldHint}>主题不能留空。</span>}
            </label>

            {needsProductStage && (
              <label className={fieldError === "stage" ? styles.fieldInvalid : undefined}>
                <span className={styles.labelRow}>
                  产品阶段
                  <span className={styles.required}>必选</span>
                </span>
                <select
                  value={productStage}
                  onChange={(e) => {
                    setProductStage(e.target.value);
                    if (fieldError === "stage") clearValidation();
                  }}
                  aria-invalid={fieldError === "stage"}
                >
                  <option value="">请选择</option>
                  <option value="existing">已有产品</option>
                  <option value="new">新产品</option>
                </select>
                {fieldError === "stage" && <span className={styles.fieldHint}>请选择已有产品或新产品。</span>}
              </label>
            )}
          </div>
          <button type="button" className="btn btn-primary" onClick={start}>
            启动流程
          </button>
        </section>
      )}

      {running && node && (
        <div className={styles.workspace}>
          <aside className={styles.sidebar} aria-label="流程步骤">
            <div className={styles.progressCard}>
              <p className={styles.progressLabel}>
                第 {stepNumber} / {stepTotal} 步
              </p>
              <div className={styles.progressBar} aria-hidden>
                <span style={{ width: `${progressPct}%` }} />
              </div>
              <p className={styles.progressStatus}>{statusLabel}</p>
            </div>
            <ol className={styles.steps}>
              {nodeOrder.map((id, i) => {
                const done = active?.completed_nodes.some((c) => c.node_id === id);
                const current = id === nodeId;
                return (
                  <li
                    key={id}
                    className={`${styles.step} ${current ? styles.stepCurrent : ""} ${done ? styles.stepDone : ""}`}
                  >
                    <span className={styles.stepNum}>{i + 1}</span>
                    <span className={styles.stepTitle}>{flow.nodes[id]?.title || id}</span>
                  </li>
                );
              })}
            </ol>
            <div className={styles.contextMini}>
              <p>
                <span>主题</span>
                {topic || "—"}
              </p>
              {needsProductStage && (
                <p>
                  <span>阶段</span>
                  {productStage === "existing" ? "已有产品" : productStage === "new" ? "新产品" : "—"}
                </p>
              )}
            </div>
          </aside>

          <div className={styles.main}>
            <section className={`panel ${styles.work}`}>
              <div className={styles.workHead}>
                <p className={styles.eyebrow}>当前步骤</p>
                <h2>{node.title || nodeId}</h2>
                <p className={styles.meta}>
                  {typeLabel[node.type] || node.type}
                  {skillText ? ` · ${skillText}` : ""}
                  {node.checkpoint ? " · 完成后需确认" : ""}
                </p>
              </div>

              {node.ask && node.ask.length > 0 && (
                <div className={styles.guide}>
                  <p className={styles.guideTitle}>本步要回答</p>
                  <ul>
                    {node.ask.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(node.type === "choice" || node.type === "router") && node.options && (
                <div
                  className={`${styles.choices} ${fieldError === "choice" ? styles.blockInvalid : ""}`}
                  role="radiogroup"
                  aria-label="节点选项"
                >
                  <p className={styles.guideTitle}>
                    选择下一步
                    <span className={styles.required}>必选</span>
                  </p>
                  <p className={styles.softHint}>可先点下方「生成结果」获取推荐，再做选择。</p>
                  {node.options.map((opt, index) => {
                    const key = optionKey(opt, index);
                    const t = optionTarget(opt);
                    return (
                      <label key={key} className={styles.choice}>
                        <input
                          type="radio"
                          name="choice"
                          checked={choiceKey === key}
                          onChange={() => {
                            setChoiceKey(key);
                            if (fieldError === "choice") clearValidation();
                          }}
                        />
                        <span>
                          {opt.label}
                          {t?.kind === "flow" ? `（进入流程 ${t.value}）` : ""}
                          {t?.kind === "skill" ? `（执行技能 ${t.value}）` : ""}
                        </span>
                      </label>
                    );
                  })}
                  {fieldError === "choice" && <span className={styles.fieldHint}>请先选择一项。</span>}
                </div>
              )}

              <label className={styles.inputBlock}>
                <span className={styles.labelRow}>补充说明（可选）</span>
                <textarea
                  value={userMsg}
                  onChange={(e) => setUserMsg(e.target.value)}
                  rows={5}
                  placeholder="补充背景、约束或你的判断…"
                />
              </label>

              {node.checkpoint && (
                <label
                  className={`${styles.checkpoint} ${fieldError === "checkpoint" ? styles.blockInvalid : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checkpointOk}
                    onChange={(e) => {
                      setCheckpointOk(e.target.checked);
                      if (fieldError === "checkpoint") clearValidation();
                    }}
                  />
                  <span>{node.checkpoint_prompt || "我已确认本步产出，可以进入下一步"}</span>
                </label>
              )}

              <div className={styles.actions}>
                <button type="button" className="btn btn-primary" disabled={loading} onClick={runLLM}>
                  {loading ? "生成中…" : "1. 生成结果"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => void advance()}
                  disabled={loading}
                >
                  {node.type === "router" || node.type === "choice" ? "2. 确认选择并继续" : "2. 进入下一步"}
                </button>
                <button
                  type="button"
                  className={styles.textBtn}
                  onClick={copyCursor}
                  disabled={!output || loading}
                >
                  复制到 Cursor
                </button>
              </div>
            </section>

            <section
              className={`panel ${styles.result} ${fieldError === "output" ? styles.blockInvalid : ""}`}
            >
              <div className={styles.resultHead}>
                <h2>本步产出</h2>
                {output ? (
                  <span className={styles.resultReady}>已生成</span>
                ) : (
                  <span className={styles.resultEmpty}>待生成</span>
                )}
              </div>
              {fieldError === "output" && (
                <p className={styles.fieldHint}>还没有产出，请先点「生成结果」。</p>
              )}
              {active?.status === "completed" && (
                <p className={styles.doneBanner}>流程已完成。可重新开始，或从导航进入其他流程。</p>
              )}
              <pre className={styles.out}>
                {output || "点上方「1. 生成结果」后，这里会显示大模型输出。"}
              </pre>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
