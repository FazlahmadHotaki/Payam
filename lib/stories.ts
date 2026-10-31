import { supabase } from "@/lib/supabase/client";

export type StoryMediaType = "image" | "video";

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: StoryMediaType;
  caption: string | null;
  created_at: string;
  expires_at: string;
}

export interface StoryProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export interface StoryGroup {
  userId: string;
  profile: StoryProfile | null;
  stories: Story[];
}

export async function fetchActiveStories(): Promise<StoryGroup[]> {
  const { data: stories, error } = await supabase
    .from("stories")
    .select("id, user_id, media_url, media_type, caption, created_at, expires_at")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!stories?.length) return [];

  const userIds = [...new Set(stories.map((s) => s.user_id))];

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url")
    .in("id", userIds);

  if (profileError) throw profileError;

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const groups = new Map<string, StoryGroup>();

  for (const story of stories as Story[]) {
    if (!groups.has(story.user_id)) {
      groups.set(story.user_id, {
        userId: story.user_id,
        profile: profileMap.get(story.user_id) ?? null,
        stories: [],
      });
    }
    groups.get(story.user_id)!.stories.push(story);
  }

  return [...groups.values()];
}

export async function uploadStory(file: File, caption?: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("stories")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (uploadError) throw uploadError;

  const { data: publicUrl } = supabase.storage
    .from("stories")
    .getPublicUrl(path);

  const media_type: StoryMediaType = file.type.startsWith("video")
    ? "video"
    : "image";

  const { error: insertError } = await supabase.from("stories").insert({
    user_id: user.id,
    media_url: publicUrl.publicUrl,
    media_type,
    caption: caption?.trim() || null,
  });

  if (insertError) throw insertError;
}