import { notFound } from "next/navigation";
import { getFlow, listFlows } from "@/lib/data";
import { FlowRunner } from "@/components/FlowRunner";

export function generateStaticParams() {
  return listFlows().map((f) => ({ id: f.id }));
}

export default async function FlowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const flow = getFlow(id);
  if (!flow) notFound();
  return <FlowRunner flow={flow} />;
}
