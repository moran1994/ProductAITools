import type { CatalogSkill, Flow, FlowIndexItem } from "./types";
import indexJson from "@/data/index.json";
import catalogJson from "@/data/catalog.json";
import flowsBundle from "@/data/flows-bundle.json";

export function listFlows(): FlowIndexItem[] {
  return (indexJson as { flows: FlowIndexItem[] }).flows;
}

export function getFlow(id: string): Flow | null {
  const bundle = flowsBundle as Record<string, Flow>;
  return bundle[id] || null;
}

export function listSkills(): CatalogSkill[] {
  return ((catalogJson as { skills?: CatalogSkill[] }).skills || []) as CatalogSkill[];
}

export function skillsByDomain(): Record<string, CatalogSkill[]> {
  const map: Record<string, CatalogSkill[]> = {};
  for (const s of listSkills()) {
    const key = s.domain_label || s.domain || "其他";
    (map[key] ||= []).push(s);
  }
  return map;
}
