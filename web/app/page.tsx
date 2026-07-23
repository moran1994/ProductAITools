import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={`space-bg ${styles.hero}`}>
      <div className={styles.orbit} aria-hidden />
      <div className={`${styles.inner} rise`}>
        <p className="pill">Product AI Dock</p>
        <h1 className={styles.brand}>产品经理AI空间站</h1>
        <p className={styles.lead}>
          把发现、战略、PRD、上市做成可逐步推进的轨道。接上 LLM，按节点执行，而不是零散提问。
        </p>
        <div className={styles.cta}>
          <Link href="/app" className="btn btn-primary">
            进入空间站
          </Link>
          <Link href="/app/flows" className="btn btn-ghost">
            浏览流程
          </Link>
        </div>
      </div>
    </main>
  );
}
