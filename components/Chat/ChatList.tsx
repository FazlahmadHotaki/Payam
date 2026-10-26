"use client";

import { LogOut, RefreshCw, Users } from "lucide-react";
import ChatItem from "@/components/Chat/ChatItem";
import {
  displayName,
  type Conversation,
  type Profile,
} from "@/lib/chat";

type Props = {
  myProfile: Profile | null;
  contacts: Profile[];
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onSelectContact: (contact: Profile) => void;
  onSelectConversation: (conversation: Conversation) => void;
  onRefresh: () => void;
  onSignOut: () => void;
};

export default function ChatList({
  myProfile,
  contacts,
  conversations,
  activeConversation,
  onSelectContact,
  onSelectConversation,
  onRefresh,
  onSignOut,
}: Props) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* Account */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 p-4 dark:border-slate-800">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">Signed in as</p>
          <p className="truncate font-medium">
            {myProfile ? displayName(myProfile) : "Telechat user"}
          </p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          aria-label="Sign out"
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Contacts */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Users size={16} /> Contacts
          </h2>
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {contacts.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            No other registered users yet.
          </p>
        ) : (
          contacts.map((contact) => (
            <ChatItem
              key={contact.id}
              title={displayName(contact)}
              subtitle={contact.email ?? undefined}
              active={activeConversation?.otherUser.id === contact.id}
              onClick={() => onSelectContact(contact)}
            />
          ))
        )}

        {/* Recent conversations */}
        <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Recent conversations
          </h3>
        </div>

        {conversations.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-slate-500">No conversations yet.</p>
        ) : (
          conversations.map((conversation) => (
            <ChatItem
              key={conversation.id}
              title={displayName(conversation.otherUser)}
              subtitle={conversation.otherUser.email ?? undefined}
              active={activeConversation?.id === conversation.id}
              onClick={() => onSelectConversation(conversation)}
            />
          ))
        )}
      </div>
    </div>
  );
}