import React from "react";
import { MessageCircle } from "lucide-react";

export default function ChatHeader({ title }) {
  return (
    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
      <MessageCircle className="text-indigo-500" size={18} />
      <h2 className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm">
        {title}
      </h2>
    </div>
  );
}
