// src/pages/HomePage.jsx
import { useAuth } from "../../../app/providers/AuthContext";
import ChatPage from "../../../features/chat/pages/ChatPage";

export default function HomePage() {
  const { me } = useAuth();

  return (
    <div className="min-h-dvh bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      {/* Renderiza el chat directamente */}
      <ChatPage user={me} />
    </div>
  );
}
