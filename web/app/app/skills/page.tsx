import { skillsByDomain } from "@/lib/data";
import styles from "./skills.module.css";

export default function SkillsPage() {
  const byDomain = skillsByDomain();
  return (
    <div className="rise">
      <p className="pill">Skills</p>
      <h1 className={styles.title}>技能星图</h1>
      <p className="muted">按域浏览空间站可用的 PM skills；流程节点会引用它们并由 LLM 执行。</p>
      <div className={styles.domains}>
        {Object.entries(byDomain).map(([domain, skills]) => (
          <section key={domain} className={`panel ${styles.section}`}>
            <h2>
              {domain} <span className="muted">({skills.length})</span>
            </h2>
            <ul>
              {skills.map((s) => (
                <li key={s.id}>
                  <code>{s.id}</code>
                  <span className="muted">{s.description}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
