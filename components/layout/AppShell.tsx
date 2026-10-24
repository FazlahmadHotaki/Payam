// components/layout/AppShell.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { useChat } from "@/lib/chat-context";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const { activeConversation } = useChat();
  const isLogin = pathname.startsWith("/login");

  if (isLogin) return <>{children}</>;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-slate-900">
      {/* 
        Left Pane (Sidebar) 
        Hidden on mobile if a chat is active. 
      */}
      <div
        className={`h-full w-full shrink-0 border-r border-slate-200 dark:border-slate-800 md:flex md:w-[380px] lg:w-[420px] ${
          activeConversation ? "hidden md:flex" : "flex"
        }`}
      >
        <Sidebar />
      </div>

      {/* 
        Right Pane (Chat Area) 
        Hidden on mobile if NO chat is active.
      */}
      <div
        className={`h-full min-w-0 flex-1 flex-col ${
          activeConversation ? "flex" : "hidden md:flex"
        }`}
      >
        {children}
      </div>
    </div>
  );
}