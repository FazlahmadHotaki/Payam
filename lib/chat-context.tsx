// lib/chat-context.tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  displayName,
  getErrorMessage,
  type Conversation,
  type Message,
  type Profile,
} from "@/lib/chat";

type Ctx = {
  userId: string;
  myProfile: Profile | null;
  contacts: Profile[];
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  loadingMessages: boolean;
  sending: boolean;
  error: string;
  setError: (v: string) => void;
  openConversation: (c: Profile) => Promise<void>;
  selectConversation: (c: Conversation) => void;
  clearActive: () => void;
  sendMessage: (content: string) => Promise<boolean>;
  deleteConversation: (conversationId: string) => Promise<void>;
  hideContact: (contact: Profile) => Promise<void>;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const ChatCtx = createContext<Ctx | null>(null);

function sortByRecent(list: Conversation[]): Conversation[] {
  return [...list].sort((a, b) =>
    (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")
  );
}

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
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bumpConversation = useCallback(
    (conversationId: string, when: string) => {
      setConversations((cur) =>
        sortByRecent(
          cur.map((c) =>
            c.id === conversationId ? { ...c, updatedAt: when } : c
          )
        )
      );
    },
    []
  );

  const loadContacts = useCallback(async (uid: string) => {
    const { data: hidden } = await supabase
      .from("contact_hides")
      .select("hidden_user_id")
      .eq("owner_id", uid);

    const hiddenIds = new Set(
      (hidden ?? []).map((h: { hidden_user_id: string }) => h.hidden_user_id)
    );

    // FETCHING USERNAME HERE
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, email, username")
      .neq("id", uid)
      .order("display_name", { ascending: true });

    if (error) throw new Error(`Loading contacts failed: ${error.message}`);

    setContacts(
      ((data ?? []) as Profile[]).filter((p) => !hiddenIds.has(p.id))
    );
  }, []);

  const loadConversations = useCallback(async (uid: string) => {
    const { data: memberships, error: mErr } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", uid)
      .is("deleted_at", null);

    if (mErr) throw new Error(`Loading memberships failed: ${mErr.message}`);

    const ids = [
      ...new Set((memberships ?? []).map((m) => m.conversation_id)),
    ];
    if (!ids.length) return setConversations([]);

    const { data: members, error: memErr } = await supabase
      .from("conversation_members")
      .select("conversation_id, user_id")
      .in("conversation_id", ids);

    if (memErr)
      throw new Error(`Loading participants failed: ${memErr.message}`);

    const otherIds = [
      ...new Set(
        (members ?? [])
          .filter((m) => m.user_id !== uid)
          .map((m) => m.user_id)
      ),
    ];
    if (!otherIds.length) return setConversations([]);

    // FETCHING USERNAME HERE
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, display_name, email, username")
      .in("id", otherIds);

    if (pErr) throw new Error(`Loading profiles failed: ${pErr.message}`);

    const { data: convRows } = await supabase
      .from("conversations")
      .select("id, updated_at")
      .in("id", ids);

    const updatedMap = new Map<string, string>(
      (convRows ?? []).map((c: { id: string; updated_at: string }) => [
        c.id,
        c.updated_at,
      ])
    );

    const map = new Map(
      ((profiles ?? []) as Profile[]).map((p) => [p.id, p])
    );

    const loaded: Conversation[] = [];
    for (const id of ids) {
      const other = (members ?? []).find(
        (m) => m.conversation_id === id && m.user_id !== uid
      );
      const otherUser = other ? map.get(other.user_id) : undefined;
      if (otherUser) {
        loaded.push({
          id,
          otherUser,
          updatedAt: updatedMap.get(id) ?? "",
        });
      }
    }

    setConversations(sortByRecent(loaded));
  }, []);

  useEffect(() => {
    if (isLogin) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data, error: authErr } = await supabase.auth.getUser();
        if (authErr)
          throw new Error(`Authentication failed: ${authErr.message}`);
        if (!data.user) {
          router.replace("/login");
          return;
        }

        const uid = data.user.id;

        // FETCHING USERNAME HERE
        const { data: profile, error: pErr } = await supabase
          .from("profiles")
          .select("id, display_name, email, username")
          .eq("id", uid)
          .maybeSingle();

        if (pErr)
          throw new Error(`Loading your profile failed: ${pErr.message}`);
        if (cancelled) return;

        setUserId(uid);
        setMyProfile(
          (profile as Profile | null) ?? {
            id: uid,
            display_name:
              data.user.user_metadata?.display_name ?? "Payam User",
            email: data.user.email ?? null,
            username: "user",
          }
        );

        await loadContacts(uid);
        if (cancelled) return;
        await loadConversations(uid);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLogin, router, loadContacts, loadConversations]);

  const openConversation = useCallback(
    async (contact: Profile) => {
      setError("");
      try {
        const { data, error } = await supabase.rpc(
          "create_direct_conversation",
          { other_user_id: contact.id }
        );
        if (error)
          throw new Error(`Opening conversation failed: ${error.message}`);
        if (!data) throw new Error("No conversation ID returned.");

        const conversationId = String(data);

        await supabase
          .from("conversation_members")
          .update({ deleted_at: null })
          .eq("conversation_id", conversationId)
          .eq("user_id", userId);

        setMessages([]);
        setActiveConversation({ id: conversationId, otherUser: contact });
        await loadConversations(userId);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    },
    [userId, loadConversations]
  );

  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    const cid = activeConversation.id;

    (async () => {
      setLoadingMessages(true);
      setError("");
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("id, conversation_id, sender_id, content, created_at")
          .eq("conversation_id", cid)
          .order("created_at", { ascending: true })
          .limit(200);
        if (error)
          throw new Error(`Loading messages failed: ${error.message}`);
        if (!cancelled) setMessages((data ?? []) as Message[]);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    })();

    const channel = supabase
      .channel(`messages-${cid}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${cid}`,
        },
        (payload) => {
          const inc = payload.new as Message;
          setMessages((cur) =>
            cur.some((m) => m.id === inc.id) ? cur : [...cur, inc]
          );
          bumpConversation(cid, inc.created_at);
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          setError(
            "Live updates could not connect. Check that messages is enabled in Supabase Realtime."
          );
        }
      });

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [activeConversation, bumpConversation]);

  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      const trimmed = content.trim();
      if (!trimmed || !activeConversation || !userId || sending) return false;
      setSending(true);
      setError("");
      try {
        const { data, error } = await supabase
          .from("messages")
          .insert({
            conversation_id: activeConversation.id,
            sender_id: userId,
            content: trimmed,
          })
          .select("id, conversation_id, sender_id, content, created_at")
          .single();
        if (error) throw new Error(`Sending message failed: ${error.message}`);
        setMessages((cur) =>
          cur.some((m) => m.id === data.id) ? cur : [...cur, data as Message]
        );
        bumpConversation(activeConversation.id, data.created_at);
        return true;
      } catch (err) {
        setError(getErrorMessage(err));
        return false;
      } finally {
        setSending(false);
      }
    },
    [activeConversation, userId, sending, bumpConversation]
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      setError("");
      try {
        const { error } = await supabase
          .from("conversation_members")
          .update({ deleted_at: new Date().toISOString() })
          .eq("conversation_id", conversationId)
          .eq("user_id", userId);

        if (error) throw new Error(`Deleting chat failed: ${error.message}`);

        setActiveConversation((cur) =>
          cur?.id === conversationId ? null : cur
        );
        await loadConversations(userId);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    },
    [userId, loadConversations]
  );

  const hideContact = useCallback(
    async (contact: Profile) => {
      setError("");
      try {
        const { error: hideErr } = await supabase
          .from("contact_hides")
          .upsert(
            { owner_id: userId, hidden_user_id: contact.id },
            { onConflict: "owner_id,hidden_user_id" }
          );

        if (hideErr)
          throw new Error(`Hiding contact failed: ${hideErr.message}`);

        const convIds = conversations
          .filter((c) => c.otherUser.id === contact.id)
          .map((c) => c.id);

        if (convIds.length) {
          await supabase
            .from("conversation_members")
            .update({ deleted_at: new Date().toISOString() })
            .in("conversation_id", convIds)
            .eq("user_id", userId);
        }

        setContacts((cur) => cur.filter((c) => c.id !== contact.id));
        setConversations((cur) =>
          cur.filter((c) => c.otherUser.id !== contact.id)
        );
        setActiveConversation((cur) =>
          cur?.otherUser.id === contact.id ? null : cur
        );
      } catch (err) {
        setError(getErrorMessage(err));
      }
    },
    [userId, conversations]
  );

  const refresh = useCallback(async () => {
    setError("");
    try {
      await loadContacts(userId);
      await loadConversations(userId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [userId, loadContacts, loadConversations]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return setError(`Sign out failed: ${error.message}`);
    router.replace("/login");
    router.refresh();
  }, [router]);

  const value: Ctx = {
    userId,
    myProfile,
    contacts,
    conversations,
    activeConversation,
    messages,
    loading,
    loadingMessages,
    sending,
    error,
    setError,
    openConversation,
    selectConversation: (c) => setActiveConversation(c),
    clearActive: () => setActiveConversation(null),
    sendMessage,
    deleteConversation,
    hideContact,
    refresh,
    signOut,
  };

  return <ChatCtx.Provider value={value}>{children}</ChatCtx.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
  return ctx;
}