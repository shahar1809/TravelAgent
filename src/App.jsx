import { usePath } from "./router.jsx";
import ClientApp from "./client/ClientApp.jsx";
import AgentApp from "./agent/AgentApp.jsx";

const CLIENT_SECTIONS = ["hotels", "schedule", "wallet"];

export default function App() {
  const path = usePath();
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "agent") return <AgentApp path={path} />;
  const section = CLIENT_SECTIONS.includes(parts[0]) ? parts[0] : "";
  return <ClientApp section={section} />;
}
