"use client";

import {
  createContext,
  useContext,
  useEffect,
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

type ChatContextType = {
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
  setError: (error: string) => void;
  setActiveConversation: (conversation: Conversation | null) => void;
  loadContacts: (uid: string) => Promise<void>;
  loadConversations: (uid: string) => Promise<void>;
  openConversation: (contact: Profile) => Promise<void>;
  sendMessage: (content: string) => Promise<boolean>;
  clearActive: () => void;
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
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const clearUserData = useCallback(() => {
    setUserId("");
    setMyProfile(null);
    setContacts([]);
    setConversations([]);
    setMessages([]);
    setActiveConversation(null);
  }, []);

  const clearActive = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
    setError("");
  }, []);

  const loadContacts = useCallback(async (uid: string) => {
    const { data: hiddenRows, error: hiddenError } = await supabase
      .from("contact_hides")
      .select("hidden_user_id")
      .eq("user_id", uid);

    if (hiddenError) {
      throw new Error(`Loading hidden contacts failed: ${hiddenError.message}`);
    }

    const hiddenIds = (hiddenRows ?? []).map(
      (row) => row.hidden_user_id as string
    );

    let query = supabase
      .from("profiles")
      .select("id, display_name, email, username")
      .neq("id", uid)
      .order("display_name");

    if (hiddenIds.length > 0) {
      query = query.not("id", "in", `(${hiddenIds.join(",")})`);
    }

    const { data, error: contactsError } = await query;

    if (contactsError) {
      throw new Error(`Loading contacts failed: ${contactsError.message}`);
    }

    setContacts((data ?? []) as Profile[]);
  }, []);

  const loadConversations = useCallback(async (uid: string) => {
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
      return;
    }

    const { data: memberRows, error: membersError } = await supabase
      .from("conversation_members")
      .select("conversation_id, user_id")
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

    const profileMap = new Map(
      ((profileRows ?? []) as Profile[]).map((profile) => [
        profile.id,
        profile,
      ])
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

    const loadedConversations = (conversationRows ?? []).map(
      (conversation) => {
        const conversationId = conversation.id as string;
        const otherUserId = otherUserMap.get(conversationId);

        return {
          ...conversation,
          otherUser: otherUserId
            ? profileMap.get(otherUserId) ?? null
            : null,
        } as Conversation;
      }
    );

    setConversations(loadedConversations);

    setActiveConversation((current) => {
      if (!current) return null;

      return (
        loadedConversations.find(
          (conversation) => conversation.id === current.id
        ) ?? null
      );
    });
  }, []);

  // Check authentication and load the current user's data.
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
  }, [
    isLogin,
    router,
    clearUserData,
    loadContacts,
    loadConversations,
  ]);

  // React to sign-out events.
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

  // Load messages for the selected conversation.
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
        const { data, error: messagesError } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", activeConversation.id)
          .order("created_at", { ascending: true });

        if (messagesError) {
          throw new Error(`Loading messages failed: ${messagesError.message}`);
        }

        if (!cancelled) {
          setMessages((data ?? []) as Message[]);
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

  // Open an existing conversation, or create one with the selected contact.
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
        // 1) آیا از قبل یک گفتگوی مشترک با این مخاطب داریم؟
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
              } as Conversation;

              setActiveConversation(selected);
              setMessages([]);
              return;
            }
          }
        }

        // 2) گفتگوی جدید را به‌صورت اتمیک از طریق RPC بساز
        //    (تابع create_conversation_with در Supabase تعریف شده است)
        const { data: newConversationId, error: rpcError } = await supabase
          .rpc("create_conversation_with", { contact_id: contact.id });

        if (rpcError) throw rpcError;

        if (!newConversationId) {
          throw new Error("Creating conversation failed: no id returned.");
        }

        // 3) رکورد گفتگو را بخوان (حالا کاربر عضو است، پس SELECT جواب می‌دهد)
        const { data: created, error: fetchError } = await supabase
          .from("conversations")
          .select("*")
          .eq("id", newConversationId)
          .single();

        if (fetchError) throw fetchError;

        const selected = {
          ...created,
          otherUser: contact,
        } as Conversation;

        setMessages([]);
        setActiveConversation(selected);
        await loadConversations(userId);
        setActiveConversation(selected);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    },
    [userId, router, loadConversations]
  );

  // Send a message and return true only when insertion succeeds.
  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      const text = content.trim();

      if (!text || !userId || !activeConversation || sending) {
        return false;
      }

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
          if (current.some((message) => message.id === newMessage.id)) {
            return current;
          }

          return [...current, newMessage].sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );
        });

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

  // Subscribe to real-time updates in the active conversation.
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
          if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id?: string }).id;

            if (deletedId) {
              setMessages((current) =>
                current.filter((message) => message.id !== deletedId)
              );
            }

            return;
          }

          const newMessage = payload.new as Message;

          setMessages((current) => {
            if (current.some((message) => message.id === newMessage.id)) {
              return current.map((message) =>
                message.id === newMessage.id ? newMessage : message
              );
            }

            return [...current, newMessage].sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            );
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, activeConversation]);

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
    signOut,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChat must be used inside a ChatProvider");
  }

  return context;
}