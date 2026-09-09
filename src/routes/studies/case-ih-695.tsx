import { createFileRoute } from "@tanstack/react-router";
import { StudyShell } from "@/studies/shell/StudyShell";

export const Route = createFileRoute("/studies/case-ih-695")({
  component: CaseIh695Study,
});

function CaseIh695Study() {
  return <StudyShell machineId="case-ih-695" />;
}
