import Link from "next/link";
import { listFlows } from "@/lib/data";
import styles from "./home.module.css";
import { LlmStatus } from "@/components/LlmStatus";

export default function AppHomePage() {
  const flows = listFlows().filter((f) => f.id !== "pm-lifecycle");
  return (
    <div className="rise">
      <p className="pill">工作台</p>
      <h1 className={styles.title}>轨道控制台</h1>
      <p className={`muted ${styles.sub}`}>
        选择一条产品流程，按节点推进。每一步可由大模型执行对应技能。
      </p>
      <LlmStatus />
      <div className={styles.grid}>
        {flows.map((f) => (
          <Link key={f.id} href={`/app/flows/${f.id}`} className={`panel ${styles.card}`}>
            <span className={styles.cmd}>/{f.command || f.id}</span>
            <strong>{f.name}</strong>
            <span className="muted">{f.node_count} 个节点</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
