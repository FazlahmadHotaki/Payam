
import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { ChatProvider } from "@/lib/chat-context";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Payam",
  description: "Chat with your contacts on Telechat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Tailwind CSS Browser CDN */}
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
      </head>

      <body className="h-full overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          <ChatProvider>
            <AppShell>{children}</AppShell>
          </ChatProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}