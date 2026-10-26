// app/page.tsx
import ChatLayout from "@/components/layout/ChatLayout";

export default function HomePage() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <ChatLayout />
    </div>
  );
}