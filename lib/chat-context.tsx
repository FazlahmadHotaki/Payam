// lib/chat-context.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type {
  Conversation,
  Message,
  Profile,
  StoryGroup,
  StoryComment,
} from "@/lib/chat";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "An unexpected error occurred.";
}

function logSupabaseError(label: string, err: unknown) {
  if (typeof err === "object" && err !== null) {
    const e = err as {
      message?: string;
      code?: string;
      details?: string;
      hint?: string;
    };
    console.error(label, {
      message: e.message,
      code: e.code,
      details: e.details,
      hint: e.hint,
    });
  } else {
    console.error(label, String(err));
  }
}

function sortByRecency(list: Conversation[]): Conversation[] {
  return [...list].sort((a, b) => {
    const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return tb - ta;
  });
}

type UpdateUsernameResult = { ok: boolean; error?: string };
type UpdateAvatarResult = { ok: boolean; error?: string; url?: string };
type CreateStoryResult = { ok: boolean; error?: string };
type SimpleResult = { ok: boolean; error?: string };

type ChatContextType = {
  userId: string;
  myProfile: Profile | null;
  contacts: Profile[];
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  unreadCounts: Record<string, number>;
  stories: StoryGroup[];
  loadingStories: boolean;
  loading: boolean;
  loadingMessages: boolean;
  sending: boolean;
  error: string;
  setError: (error: string) => void;
  setActiveConversation: (conversation: Conversation | null) => void;
  loadContacts: (uid: string) => Promise<void>;
  loadConversations: (uid: string) => Promise<void>;
  loadStories: () => Promise<void>;
  openConversation: (contact: Profile) => Promise<void>;
  sendMessage: (content: string) => Promise<boolean>;
  clearActive: () => void;
  markAsRead: (conversationId: string) => Promise<void>;
  updateUsername: (newUsername: string) => Promise<UpdateUsernameResult>;
  updateAvatar: (file: File) => Promise<UpdateAvatarResult>;
  deleteMessageForMe: (messageId: string) => Promise<boolean>;
  deleteMessageForEveryone: (messageId: string) => Promise<boolean>;
  deleteConversation: (conversationId: string) => Promise<boolean>;
  createStory: (file: File, caption?: string) => Promise<CreateStoryResult>;
  viewStory: (storyId: string) => Promise<void>;
  deleteStory: (storyId: string) => Promise<boolean>;
  toggleStoryLike: (storyId: string) => Promise<boolean>;
  getStoryLikes: (storyId: string) => Promise<Profile[]>;
  getStoryComments: (storyId: string) => Promise<StoryComment[]>;
  addStoryComment: (
    storyId: string,
    content: string,
    replyToId?: string
  ) => Promise<SimpleResult>;
  deleteStoryComment: (commentId: string) => Promise<boolean>;
  repostStory: (storyId: string) => Promise<SimpleResult>;
  signOut: () => Promise<void>;

  // ─── Global story viewer + user info panel ───
  viewingStoryGroup: StoryGroup | null;
  viewingStoryIsActive: boolean;
  viewingStoryIndex: number;
  viewingStoryVersion: number;
  openStory: (userId: string, startIndex?: number) => void;
  openStoryGroup: (
    group: StoryGroup,
    isActive: boolean,
    startIndex?: number
  ) => void;
  closeStory: () => void;
  getUserStories: (targetUserId: string) => Promise<{
    active: StoryGroup | null;
    archived: StoryGroup | null;
  }>;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const isLogin = pathname.startsWith("/login");

  const [userId, setUserId] = useState("");
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [stories, setStories] = useState<StoryGroup[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // ─── Global story viewer state ───
  const [viewingStoryGroup, setViewingStoryGroup] =
    useState<StoryGroup | null>(null);
  const [viewingStoryIsActive, setViewingStoryIsActive] = useState(true);
  const [viewingStoryIndex, setViewingStoryIndex] = useState(0);
  const [viewingStoryVersion, setViewingStoryVersion] = useState(0);

  const conversationsRef = useRef<Conversation[]>([]);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const activeIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeIdRef.current = activeConversation?.id ?? null;
  }, [activeConversation]);

  const clearUserData = useCallback(() => {
    setUserId("");
    setMyProfile(null);
    setContacts([]);
    setConversations([]);
    setMessages([]);
    setActiveConversation(null);
    setUnreadCounts({});
    setStories([]);
    setViewingStoryGroup(null);
    setViewingStoryIsActive(true);
    setViewingStoryIndex(0);
  }, []);

  const clearActive = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
    setError("");
  }, []);

  // ─── Global story viewer: open / close ───
  const openStory = useCallback(
    (uid: string, startIndex = 0) => {
      const group = stories.find((g) => g.user.id === uid);
      if (!group) return;
      setViewingStoryGroup(group);
      setViewingStoryIsActive(true);
      setViewingStoryIndex(startIndex);
      setViewingStoryVersion((v) => v + 1);
    },
    [stories]
  );

  const openStoryGroup = useCallback(
    (group: StoryGroup, isActive: boolean, startIndex = 0) => {
      setViewingStoryGroup(group);
      setViewingStoryIsActive(isActive);
      setViewingStoryIndex(startIndex);
      setViewingStoryVersion((v) => v + 1);
    },
    []
  );

  const closeStory = useCallback(() => {
    setViewingStoryGroup(null);
    setViewingStoryIndex(0);
  }, []);

  // Keep ACTIVE story groups synced when likes/comments/repost change them.
  // Never close here — the viewer may be showing an archived group.
  useEffect(() => {
    if (!viewingStoryGroup || !viewingStoryIsActive) return;
    const fresh = stories.find(
      (g) => g.user.id === viewingStoryGroup.user.id
    );
    if (fresh && fresh !== viewingStoryGroup) {
      setViewingStoryGroup(fresh);
    }
  }, [stories, viewingStoryGroup, viewingStoryIsActive]);

  // ============================================================
  // unread counts
  // ============================================================
  const computeUnreadCounts = useCallback(async (uid: string) => {
    try {
      const { data: memberships, error: mErr } = await supabase
        .from("conversation_members")
        .select("conversation_id, last_read_at")
        .eq("user_id", uid);

      if (mErr) {
        logSupabaseError("computeUnreadCounts", mErr);
        return;
      }

      const rows = memberships ?? [];
      if (rows.length === 0) {
        setUnreadCounts({});
        return;
      }

      const counts: Record<string, number> = {};

      for (const row of rows) {
        const convId = row.conversation_id as string;
        const lastRead = (row.last_read_at as string) || "1970-01-01";

        let result = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", convId)
          .neq("sender_id", uid)
          .is("deleted_at", null)
          .gt("created_at", lastRead);

        if (result.error) {
          result = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", convId)
            .neq("sender_id", uid)
            .gt("created_at", lastRead);
        }

        if (result.error) {
          logSupabaseError("count unread", result.error);
          continue;
        }

        counts[convId] = result.count ?? 0;
      }

      setUnreadCounts(counts);
    } catch (err) {
      logSupabaseError("computeUnreadCounts exception", err);
    }
  }, []);

  // ============================================================
  // load contacts
  // ============================================================
  const loadContacts = useCallback(async (uid: string) => {
    const { data, error: contactsError } = await supabase
      .from("profiles")
      .select("id, display_name, email, username, avatar_url")
      .neq("id", uid)
      .order("display_name");

    if (contactsError) {
      throw new Error(`Loading contacts failed: ${contactsError.message}`);
    }
    setContacts((data ?? []) as Profile[]);
  }, []);

  // ============================================================
  // load conversations
  // ============================================================
  const loadConversations = useCallback(
    async (uid: string) => {
      const { data: memberships, error: membershipError } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", uid);

      if (membershipError) {
        throw new Error(
          `Loading conversation memberships failed: ${membershipError.message}`
        );
      }

      const { data: hiddenRows } = await supabase
        .from("conversation_hides")
        .select("conversation_id")
        .eq("user_id", uid);

      const hiddenSet = new Set(
        (hiddenRows ?? []).map((r) => r.conversation_id as string)
      );

      const conversationIds = [
        ...new Set(
          (memberships ?? []).map((row) => row.conversation_id as string)
        ),
      ].filter((id) => !hiddenSet.has(id));

      if (conversationIds.length === 0) {
        setConversations([]);
        setActiveConversation(null);
        setUnreadCounts({});
        return;
      }

      const { data: memberRows, error: membersError } = await supabase
        .from("conversation_members")
        .select("conversation_id, user_id, last_read_at")
        .in("conversation_id", conversationIds);

      if (membersError) {
        throw new Error(
          `Loading conversation participants failed: ${membersError.message}`
        );
      }

      const otherUserIds = [
        ...new Set(
          (memberRows ?? [])
            .filter((row) => row.user_id !== uid)
            .map((row) => row.user_id as string)
        ),
      ];

      const { data: profileRows, error: profilesError } = otherUserIds.length
        ? await supabase
            .from("profiles")
            .select("id, display_name, email, username, avatar_url")
            .in("id", otherUserIds)
        : { data: [], error: null };

      if (profilesError) {
        throw new Error(
          `Loading conversation profiles failed: ${profilesError.message}`
        );
      }

      const { data: conversationRows, error: conversationsError } =
        await supabase
          .from("conversations")
          .select("*")
          .in("id", conversationIds);

      if (conversationsError) {
        throw new Error(
          `Loading conversations failed: ${conversationsError.message}`
        );
      }

      const { data: latestMessages } = await supabase
        .from("messages")
        .select("id, conversation_id, content, created_at, sender_id")
        .in("conversation_id", conversationIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      const { data: myDeletions } = await supabase
        .from("message_deletions")
        .select("message_id")
        .eq("user_id", uid);

      const deletedIds = new Set(
        (myDeletions ?? []).map((d) => d.message_id as string)
      );

      const latestMap = new Map<
        string,
        { content: string; created_at: string; sender_id: string }
      >();
      for (const m of latestMessages ?? []) {
        const id = (m as { id: string }).id;
        if (deletedIds.has(id)) continue;
        const convId = m.conversation_id as string;
        if (!latestMap.has(convId)) {
          latestMap.set(convId, {
            content: m.content as string,
            created_at: m.created_at as string,
            sender_id: m.sender_id as string,
          });
        }
      }

      const profileMap = new Map(
        ((profileRows ?? []) as Profile[]).map((p) => [p.id, p])
      );

      const otherUserMap = new Map<string, string>();
      for (const member of memberRows ?? []) {
        if (member.user_id !== uid) {
          otherUserMap.set(
            member.conversation_id as string,
            member.user_id as string
          );
        }
      }

      const loaded: Conversation[] = (conversationRows ?? []).map((c) => {
        const cid = c.id as string;
        const otherUserId = otherUserMap.get(cid);
        const latest = latestMap.get(cid);
        return {
          ...c,
          otherUser: otherUserId ? profileMap.get(otherUserId) ?? null : null,
          lastMessageAt: latest?.created_at ?? null,
          lastMessage: latest?.content ?? null,
          lastMessageSenderId: latest?.sender_id ?? null,
        } as unknown as Conversation;
      });

      const sorted = sortByRecency(loaded);
      setConversations(sorted);
      setActiveConversation((cur) => {
        if (!cur) return null;
        return sorted.find((c) => c.id === cur.id) ?? null;
      });

      void computeUnreadCounts(uid);
    },
    [computeUnreadCounts]
  );

  // ============================================================
  // load stories
  // ============================================================
  const loadStories = useCallback(async () => {
    if (!userId) return;
    setLoadingStories(true);

    try {
      const now = new Date().toISOString();

      const { data: rows, error: err } = await supabase
        .from("stories")
        .select("*")
        .gt("expires_at", now)
        .order("created_at", { ascending: true });

      if (err) {
        logSupabaseError("loadStories rows", err);
        return;
      }

      const userIds = [
        ...new Set((rows ?? []).map((s) => s.user_id as string)),
      ];

      const { data: profiles } = userIds.length
        ? await supabase
            .from("profiles")
            .select("id, display_name, email, username, avatar_url")
            .in("id", userIds)
        : { data: [] };

      const profileMap = new Map(
        ((profiles ?? []) as Profile[]).map((p) => [p.id, p])
      );

      const { data: myViews } = await supabase
        .from("story_views")
        .select("story_id")
        .eq("viewer_id", userId);

      const viewedSet = new Set(
        (myViews ?? []).map((v) => v.story_id as string)
      );

      const { data: allLikes } = await supabase
        .from("story_likes")
        .select("story_id, user_id");

      const likeCounts = new Map<string, number>();
      const likedByMe = new Set<string>();
      for (const l of allLikes ?? []) {
        const sid = l.story_id as string;
        likeCounts.set(sid, (likeCounts.get(sid) ?? 0) + 1);
        if (l.user_id === userId) likedByMe.add(sid);
      }

      const { data: allComments } = await supabase
        .from("story_comments")
        .select("story_id");

      const commentCounts = new Map<string, number>();
      for (const c of allComments ?? []) {
        const sid = c.story_id as string;
        commentCounts.set(sid, (commentCounts.get(sid) ?? 0) + 1);
      }

      const repostedFromIds = [
        ...new Set(
          (rows ?? [])
            .map((s) => s.reposted_from_user_id as string | null)
            .filter((x): x is string => !!x)
        ),
      ];

      const { data: repostedProfiles } = repostedFromIds.length
        ? await supabase
            .from("profiles")
            .select("id, display_name, email, username, avatar_url")
            .in("id", repostedFromIds)
        : { data: [] };

      const repostedProfileMap = new Map(
        ((repostedProfiles ?? []) as Profile[]).map((p) => [p.id, p])
      );

      const groups = new Map<string, StoryGroup>();
      for (const s of rows ?? []) {
        const uid = s.user_id as string;
        const profile = profileMap.get(uid) ?? null;
        if (!profile) continue;

        if (!groups.has(uid)) {
          groups.set(uid, {
            user: profile,
            stories: [],
            allViewed: true,
          });
        }
        const g = groups.get(uid)!;
        const viewed = viewedSet.has(s.id as string);

        g.stories.push({
          id: s.id as string,
          user_id: uid,
          media_url: s.media_url as string,
          media_type: s.media_type as "image" | "video",
          caption: (s.caption as string) || null,
          created_at: s.created_at as string,
          expires_at: s.expires_at as string,
          user: profile,
          viewed,

          like_count: likeCounts.get(s.id as string) ?? 0,
          comment_count: commentCounts.get(s.id as string) ?? 0,
          liked_by_me: likedByMe.has(s.id as string),

          reposted_from_story_id:
            (s.reposted_from_story_id as string) || null,
          reposted_from_user_id:
            (s.reposted_from_user_id as string) || null,
          reposted_from_user:
            repostedProfileMap.get(s.reposted_from_user_id as string) ??
            null,
        });

        if (!viewed) g.allViewed = false;
      }

      const arr = Array.from(groups.values()).sort((a, b) => {
        if (a.user.id === userId) return -1;
        if (b.user.id === userId) return 1;
        const ta = a.stories[a.stories.length - 1]?.created_at ?? "";
        const tb = b.stories[b.stories.length - 1]?.created_at ?? "";
        return tb.localeCompare(ta);
      });

      setStories(arr);
    } catch (err) {
      logSupabaseError("loadStories exception", err);
    } finally {
      setLoadingStories(false);
    }
  }, [userId]);

  // ============================================================
  // getUserStories (active + archived, for the info panel)
  // ============================================================
  const getUserStories = useCallback(
    async (
      targetUserId: string
    ): Promise<{ active: StoryGroup | null; archived: StoryGroup | null }> => {
      try {
        const { data: rows, error: err } = await supabase
          .from("stories")
          .select("*")
          .eq("user_id", targetUserId)
          .order("created_at", { ascending: true });

        if (err) {
          logSupabaseError("getUserStories rows", err);
          return { active: null, archived: null };
        }
        if (!rows?.length) return { active: null, archived: null };

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, display_name, email, username, avatar_url")
          .eq("id", targetUserId)
          .maybeSingle();

        if (!profile) return { active: null, archived: null };

        const storyIds = rows.map((r) => r.id as string);

        const { data: myViews } = await supabase
          .from("story_views")
          .select("story_id")
          .eq("viewer_id", userId);
        const viewedSet = new Set(
          (myViews ?? []).map((v) => v.story_id as string)
        );

        const { data: likes } = await supabase
          .from("story_likes")
          .select("story_id, user_id")
          .in("story_id", storyIds);
        const likeCounts = new Map<string, number>();
        const likedByMe = new Set<string>();
        for (const l of likes ?? []) {
          const sid = l.story_id as string;
          likeCounts.set(sid, (likeCounts.get(sid) ?? 0) + 1);
          if (l.user_id === userId) likedByMe.add(sid);
        }

        const { data: comments } = await supabase
          .from("story_comments")
          .select("story_id")
          .in("story_id", storyIds);
        const commentCounts = new Map<string, number>();
        for (const c of comments ?? []) {
          const sid = c.story_id as string;
          commentCounts.set(sid, (commentCounts.get(sid) ?? 0) + 1);
        }

        const repostedFromIds = [
          ...new Set(
            rows
              .map((s) => s.reposted_from_user_id as string | null)
              .filter((x): x is string => !!x)
          ),
        ];
        const { data: repostedProfiles } = repostedFromIds.length
          ? await supabase
              .from("profiles")
              .select("id, display_name, email, username, avatar_url")
              .in("id", repostedFromIds)
          : { data: [] };
        const repostedProfileMap = new Map(
          ((repostedProfiles ?? []) as Profile[]).map((p) => [p.id, p])
        );

        const buildGroup = (list: typeof rows): StoryGroup | null => {
          if (!list.length) return null;
          const stories = list.map((s) => ({
            id: s.id as string,
            user_id: s.user_id as string,
            media_url: s.media_url as string,
            media_type: s.media_type as "image" | "video",
            caption: (s.caption as string) || null,
            created_at: s.created_at as string,
            expires_at: s.expires_at as string,
            user: profile as Profile,
            viewed: viewedSet.has(s.id as string),
            like_count: likeCounts.get(s.id as string) ?? 0,
            comment_count: commentCounts.get(s.id as string) ?? 0,
            liked_by_me: likedByMe.has(s.id as string),
            reposted_from_story_id:
              (s.reposted_from_story_id as string) || null,
            reposted_from_user_id:
              (s.reposted_from_user_id as string) || null,
            reposted_from_user:
              repostedProfileMap.get(s.reposted_from_user_id as string) ??
              null,
          }));
          return {
            user: profile as Profile,
            stories,
            allViewed: stories.every((s) => s.viewed),
          };
        };

        const now = Date.now();
        const activeRows = rows.filter(
          (r) => new Date(r.expires_at as string).getTime() > now
        );
        const archivedRows = rows.filter(
          (r) => new Date(r.expires_at as string).getTime() <= now
        );

        return {
          active: buildGroup(activeRows),
          archived: buildGroup(archivedRows),
        };
      } catch (err) {
        logSupabaseError("getUserStories exception", err);
        return { active: null, archived: null };
      }
    },
    [userId]
  );

  // ============================================================
  // Initialize
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      if (isLogin) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (cancelled) return;

        if (authError || !data.user) {
          clearUserData();
          router.replace("/login");
          return;
        }

        const user = data.user;
        const uid = user.id;

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, display_name, email, username, avatar_url")
          .eq("id", uid)
          .maybeSingle();

        if (cancelled) return;
        if (profileError) {
          throw new Error(
            `Loading your profile failed: ${profileError.message}`
          );
        }

        setUserId(uid);
        setMyProfile(
          (profile as Profile | null) ?? {
            id: uid,
            display_name: user.user_metadata?.display_name ?? "Payam User",
            email: user.email ?? null,
            username: "user",
            avatar_url: null,
          }
        );

        await loadContacts(uid);
        if (cancelled) return;
        await loadConversations(uid);
      } catch (err) {
        if (cancelled) return;
        const message = getErrorMessage(err);
        if (
          /auth session missing|not authenticated|invalid jwt|refresh token/i.test(
            message
          )
        ) {
          clearUserData();
          router.replace("/login");
          return;
        }
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initialize();
    return () => {
      cancelled = true;
    };
  }, [isLogin, router, clearUserData, loadContacts, loadConversations]);

  useEffect(() => {
    if (userId) {
      void loadStories();
    }
  }, [userId, loadStories]);

  // sign-out listener
  useEffect(() => {
    if (isLogin) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        clearUserData();
        router.replace("/login");
      }
    });
    return () => subscription.unsubscribe();
  }, [isLogin, router, clearUserData]);

  // ============================================================
  // fetch messages
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    async function fetchMessages() {
      if (!userId || !activeConversation) {
        setMessages([]);
        setLoadingMessages(false);
        return;
      }

      setLoadingMessages(true);

      try {
        const { data: rows, error: messagesError } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", activeConversation.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: true });

        if (messagesError) {
          throw new Error(`Loading messages failed: ${messagesError.message}`);
        }

        const { data: myDeletions } = await supabase
          .from("message_deletions")
          .select("message_id")
          .eq("user_id", userId);

        const deletedIds = new Set(
          (myDeletions ?? []).map((d) => d.message_id as string)
        );

        if (!cancelled) {
          const filtered = ((rows ?? []) as Message[]).filter(
            (m) => !deletedIds.has(m.id)
          );
          setMessages(filtered);
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    }

    void fetchMessages();
    return () => {
      cancelled = true;
    };
  }, [userId, activeConversation]);

  // ============================================================
  // markAsRead
  // ============================================================
  const markAsRead = useCallback(
    async (conversationId: string) => {
      if (!userId) return;
      setUnreadCounts((prev) => {
        if (!(conversationId in prev)) return prev;
        const next = { ...prev };
        delete next[conversationId];
        return next;
      });

      const { error: updateError } = await supabase
        .from("conversation_members")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", userId);

      if (updateError) logSupabaseError("markAsRead", updateError);
    },
    [userId]
  );

  // ============================================================
  // openConversation
  // ============================================================
  const openConversation = useCallback(
    async (contact: Profile): Promise<void> => {
      if (!userId) {
        setError("Please log in to start a conversation.");
        router.replace("/login");
        return;
      }
      if (contact.id === userId) return;

      setError("");

      try {
        const { data: myMemberships, error: myMembershipError } =
          await supabase
            .from("conversation_members")
            .select("conversation_id")
            .eq("user_id", userId);

        if (myMembershipError) throw myMembershipError;

        const myIds = (myMemberships ?? []).map(
          (row) => row.conversation_id as string
        );

        if (myIds.length > 0) {
          const { data: shared, error: sharedError } = await supabase
            .from("conversation_members")
            .select("conversation_id")
            .eq("user_id", contact.id)
            .in("conversation_id", myIds)
            .limit(1)
            .maybeSingle();

          if (sharedError) throw sharedError;

          if (shared) {
            const { data: existing, error: existingError } = await supabase
              .from("conversations")
              .select("*")
              .eq("id", shared.conversation_id)
              .maybeSingle();

            if (existingError) throw existingError;

            if (existing) {
              await supabase
                .from("conversation_hides")
                .delete()
                .eq("conversation_id", shared.conversation_id)
                .eq("user_id", userId);

              const selected = {
                ...existing,
                otherUser: contact,
              } as unknown as Conversation;
              setActiveConversation(selected);
              setMessages([]);
              void markAsRead(selected.id);
              void loadConversations(userId);
              return;
            }
          }
        }

        const { data: newConversationId, error: rpcError } = await supabase
          .rpc("create_conversation_with", { contact_id: contact.id });

        if (rpcError) throw rpcError;
        if (!newConversationId) {
          throw new Error("Creating conversation failed: no id returned.");
        }

        const { data: created, error: fetchError } = await supabase
          .from("conversations")
          .select("*")
          .eq("id", newConversationId)
          .single();

        if (fetchError) throw fetchError;

        const selected = {
          ...created,
          otherUser: contact,
        } as unknown as Conversation;

        setMessages([]);
        setActiveConversation(selected);
        await loadConversations(userId);
        setActiveConversation(selected);
        void markAsRead(selected.id);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    },
    [userId, router, loadConversations, markAsRead]
  );

  // ============================================================
  // sendMessage
  // ============================================================
  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      const text = content.trim();
      if (!text || !userId || !activeConversation || sending) return false;

      setSending(true);
      setError("");

      try {
        const { data, error: insertError } = await supabase
          .from("messages")
          .insert({
            conversation_id: activeConversation.id,
            sender_id: userId,
            content: text,
          })
          .select("*")
          .single();

        if (insertError) throw insertError;

        const newMessage = data as Message;
        setMessages((current) => {
          if (current.some((m) => m.id === newMessage.id)) return current;
          return [...current, newMessage].sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );
        });

        setConversations((prev) =>
          sortByRecency(
            prev.map((c) =>
              c.id === activeConversation.id
                ? {
                    ...c,
                    lastMessageAt: newMessage.created_at,
                    lastMessage: newMessage.content,
                    lastMessageSenderId: newMessage.sender_id,
                  }
                : c
            )
          )
        );

        return true;
      } catch (err) {
        setError(getErrorMessage(err));
        return false;
      } finally {
        setSending(false);
      }
    },
    [userId, activeConversation, sending]
  );

  // ============================================================
  // deleteMessageForMe / Everyone
  // ============================================================
  const deleteMessageForMe = useCallback(
    async (messageId: string): Promise<boolean> => {
      if (!userId) return false;
      try {
        const { error: insErr } = await supabase
          .from("message_deletions")
          .insert({ message_id: messageId, user_id: userId });

        if (insErr) throw insErr;

        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        if (userId) void loadConversations(userId);
        return true;
      } catch (err) {
        setError(getErrorMessage(err));
        return false;
      }
    },
    [userId, loadConversations]
  );

  const deleteMessageForEveryone = useCallback(
    async (messageId: string): Promise<boolean> => {
      if (!userId) return false;
      try {
        const { error: updErr } = await supabase
          .from("messages")
          .update({
            deleted_at: new Date().toISOString(),
            deleted_by: userId,
          })
          .eq("id", messageId)
          .eq("sender_id", userId);

        if (updErr) throw updErr;

        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        if (userId) void loadConversations(userId);
        return true;
      } catch (err) {
        setError(getErrorMessage(err));
        return false;
      }
    },
    [userId, loadConversations]
  );

  // ============================================================
  // deleteConversation
  // ============================================================
  const deleteConversation = useCallback(
    async (conversationId: string): Promise<boolean> => {
      if (!userId) return false;

      try {
        await supabase
          .from("conversation_hides")
          .delete()
          .eq("conversation_id", conversationId)
          .eq("user_id", userId);

        const { error: insErr } = await supabase
          .from("conversation_hides")
          .insert({ conversation_id: conversationId, user_id: userId });

        if (insErr) throw insErr;

        setConversations((prev) =>
          prev.filter((c) => c.id !== conversationId)
        );
        setActiveConversation((cur) =>
          cur?.id === conversationId ? null : cur
        );
        setMessages([]);
        setUnreadCounts((prev) => {
          const next = { ...prev };
          delete next[conversationId];
          return next;
        });

        return true;
      } catch (err) {
        setError(getErrorMessage(err));
        return false;
      }
    },
    [userId]
  );

  // ============================================================
  // createStory
  // ============================================================
  const createStory = useCallback(
    async (file: File, caption?: string): Promise<CreateStoryResult> => {
      if (!userId) return { ok: false, error: "Not logged in" };

      if (
        !file.type.startsWith("image/") &&
        !file.type.startsWith("video/")
      ) {
        return { ok: false, error: "Please select an image or video." };
      }
      if (file.size > 20 * 1024 * 1024) {
        return { ok: false, error: "File must be smaller than 20 MB." };
      }

      try {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const safeExt = /^[a-z0-9]{1,8}$/.test(ext) ? ext : "jpg";
        const fileName = `${userId}/story-${Date.now()}.${safeExt}`;

        const { error: upErr } = await supabase.storage
          .from("stories")
          .upload(fileName, file, {
            cacheControl: "3600",
            contentType: file.type,
          });

        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage
          .from("stories")
          .getPublicUrl(fileName);

        const mediaType = file.type.startsWith("video/") ? "video" : "image";

        const { error: insErr } = await supabase.from("stories").insert({
          user_id: userId,
          media_url: urlData.publicUrl,
          media_type: mediaType,
          caption: caption?.trim() || null,
        });

        if (insErr) throw insErr;

        await loadStories();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: getErrorMessage(err) };
      }
    },
    [userId, loadStories]
  );

  // ============================================================
  // viewStory
  // ============================================================
  const viewStory = useCallback(
    async (storyId: string) => {
      if (!userId) return;
      try {
        const { error: insErr } = await supabase
          .from("story_views")
          .insert({ story_id: storyId, viewer_id: userId });

        if (insErr && insErr.code !== "23505") {
          logSupabaseError("viewStory", insErr);
          return;
        }

        setStories((prev) =>
          prev.map((g) => {
            const updated = g.stories.map((s) =>
              s.id === storyId ? { ...s, viewed: true } : s
            );
            return {
              ...g,
              stories: updated,
              allViewed: updated.every((s) => s.viewed),
            };
          })
        );
      } catch (err) {
        logSupabaseError("viewStory exception", err);
      }
    },
    [userId]
  );

  // ============================================================
  // deleteStory
  // ============================================================
  const deleteStory = useCallback(
    async (storyId: string) => {
      if (!userId) return false;
      try {
        const { data: row } = await supabase
          .from("stories")
          .select("media_url")
          .eq("id", storyId)
          .maybeSingle();

        const { error: delErr } = await supabase
          .from("stories")
          .delete()
          .eq("id", storyId)
          .eq("user_id", userId);

        if (delErr) throw delErr;

        if (row?.media_url) {
          const path = (row.media_url as string).split("/stories/")[1];
          if (path) {
            await supabase.storage.from("stories").remove([path]);
          }
        }

        await loadStories();
        return true;
      } catch (err) {
        logSupabaseError("deleteStory", err);
        return false;
      }
    },
    [userId, loadStories]
  );

  // ============================================================
  // toggleStoryLike
  // ============================================================
  const toggleStoryLike = useCallback(
    async (storyId: string): Promise<boolean> => {
      if (!userId) return false;
      try {
        const { data: existing, error: checkErr } = await supabase
          .from("story_likes")
          .select("story_id")
          .eq("story_id", storyId)
          .eq("user_id", userId)
          .maybeSingle();

        if (checkErr) {
          logSupabaseError("toggleStoryLike CHECK", checkErr);
          return false;
        }

        if (existing) {
          const { error: delErr } = await supabase
            .from("story_likes")
            .delete()
            .eq("story_id", storyId)
            .eq("user_id", userId);

          if (delErr) {
            logSupabaseError("toggleStoryLike DELETE", delErr);
            return false;
          }
        } else {
          const { error: insErr } = await supabase
            .from("story_likes")
            .insert({ story_id: storyId, user_id: userId });

          if (insErr) {
            if (insErr.code === "23505") {
              console.warn("Like already exists (race), ignoring");
            } else {
              logSupabaseError("toggleStoryLike INSERT", insErr);
              return false;
            }
          }
        }

        setStories((prev) =>
          prev.map((g) => ({
            ...g,
            stories: g.stories.map((s) =>
              s.id === storyId
                ? {
                    ...s,
                    liked_by_me: !s.liked_by_me,
                    like_count: Math.max(
                      0,
                      (s.like_count ?? 0) + (s.liked_by_me ? -1 : 1)
                    ),
                  }
                : s
            ),
          }))
        );

        return true;
      } catch (err) {
        logSupabaseError("toggleStoryLike EXCEPTION", err);
        return false;
      }
    },
    [userId]
  );

  // ============================================================
  // getStoryLikes
  // ============================================================
  const getStoryLikes = useCallback(
    async (storyId: string): Promise<Profile[]> => {
      try {
        const { data: rows, error: err } = await supabase
          .from("story_likes")
          .select("user_id")
          .eq("story_id", storyId);

        if (err) {
          logSupabaseError("getStoryLikes", err);
          return [];
        }

        const userIds = [
          ...new Set((rows ?? []).map((r) => r.user_id as string)),
        ];
        if (userIds.length === 0) return [];

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, email, username, avatar_url")
          .in("id", userIds);

        return (profiles ?? []) as Profile[];
      } catch (err) {
        logSupabaseError("getStoryLikes exception", err);
        return [];
      }
    },
    []
  );

  // ============================================================
  // getStoryComments (با reply_to)
  // ============================================================
  const getStoryComments = useCallback(
    async (storyId: string): Promise<StoryComment[]> => {
      try {
        const { data: rows, error: err } = await supabase
          .from("story_comments")
          .select("*")
          .eq("story_id", storyId)
          .order("created_at", { ascending: true });

        if (err) {
          logSupabaseError("getStoryComments", err);
          return [];
        }

        const userIds = new Set<string>();
        const replyIds = new Set<string>();

        for (const r of rows ?? []) {
          userIds.add(r.user_id as string);
          if (r.reply_to_id) replyIds.add(r.reply_to_id as string);
        }

        const { data: profiles } = userIds.size
          ? await supabase
              .from("profiles")
              .select("id, display_name, email, username, avatar_url")
              .in("id", [...userIds])
          : { data: [] };

        const profileMap = new Map(
          ((profiles ?? []) as Profile[]).map((p) => [p.id, p])
        );

        const replyMap = new Map<
          string,
          {
            id: string;
            content: string;
            user_id: string;
            user?: Profile | null;
          }
        >();

        if (replyIds.size) {
          const { data: parents } = await supabase
            .from("story_comments")
            .select("id, content, user_id")
            .in("id", [...replyIds]);

          const parentUserIds = [
            ...new Set((parents ?? []).map((p) => p.user_id as string)),
          ].filter((id) => !profileMap.has(id));

          if (parentUserIds.length) {
            const { data: moreProfiles } = await supabase
              .from("profiles")
              .select("id, display_name, email, username, avatar_url")
              .in("id", parentUserIds);

            for (const p of (moreProfiles ?? []) as Profile[]) {
              profileMap.set(p.id, p);
            }
          }

          for (const p of parents ?? []) {
            replyMap.set(p.id as string, {
              id: p.id as string,
              content: p.content as string,
              user_id: p.user_id as string,
              user: profileMap.get(p.user_id as string) ?? null,
            });
          }
        }

        return (rows ?? []).map((r) => ({
          id: r.id as string,
          story_id: r.story_id as string,
          user_id: r.user_id as string,
          content: r.content as string,
          created_at: r.created_at as string,
          user: profileMap.get(r.user_id as string) ?? null,
          reply_to_id: (r.reply_to_id as string) || null,
          reply_to: r.reply_to_id
            ? replyMap.get(r.reply_to_id as string) ?? null
            : null,
        }));
      } catch (err) {
        logSupabaseError("getStoryComments exception", err);
        return [];
      }
    },
    []
  );

  // ============================================================
  // addStoryComment (با replyToId)
  // ============================================================
  const addStoryComment = useCallback(
    async (
      storyId: string,
      content: string,
      replyToId?: string
    ): Promise<SimpleResult> => {
      if (!userId) return { ok: false, error: "Not logged in" };
      const text = content.trim();
      if (!text) return { ok: false, error: "Comment is empty" };
      if (text.length > 500) return { ok: false, error: "Comment too long" };

      try {
        const { error: insErr } = await supabase
          .from("story_comments")
          .insert({
            story_id: storyId,
            user_id: userId,
            content: text,
            reply_to_id: replyToId || null,
          });

        if (insErr) {
          logSupabaseError("addStoryComment", insErr);
          return { ok: false, error: insErr.message };
        }

        setStories((prev) =>
          prev.map((g) => ({
            ...g,
            stories: g.stories.map((s) =>
              s.id === storyId
                ? { ...s, comment_count: (s.comment_count ?? 0) + 1 }
                : s
            ),
          }))
        );

        return { ok: true };
      } catch (err) {
        logSupabaseError("addStoryComment exception", err);
        return { ok: false, error: getErrorMessage(err) };
      }
    },
    [userId]
  );

  // ============================================================
  // deleteStoryComment
  // ============================================================
  const deleteStoryComment = useCallback(
    async (commentId: string): Promise<boolean> => {
      if (!userId) return false;
      try {
        const { data: row } = await supabase
          .from("story_comments")
          .select("story_id")
          .eq("id", commentId)
          .maybeSingle();

        const { error: delErr } = await supabase
          .from("story_comments")
          .delete()
          .eq("id", commentId)
          .eq("user_id", userId);

        if (delErr) {
          logSupabaseError("deleteStoryComment", delErr);
          return false;
        }

        if (row?.story_id) {
          const storyId = row.story_id as string;
          setStories((prev) =>
            prev.map((g) => ({
              ...g,
              stories: g.stories.map((s) =>
                s.id === storyId
                  ? {
                      ...s,
                      comment_count: Math.max(0, (s.comment_count ?? 0) - 1),
                    }
                  : s
              ),
            }))
          );
        }

        return true;
      } catch (err) {
        logSupabaseError("deleteStoryComment exception", err);
        return false;
      }
    },
    [userId]
  );

  // ============================================================
  // repostStory
  // ============================================================
  const repostStory = useCallback(
    async (storyId: string): Promise<SimpleResult> => {
      if (!userId) return { ok: false, error: "Not logged in" };

      try {
        const { data: original, error: fetchErr } = await supabase
          .from("stories")
          .select("*")
          .eq("id", storyId)
          .single();

        if (fetchErr) {
          logSupabaseError("repostStory fetch", fetchErr);
          return { ok: false, error: fetchErr.message };
        }
        if (!original) throw new Error("Story not found");

        if (original.user_id === userId) {
          return { ok: false, error: "You can't repost your own story" };
        }

        const { error: insErr } = await supabase.from("stories").insert({
          user_id: userId,
          media_url: original.media_url,
          media_type: original.media_type,
          caption: original.caption,
          reposted_from_story_id: storyId,
          reposted_from_user_id: original.user_id,
        });

        if (insErr) {
          logSupabaseError("repostStory insert", insErr);
          return { ok: false, error: insErr.message };
        }

        await loadStories();
        return { ok: true };
      } catch (err) {
        logSupabaseError("repostStory exception", err);
        return { ok: false, error: getErrorMessage(err) };
      }
    },
    [userId, loadStories]
  );

  // ============================================================
  // Realtime: active conversation
  // ============================================================
  useEffect(() => {
    if (!userId || !activeConversation) return;
    const conversationId = activeConversation.id;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as Message & {
              deleted_at?: string | null;
            };
            if (updated.deleted_at) {
              setMessages((cur) => cur.filter((m) => m.id !== updated.id));
              void loadConversations(userId);
              return;
            }
            setMessages((cur) =>
              cur.map((m) => (m.id === updated.id ? (updated as Message) : m))
            );
            return;
          }

          if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id?: string }).id;
            if (deletedId) {
              setMessages((cur) => cur.filter((m) => m.id !== deletedId));
              void loadConversations(userId);
            }
            return;
          }

          const newMessage = payload.new as Message;
          setMessages((cur) => {
            if (cur.some((m) => m.id === newMessage.id)) return cur;
            return [...cur, newMessage].sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            );
          });

          setConversations((prev) =>
            sortByRecency(
              prev.map((c) =>
                c.id === conversationId
                  ? {
                      ...c,
                      lastMessageAt: newMessage.created_at,
                      lastMessage: newMessage.content,
                      lastMessageSenderId: newMessage.sender_id,
                    }
                  : c
              )
            )
          );

          if (newMessage.sender_id !== userId) {
            void markAsRead(conversationId);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, activeConversation, markAsRead, loadConversations]);

  // ============================================================
  // Realtime: membership
  // ============================================================
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`membership-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_members",
          filter: `user_id=eq.${userId}`,
        },
        () => void loadConversations(userId)
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, loadConversations]);

  // ============================================================
  // Realtime: all messages (sidebar)
  // ============================================================
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`all-messages-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as Message & {
              deleted_at?: string | null;
            };
            if (updated.deleted_at) void loadConversations(userId);
            return;
          }

          if (payload.eventType === "DELETE") {
            void loadConversations(userId);
            return;
          }

          const newMessage = payload.new as Message;
          if (newMessage.sender_id === userId) return;

          const isActive =
            activeIdRef.current === newMessage.conversation_id;

          if (!isActive) {
            setUnreadCounts((prev) => ({
              ...prev,
              [newMessage.conversation_id]:
                (prev[newMessage.conversation_id] ?? 0) + 1,
            }));
          }

          const known = conversationsRef.current.some(
            (c) => c.id === newMessage.conversation_id
          );

          if (known) {
            setConversations((prev) =>
              sortByRecency(
                prev.map((c) =>
                  c.id === newMessage.conversation_id
                    ? {
                        ...c,
                        lastMessageAt: newMessage.created_at,
                        lastMessage: newMessage.content,
                        lastMessageSenderId: newMessage.sender_id,
                      }
                    : c
                )
              )
            );
          } else {
            void supabase
              .from("conversation_hides")
              .delete()
              .eq("conversation_id", newMessage.conversation_id)
              .eq("user_id", userId)
              .then(() => {
                void loadConversations(userId);
              });
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, loadConversations]);

  // ============================================================
  // updateUsername
  // ============================================================
  const updateUsername = useCallback(
    async (raw: string): Promise<UpdateUsernameResult> => {
      if (!userId) return { ok: false, error: "Not logged in" };

      const username = raw.trim().toLowerCase();

      if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        return {
          ok: false,
          error:
            "Username must be 3–20 characters: lowercase letters, numbers, or underscore.",
        };
      }

      const { data: existing, error: checkErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .neq("id", userId)
        .maybeSingle();

      if (checkErr) return { ok: false, error: checkErr.message };
      if (existing)
        return { ok: false, error: "That username is already taken." };

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ username })
        .eq("id", userId);

      if (updateErr) {
        if (
          updateErr.message.includes("profiles_username_unique") ||
          updateErr.message.includes("duplicate key")
        ) {
          return { ok: false, error: "That username is already taken." };
        }
        if (updateErr.message.includes("profiles_username_format")) {
          return {
            ok: false,
            error:
              "Invalid format. Use 3–20 lowercase letters, numbers, or _.",
          };
        }
        return { ok: false, error: updateErr.message };
      }

      setMyProfile((prev) => (prev ? { ...prev, username } : prev));
      setContacts((prev) =>
        prev.map((c) => (c.id === userId ? { ...c, username } : c))
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.otherUser?.id === userId
            ? { ...c, otherUser: { ...c.otherUser, username } }
            : c
        )
      );

      return { ok: true };
    },
    [userId]
  );

  // ============================================================
  // updateAvatar
  // ============================================================
  const updateAvatar = useCallback(
    async (file: File): Promise<UpdateAvatarResult> => {
      if (!userId) return { ok: false, error: "Not logged in" };

      if (!file.type.startsWith("image/")) {
        return { ok: false, error: "Please select an image file." };
      }
      if (file.size > 5 * 1024 * 1024) {
        return { ok: false, error: "Image must be smaller than 5 MB." };
      }

      try {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
          ? ext
          : "jpg";
        const fileName = `${userId}/avatar-${Date.now()}.${safeExt}`;

        if (myProfile?.avatar_url) {
          const oldPath = myProfile.avatar_url.split("/avatars/")[1];
          if (oldPath) {
            await supabase.storage.from("avatars").remove([oldPath]);
          }
        }

        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: true,
            contentType: file.type,
          });

        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;

        const { error: updErr } = await supabase
          .from("profiles")
          .update({ avatar_url: publicUrl })
          .eq("id", userId);

        if (updErr) throw updErr;

        setMyProfile((prev) =>
          prev ? { ...prev, avatar_url: publicUrl } : prev
        );
        setContacts((prev) =>
          prev.map((c) =>
            c.id === userId ? { ...c, avatar_url: publicUrl } : c
          )
        );
        setConversations((prev) =>
          prev.map((c) =>
            c.otherUser?.id === userId
              ? { ...c, otherUser: { ...c.otherUser, avatar_url: publicUrl } }
              : c
          )
        );

        return { ok: true, url: publicUrl };
      } catch (err) {
        return { ok: false, error: getErrorMessage(err) };
      }
    },
    [userId, myProfile?.avatar_url]
  );

  // ============================================================
  // signOut
  // ============================================================
  const signOut = useCallback(async () => {
    setError("");
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(`Signing out failed: ${signOutError.message}`);
      return;
    }
    clearUserData();
    router.replace("/login");
    router.refresh();
  }, [router, clearUserData]);

  // ============================================================
  // value
  // ============================================================
  const value: ChatContextType = {
    userId,
    myProfile,
    contacts,
    conversations,
    activeConversation,
    messages,
    unreadCounts,
    stories,
    loadingStories,
    loading,
    loadingMessages,
    sending,
    error,
    setError,
    setActiveConversation,
    loadContacts,
    loadConversations,
    loadStories,
    openConversation,
    sendMessage,
    clearActive,
    markAsRead,
    updateUsername,
    updateAvatar,
    deleteMessageForMe,
    deleteMessageForEveryone,
    deleteConversation,
    createStory,
    viewStory,
    deleteStory,
    toggleStoryLike,
    getStoryLikes,
    getStoryComments,
    addStoryComment,
    deleteStoryComment,
    repostStory,
    signOut,
    // ─── Global story viewer + user info panel ───
    viewingStoryGroup,
    viewingStoryIsActive,
    viewingStoryIndex,
    viewingStoryVersion,
    openStory,
    openStoryGroup,
    closeStory,
    getUserStories,
  };

  return (
    <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used inside a ChatProvider");
  }
  return context;
}