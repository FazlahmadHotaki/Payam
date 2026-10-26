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
import type { Conversation, Message, Profile } from "@/lib/chat";

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

function sortByRecency(list: Conversation[]): Conversation[] {
  return [...list].sort((a, b) => {
    const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return tb - ta;
  });
}

type UpdateUsernameResult = { ok: boolean; error?: string };

type ChatContextType = {
  userId: string;
  myProfile: Profile | null;
  contacts: Profile[];
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  unreadCounts: Record<string, number>;
  loading: boolean;
  loadingMessages: boolean;
  sending: boolean;
  error: string;
  setError: (error: string) => void;
  setActiveConversation: (conversation: Conversation | null) => void;
  loadContacts: (uid: string) => Promise<void>;
  loadConversations: (uid: string) => Promise<void>;
  openConversation: (contact: Profile) => Promise<void>;
  sendMessage: (content: string) => Promise<boolean>;
  clearActive: () => void;
  markAsRead: (conversationId: string) => Promise<void>;
  updateUsername: (newUsername: string) => Promise<UpdateUsernameResult>;
  deleteMessageForMe: (messageId: string) => Promise<boolean>;
  deleteMessageForEveryone: (messageId: string) => Promise<boolean>;
  signOut: () => Promise<void>;
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
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

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
  }, []);

  const clearActive = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
    setError("");
  }, []);

  // ============================================================
  // unread counts
  // ============================================================
  const computeUnreadCounts = useCallback(async (uid: string) => {
    const { data: memberships, error: mErr } = await supabase
      .from("conversation_members")
      .select("conversation_id, last_read_at")
      .eq("user_id", uid);

    if (mErr) {
      console.error("computeUnreadCounts:", mErr.message);
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
      const lastRead = row.last_read_at as string;

      const { count, error: cErr } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", convId)
        .neq("sender_id", uid)
        .is("deleted_at", null)
        .gt("created_at", lastRead);

      if (cErr) {
        console.error("count unread:", cErr.message);
        continue;
      }
      counts[convId] = count ?? 0;
    }

    setUnreadCounts(counts);
  }, []);

  const loadContacts = useCallback(async (uid: string) => {
    const { data, error: contactsError } = await supabase
      .from("profiles")
      .select("id, display_name, email, username")
      .neq("id", uid)
      .order("display_name");

    if (contactsError) {
      throw new Error(`Loading contacts failed: ${contactsError.message}`);
    }
    setContacts((data ?? []) as Profile[]);
  }, []);

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

      const conversationIds = [
        ...new Set(
          (memberships ?? []).map((row) => row.conversation_id as string)
        ),
      ];

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
            .select("id, display_name, email, username")
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

      // آخرین پیام‌های غیرحذف‌شده
      const { data: latestMessages } = await supabase
        .from("messages")
        .select("id, conversation_id, content, created_at, sender_id")
        .in("conversation_id", conversationIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      // حذف‌های شخصی من
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
          .select("id, display_name, email, username")
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

  // sign-out
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

  // پیام‌های گفتگوی فعال
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

        const { data: myDeletions, error: delErr } = await supabase
          .from("message_deletions")
          .select("message_id")
          .eq("user_id", userId);

        if (delErr) {
          console.warn("Loading deletions failed:", delErr.message);
        }

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

  // markAsRead
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

      if (updateError) console.error("markAsRead:", updateError.message);
    },
    [userId]
  );

  // openConversation
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
              const selected = {
                ...existing,
                otherUser: contact,
              } as unknown as Conversation;
              setActiveConversation(selected);
              setMessages([]);
              void markAsRead(selected.id);
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

  // sendMessage
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
  // Delete: only for me
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

        // reload conversations to update sidebar preview if needed
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
  // Delete: for everyone (soft delete)
  // ============================================================
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
  // Realtime: messages in the active conversation
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
          // UPDATE
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

          // DELETE
          if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id?: string }).id;
            if (deletedId) {
              setMessages((cur) => cur.filter((m) => m.id !== deletedId));
              void loadConversations(userId);
            }
            return;
          }

          // INSERT
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

  // Realtime: membership
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

  // Realtime: all messages (sidebar)
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`all-messages-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          // UPDATE (soft-delete)
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as Message & {
              deleted_at?: string | null;
            };
            if (updated.deleted_at) {
              void loadConversations(userId);
            }
            return;
          }

          if (payload.eventType === "DELETE") {
            void loadConversations(userId);
            return;
          }

          // INSERT
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
            void loadConversations(userId);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, loadConversations]);

  // updateUsername
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

  const value: ChatContextType = {
    userId,
    myProfile,
    contacts,
    conversations,
    activeConversation,
    messages,
    unreadCounts,
    loading,
    loadingMessages,
    sending,
    error,
    setError,
    setActiveConversation,
    loadContacts,
    loadConversations,
    openConversation,
    sendMessage,
    clearActive,
    markAsRead,
    updateUsername,
    deleteMessageForMe,
    deleteMessageForEveryone,
    signOut,
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