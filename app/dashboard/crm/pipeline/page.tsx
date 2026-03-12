"use client";
import ComingSoonPage from "@/components/ComingSoonPage";
import { GitBranch } from "lucide-react";
export default function LeadPipelinePage() {
    return <ComingSoonPage title="Lead Pipeline" description="Visual pipeline view: New → Qualified → Booked → Closed. Drag-and-drop lead management." icon={GitBranch} />;
}
