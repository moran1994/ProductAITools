"use client";

import { useEffect, useState } from "react";
import styles from "./LlmStatus.module.css";

export function LlmStatus() {
  const [info, setInfo] = useState<{ configured: boolean; model: string; baseUrl: string } | null>(
    null
  );

  useEffect(() => {
    fetch("/api/run-node")
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => setInfo({ configured: false, model: "-", baseUrl: "-" }));
  }, []);

  if (!info) return <p className="muted">检测 LLM 配置中…</p>;

  return (
    <div className={`panel ${styles.box}`}>
      <span className={info.configured ? styles.ok : styles.warn}>
        {info.configured ? "LLM 已连接" : "LLM 未配置"}
      </span>
      <span className="muted">
        {info.model} · {info.baseUrl}
      </span>
      {!info.configured && (
        <span className="muted">在 web/.env.local 写入 LLM_API_KEY / LLM_BASE_URL / LLM_MODEL</span>
      )}
    </div>
  );
}
