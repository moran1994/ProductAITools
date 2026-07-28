"use client";

export type ActiveState = {
  flow_id: string;
  flow_name: string;
  node_id: string;
  status: "running" | "completed";
  vars: Record<string, string>;
  completed_nodes: Array<{ node_id: string; at: string; note?: string }>;
  started_at: string;
  transcripts: Record<string, string>;
};

const KEY = "pm-space-station-active";
const HANDOFF_KEY = "pm-space-station-handoff";

export type HandoffState = {
  topic?: string;
  product_stage?: string;
  from_flow?: string;
  to_flow?: string;
};

export function loadActive(): ActiveState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ActiveState) : null;
  } catch {
    return null;
  }
}

export function saveActive(state: ActiveState | null) {
  if (typeof window === "undefined") return;
  if (!state) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, JSON.stringify(state));
}

export function saveHandoff(handoff: HandoffState | null) {
  if (typeof window === "undefined") return;
  if (!handoff) sessionStorage.removeItem(HANDOFF_KEY);
  else sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(handoff));
}

export function consumeHandoff(toFlowId: string): HandoffState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as HandoffState;
    if (data.to_flow && data.to_flow !== toFlowId) return null;
    sessionStorage.removeItem(HANDOFF_KEY);
    return data;
  } catch {
    return null;
  }
}
