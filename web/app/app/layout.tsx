import Link from "next/link";
import styles from "./app.module.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`space-bg ${styles.shell}`}>
      <header className={styles.top}>
        <Link href="/" className={styles.logo}>
          产品经理AI空间站
        </Link>
        <nav className={styles.nav}>
          <Link href="/app">总览</Link>
          <Link href="/app/flows">流程</Link>
          <Link href="/app/skills">技能</Link>
        </nav>
      </header>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
