import { createHash } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readDiagrams } from "@/lib/diagrams";
import { DiagramViewer } from "@/components/DiagramViewer";

// Always server-render so the auth check runs on every request
export const dynamic = "force-dynamic";

async function requireAuth() {
  const password = process.env.VIEWER_PASSWORD;
  if (!password) return; // no env var → open access (local dev)

  const store = await cookies();
  const token = store.get("meridian-auth")?.value;
  const expected = createHash("sha256").update(password).digest("hex");

  if (!token || token !== expected) redirect("/login");
}

export default async function Home() {
  await requireAuth();
  const diagrams = readDiagrams();
  return <DiagramViewer diagrams={diagrams} />;
}
