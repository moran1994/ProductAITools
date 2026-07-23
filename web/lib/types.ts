export type NodeType = "gate" | "skill" | "choice" | "compose" | "router" | "sequence";

export type FlowNode = {
  type: NodeType;
  title?: string;
  skill?: string;
  skill_by?: { when: string; map: Record<string, string> };
  alt_skills?: string[];
  ask?: string[];
  checkpoint?: boolean;
  checkpoint_prompt?: string;
  next?: string;
  terminal?: boolean;
  optional?: boolean;
  options?: Array<{ label: string; next?: string; flow?: string; node_skill?: string }>;
  steps?: string[];
  artifact?: string;
  note?: string;
  outputs?: string[];
};

export type Flow = {
  id: string;
  name: string;
  domain?: string;
  command?: string;
  description?: string;
  entry: string;
  nodes: Record<string, FlowNode>;
  vars?: Record<string, string>;
};

export type FlowIndexItem = {
  id: string;
  name: string;
  domain?: string;
  command?: string;
  entry?: string;
  file?: string;
  node_count: number;
};

export type CatalogSkill = {
  id: string;
  name: string;
  description: string;
  domain: string;
  domain_label: string;
};

export function resolveSkill(node: FlowNode, vars: Record<string, string> = {}): string | string[] | null {
  if (node.skill) return node.skill;
  if (node.skill_by) {
    const key = vars[node.skill_by.when];
    return node.skill_by.map[key] || Object.values(node.skill_by.map)[0] || null;
  }
  if (node.type === "sequence" && node.steps) return node.steps;
  return null;
}
