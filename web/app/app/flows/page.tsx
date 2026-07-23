import Link from "next/link";
import { listFlows } from "@/lib/data";
import styles from "../home.module.css";

export default function FlowsPage() {
  const flows = listFlows();
  return (
    <div className="rise">
      <p className="pill">Flows</p>
      <h1 className={styles.title}>流程轨道</h1>
      <p className={`muted ${styles.sub}`}>共 {flows.length} 条节点化流程，点击进入推进器。</p>
      <div className={styles.grid}>
        {flows.map((f) => (
          <Link key={f.id} href={`/app/flows/${f.id}`} className={`panel ${styles.card}`}>
            <span className={styles.cmd}>/{f.command || f.id}</span>
            <strong>{f.name}</strong>
            <span className="muted">
              {f.domain} · {f.node_count} nodes
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
