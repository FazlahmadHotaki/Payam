// components/stories/GlobalStoryViewer.tsx
"use client";

import { useChat } from "@/lib/chat-context";
import StoryViewer from "./StoryViewer";

export default function GlobalStoryViewer() {
  const {
    viewingStoryGroup,
    viewingStoryIndex,
    viewingStoryVersion,
    closeStory,
  } = useChat();

  if (!viewingStoryGroup) return null;

  return (
    <StoryViewer
      key={viewingStoryVersion}
      group={viewingStoryGroup}
      initialIndex={viewingStoryIndex}
      onClose={closeStory}
    />
  );
}