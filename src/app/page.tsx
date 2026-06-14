import { readDiagrams } from "@/lib/diagrams";
import { DiagramViewer } from "@/components/DiagramViewer";

export default function Home() {
  const diagrams = readDiagrams();
  return <DiagramViewer diagrams={diagrams} />;
}
