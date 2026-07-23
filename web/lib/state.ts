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
