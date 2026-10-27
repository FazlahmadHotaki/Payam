// app/settings/page.tsx
"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Check,
  ChevronRight,
  LockKeyhole,
  Palette,
  ShieldCheck,
  UserRound,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  MessageSquare,
  Monitor,
  Smartphone,
  AtSign,
  LogOut,
} from "lucide-react";
import { useChat } from "@/lib/chat-context";
import { displayName } from "@/lib/chat";
import UsernameEditor from "@/components/settings/UsernameEditor";
import AvatarUploader from "@/components/settings/AvatarUploader";

type SettingRowProps = {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
};

function SettingRow({
  icon,
  title,
  description,
  children,
}: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3.5 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? "bg-blue-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { myProfile, signOut } = useChat();

  const [messageNotifications, setMessageNotifications] = useState(true);
  const [soundNotifications, setSoundNotifications] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState(true);

  const [fontSize, setFontSize] = useState("medium");
  const [savedMessage, setSavedMessage] = useState("");

  const fontSizes = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base",
  } as const;

  function showSavedMessage(message: string) {
    setSavedMessage(message);
    window.setTimeout(() => setSavedMessage(""), 2500);
  }

  const displayNameStr = myProfile ? displayName(myProfile) : "Payam User";
  const username = myProfile?.username || "username";
  const email = myProfile?.email || "";

  return (
    <main className="min-h-full overflow-y-auto bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-2xl">
        {/* Sticky header */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-3 py-3 backdrop-blur-lg">
          <Link
            href="/"
            aria-label="Back to chats"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">Settings</h1>
            <p className="truncate text-xs text-slate-500">
              Manage your Payam account
            </p>
          </div>
        </header>

        <div className="space-y-6 px-3 pb-16 pt-4 sm:px-4">
          {savedMessage && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
            >
              <Check size={18} />
              {savedMessage}
            </div>
          )}

          {/* Profile Card */}
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center shadow-sm">
            <AvatarUploader />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-slate-900">
                {displayNameStr}
              </h2>
              <p className="mt-0.5 text-sm font-medium text-blue-500">
                @{username}
              </p>
              {email && (
                <p className="mt-1 truncate text-xs text-slate-500">
                  {email}
                </p>
              )}
            </div>
          </div>

          {/* Account */}
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
                <UserRound size={16} /> Account
              </h2>
            </div>

            <div className="border-b border-slate-100 px-4 py-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <AtSign size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Username</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Change how others find and mention you
                  </p>
                </div>
              </div>
              <UsernameEditor />
            </div>

            <Link
              href="/contacts"
              className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 transition hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <UserRound size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Contacts</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    View and manage your contacts
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </Link>

            <SettingRow
              icon={<LockKeyhole size={20} />}
              title="Account security"
              description="Keep your account safe and secure"
            >
              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                Protected
              </span>
            </SettingRow>
          </section>

          {/* Notifications */}
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
                <Bell size={16} /> Notifications
              </h2>
            </div>

            <SettingRow
              icon={<MessageSquare size={20} />}
              title="Message notifications"
              description="Receive alerts when new messages arrive"
            >
              <Toggle
                checked={messageNotifications}
                onChange={setMessageNotifications}
                label="Message notifications"
              />
            </SettingRow>

            <SettingRow
              icon={
                soundNotifications ? <Volume2 size={20} /> : <VolumeX size={20} />
              }
              title="Notification sounds"
              description="Play a sound when you receive a message"
            >
              <Toggle
                checked={soundNotifications}
                onChange={setSoundNotifications}
                label="Notification sounds"
              />
            </SettingRow>

            <SettingRow
              icon={
                desktopNotifications ? <Bell size={20} /> : <BellOff size={20} />
              }
              title="Desktop notifications"
              description="Allow notifications on your computer"
            >
              <Toggle
                checked={desktopNotifications}
                onChange={setDesktopNotifications}
                label="Desktop notifications"
              />
            </SettingRow>
          </section>

          {/* Privacy */}
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
                <ShieldCheck size={16} /> Privacy
              </h2>
            </div>

            <SettingRow
              icon={showOnlineStatus ? <Eye size={20} /> : <EyeOff size={20} />}
              title="Online status"
              description="Let contacts see when you're online"
            >
              <Toggle
                checked={showOnlineStatus}
                onChange={setShowOnlineStatus}
                label="Online status"
              />
            </SettingRow>

            <SettingRow
              icon={<Check size={20} />}
              title="Read receipts"
              description="Let contacts know when you read messages"
            >
              <Toggle
                checked={readReceipts}
                onChange={setReadReceipts}
                label="Read receipts"
              />
            </SettingRow>

            <SettingRow
              icon={<UserRound size={20} />}
              title="Profile visibility"
              description="Allow contacts to see your profile information"
            >
              <Toggle
                checked={profileVisibility}
                onChange={setProfileVisibility}
                label="Profile visibility"
              />
            </SettingRow>
          </section>

          {/* Preferences */}
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
                <Palette size={16} /> Preferences
              </h2>
            </div>

            <SettingRow
              icon={<Monitor size={20} />}
              title="Font size"
              description="Adjust the size of chat text"
            >
              <select
                value={fontSize}
                onChange={(event) => {
                  setFontSize(event.target.value);
                  showSavedMessage("Font preview updated");
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </SettingRow>

            <div className="p-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                  Message preview
                </p>
                <p
                  className={`${
                    fontSizes[fontSize as keyof typeof fontSizes]
                  } leading-6 text-slate-700`}
                >
                  Hello! Welcome to Payam. This is a preview of your message
                  text.
                </p>
              </div>
            </div>
          </section>

          {/* About */}
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
                <Smartphone size={16} /> About
              </h2>
            </div>

            <Link
              href="/about"
              className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">About Payam</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    App information and details
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </Link>
          </section>

          {/* Sign out */}
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
          >
            <LogOut size={18} />
            Sign out
          </button>

          <footer className="pb-4 pt-2 text-center">
            <p className="text-xs text-slate-400">Payam · Settings</p>
          </footer>
        </div>
      </div>
    </main>
  );
}