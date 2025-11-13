// src/features/chat/pages/ChatPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../app/providers/AuthContext";
import ConversationsSidebar from "../components/ConversationsSidebar";
import ChatContainer from "../components/ChatContainer";
import { useChatSocket } from "../hooks/useChatSocket";
import { fetchThreads } from "../api/threads";
import { fetchThreadMessages } from "../api/messages";

export default function ChatPage() {
  const { me, token } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeThread, setActiveThread] = useState(null);

  const [history, setHistory] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const { messages: liveMessages, sendMessage, isReady } = useChatSocket({
    threadId: activeThread?.id,
    token,
    userId: me?.id,
  });

  const mergedMessages = useMemo(() => {
    const map = new Map();
    for (const m of history) map.set(m.id, m);
    for (const m of liveMessages) map.set(m.id, m);
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );
  }, [history, liveMessages]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingThreads(true);
        const threads = await fetchThreads();
        if (!mounted) return;
        setConversations(threads);
        if (!activeThread && threads.length) setActiveThread(threads[0]);
      } finally {
        setLoadingThreads(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!activeThread?.id) {
        setHistory([]);
        return;
      }
      try {
        setLoadingMessages(true);
        const msgs = await fetchThreadMessages(activeThread.id, { page_size: 100 });
        if (!mounted) return;
        setHistory(msgs);
      } catch {
        setHistory([]);
      } finally {
        setLoadingMessages(false);
      }
    })();
    return () => { mounted = false; };
  }, [activeThread?.id]);

  return (
    <div className="h-[calc(100dvh-4rem)] min-h-0 grid grid-cols-1 sm:grid-cols-[300px,1fr] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-950/70">
      <ConversationsSidebar
        loading={loadingThreads}
        conversations={conversations}
        activeId={activeThread?.id}
        onSelect={(id) => {
          const thread = conversations.find((c) => c.id === id);
          setActiveThread(thread || null);
        }}
      />
      <div className="flex flex-col min-h-0">
        <ChatContainer
          key={activeThread?.id || "none"}
          me={me}
          conversation={activeThread}
          initialMessages={mergedMessages}
          onSendMessage={(text) => sendMessage(text)}
          loading={loadingThreads || loadingMessages}
          connectionReady={isReady}
        />
      </div>
    </div>
  );
}
