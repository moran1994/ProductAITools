#!/usr/bin/env node
import { cpSync, mkdirSync, existsSync, readdirSync, writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");
const repoRoot = join(webRoot, "..");
const src = join(repoRoot, ".cursor", "skill-os");
const dest = join(webRoot, "data");

if (!existsSync(join(src, "flows"))) {
  console.error("Missing .cursor/skill-os/flows");
  process.exit(1);
}

mkdirSync(join(dest, "flows"), { recursive: true });
cpSync(join(src, "flows"), join(dest, "flows"), { recursive: true });

const catalogSrc = join(src, "catalog", "skills.json");
if (existsSync(catalogSrc)) {
  cpSync(catalogSrc, join(dest, "catalog.json"));
} else {
  writeFileSync(join(dest, "catalog.json"), JSON.stringify({ skills: [], domains: {} }, null, 2));
}

const indexSrc = join(src, "flows", "index.json");
cpSync(indexSrc, join(dest, "index.json"));

const bundle = {};
for (const f of readdirSync(join(dest, "flows"))) {
  if (f.endsWith(".flow.json")) {
    const id = f.replace(/\.flow\.json$/, "");
    bundle[id] = JSON.parse(readFileSync(join(dest, "flows", f), "utf8"));
  }
}
writeFileSync(join(dest, "flows-bundle.json"), JSON.stringify(bundle));

const homeSkills = join(process.env.HOME || "", ".cursor", "skills");
const skillBodies = {};
if (existsSync(homeSkills)) {
  for (const id of readdirSync(homeSkills)) {
    const skillMd = join(homeSkills, id, "SKILL.md");
    if (existsSync(skillMd)) {
      const text = readFileSync(skillMd, "utf8");
      skillBodies[id] = text.replace(/^---[\s\S]*?---\s*/, "").slice(0, 6000);
    }
  }
}
writeFileSync(join(dest, "skill-bodies.json"), JSON.stringify(skillBodies));

console.log(
  `Synced ${Object.keys(bundle).length} flows, catalog, ${Object.keys(skillBodies).length} skill bodies → web/data/`
);
