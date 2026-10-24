
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
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  UserRound,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  MessageSquare,
  Monitor,
  Smartphone,
} from "lucide-react";
import { useTheme } from "@/components/layout/ThemeProvider";

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
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-b-0 dark:border-slate-700">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
          {icon}
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {title}
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
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
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
        checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
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
  const { theme, setTheme } = useTheme();

  const [messageNotifications, setMessageNotifications] = useState(true);
  const [soundNotifications, setSoundNotifications] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState(true);

  const [fontSize, setFontSize] = useState("medium");
  const [savedMessage, setSavedMessage] = useState("");

  function showSavedMessage(message: string) {
    setSavedMessage(message);
    window.setTimeout(() => setSavedMessage(""), 2500);
  }

  function changeTheme(nextTheme: "light" | "dark") {
    setTheme(nextTheme);
    showSavedMessage(
      nextTheme === "dark" ? "Dark mode enabled" : "Light mode enabled",
    );
  }

  const fontSizes = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base",
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-8 flex items-center gap-4">
          <Link
            href="/"
            aria-label="Back to chats"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ArrowLeft size={20} />
          </Link>

          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Settings
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Customize your Telechat experience
            </p>
          </div>
        </header>

        {/* Saved notification */}
        {savedMessage && (
          <div
            role="status"
            className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
          >
            <Check size={18} />
            {savedMessage}
          </div>
        )}

        <div className="space-y-6">
          {/* Appearance */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <Palette size={22} />
              </div>

              <div>
                <h2 className="font-bold">Appearance</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Personalize how Telechat looks
                </p>
              </div>
            </div>

            <SettingRow
              icon={
                theme === "dark" ? (
                  <Moon size={20} />
                ) : (
                  <Sun size={20} />
                )
              }
              title="Theme mode"
              description="Choose light or dark appearance"
            >
              <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => changeTheme("light")}
                  aria-pressed={theme === "light"}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    theme === "light"
                      ? "bg-white text-amber-600 shadow-sm dark:bg-slate-700 dark:text-amber-400"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <Sun size={15} />
                  Light
                </button>

                <button
                  type="button"
                  onClick={() => changeTheme("dark")}
                  aria-pressed={theme === "dark"}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    theme === "dark"
                      ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <Moon size={15} />
                  Dark
                </button>
              </div>
            </SettingRow>

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
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </SettingRow>

            <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                MESSAGE PREVIEW
              </p>
              <p
                className={`${fontSizes[fontSize as keyof typeof fontSizes]} leading-6 text-slate-700 dark:text-slate-200`}
              >
                Hello! Welcome to Telechat. This is a preview of your message
                text.
              </p>
            </div>
          </section>

          {/* Notifications */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Bell size={22} />
              </div>

              <div>
                <h2 className="font-bold">Notifications</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Control how you receive alerts
                </p>
              </div>
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
              icon={soundNotifications ? <Volume2 size={20} /> : <VolumeX size={20} />}
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
                desktopNotifications ? (
                  <Bell size={20} />
                ) : (
                  <BellOff size={20} />
                )
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
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                <ShieldCheck size={22} />
              </div>

              <div>
                <h2 className="font-bold">Privacy</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Manage your visibility and privacy
                </p>
              </div>
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

          {/* Account */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <UserRound size={22} />
              </div>

              <div>
                <h2 className="font-bold">Account</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Manage your profile and account
                </p>
              </div>
            </div>

            <Link
              href="/contacts"
              className="flex items-center justify-between gap-3 border-b border-slate-100 py-4 transition hover:opacity-75 dark:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  <UserRound size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Contacts</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    View and manage your contacts
                  </p>
                </div>
              </div>
              <ChevronRight
                size={18}
                className="text-slate-400"
              />
            </Link>

            <SettingRow
              icon={<LockKeyhole size={20} />}
              title="Account security"
              description="Keep your account safe and secure"
            >
              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
                Protected
              </span>
            </SettingRow>

            <Link
              href="/about"
              className="flex items-center justify-between gap-3 py-4 transition hover:opacity-75"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">About Telechat</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    App information and details
                  </p>
                </div>
              </div>
              <ChevronRight
                size={18}
                className="text-slate-400"
              />
            </Link>
          </section>

          {/* Footer */}
          <footer className="pb-6 pt-2 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Telechat · Settings
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}