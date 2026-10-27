// components/stories/StoryViewer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Heart,
  MessageCircle,
  Repeat2,
  Send,
  LoaderCircle,
  Activity,
} from "lucide-react";
import { useChat } from "@/lib/chat-context";
import {
  displayName,
  relativeTime,
  type Profile,
  type StoryGroup,
  type StoryComment,
} from "@/lib/chat";

type Props = {
  group: StoryGroup | null;
  onClose: () => void;
};

export default function StoryViewer({ group, onClose }: Props) {
  const {
    stories,
    viewStory,
    deleteStory,
    toggleStoryLike,
    getStoryComments,
    getStoryLikes,
    addStoryComment,
    deleteStoryComment,
    repostStory,
    userId,
    myProfile,
  } = useChat();

  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Panels
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityTab, setActivityTab] = useState<"likes" | "comments">(
    "likes"
  );

  // Activity data
  const [likers, setLikers] = useState<Profile[]>([]);
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Comment composer
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);

  // Repost
  const [replying, setReplying] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // live data از context
  const liveGroup = group
    ? stories.find((g) => g.user.id === group.user.id) ?? group
    : null;
  const current = liveGroup?.stories[index];

  // بستن اگر استوری‌ها حذف شدند
  useEffect(() => {
    if (group && !liveGroup) onClose();
  }, [group, liveGroup, onClose]);

  // reset با تغییر کاربر
  useEffect(() => {
    setIndex(0);
    setProgress(0);
    setActivityOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.user.id]);

  // mark as viewed
  useEffect(() => {
    if (current && !current.viewed) {
      void viewStory(current.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, current?.viewed]);

  // progress
  useEffect(() => {
    if (!current || activityOpen) return;
    setProgress(0);

    if (current.media_type === "video") return;

    const start = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / 5000) * 100);
      setProgress(pct);
      if (pct >= 100) {
        window.clearInterval(id);
        goNext();
      }
    }, 50);

    timerRef.current = id;
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, activityOpen]);

  // لود activity وقتی پنل باز شد
  useEffect(() => {
    if (!activityOpen || !current) return;

    let cancelled = false;
    setLoadingActivity(true);

    (async () => {
      const [l, c] = await Promise.all([
        getStoryLikes(current.id),
        getStoryComments(current.id),
      ]);
      if (cancelled) return;
      setLikers(l);
      setComments(c);
      setLoadingActivity(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityOpen, current?.id]);

  // اسکرول پایین وقتی کامنت جدید
  useEffect(() => {
    if (activityOpen && activityTab === "comments") {
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [activityTab, comments.length, activityOpen]);

  const goNext = () => {
    if (!liveGroup) return;
    if (index < liveGroup.stories.length - 1) {
      setIndex(index + 1);
      setActivityOpen(false);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (index > 0) {
      setIndex(index - 1);
      setActivityOpen(false);
    }
  };

  if (!liveGroup || !current) return null;

  const name = displayName(liveGroup.user);
  const initial = name.charAt(0).toUpperCase();
  const isMine = current.user_id === userId;

  const handleVideoTime = () => {
    const v = videoRef.current;
    if (!v) return;
    const pct = v.duration ? (v.currentTime / v.duration) * 100 : 0;
    setProgress(pct);
    if (v.duration && v.currentTime >= v.duration - 0.1) {
      goNext();
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this story?")) return;
    const ok = await deleteStory(current.id);
    if (ok) {
      if (liveGroup.stories.length <= 1) onClose();
      else setIndex(Math.min(index, liveGroup.stories.length - 2));
    }
  };

  const handleLike = async () => {
    if (!current) return;
    if (isMine) {
      // برای استوری خودم → پنل activity
      setActivityTab("likes");
      setActivityOpen(true);
      return;
    }
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 300);
    await toggleStoryLike(current.id);
  };

  const handleCommentsButton = () => {
    if (isMine) {
      // برای استوری خودم → پنل activity روی تب comments
      setActivityTab("comments");
      setActivityOpen(true);
    } else {
      setActivityTab("comments");
      setActivityOpen(true);
    }
  };

  const handleRepost = async () => {
    if (!current || replying) return;
    setReplying(true);
    const res = await repostStory(current.id);
    setReplying(false);
    if (!res.ok) {
      alert(res.error || "Repost failed");
    } else {
      alert("Reposted to your story ✅");
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !current) return;
    setPosting(true);
    const res = await addStoryComment(current.id, commentText);
    setPosting(false);
    if (res.ok) {
      setCommentText("");
      const updated = await getStoryComments(current.id);
      setComments(updated);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    const ok = await deleteStoryComment(commentId);
    if (ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black">
      {/* Progress bars */}
      <div className="absolute left-0 right-0 top-0 z-10 flex gap-1 p-2">
        {liveGroup.stories.map((s, i) => (
          <div
            key={s.id}
            className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"
          >
            <div
              className="h-full bg-white transition-[width] duration-100"
              style={{
                width:
                  i < index ? "100%" : i === index ? `${progress}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute left-0 right-0 top-4 z-10 flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-2">
          {liveGroup.user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={liveGroup.user.avatar_url}
              alt={name}
              className="size-10 rounded-full object-cover ring-2 ring-white"
            />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white ring-2 ring-white">
              {initial}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-white">{name}</p>
            <p className="text-xs text-white/70">
              {relativeTime(current.created_at)}
              {current.reposted_from_user && (
                <span className="ml-1">
                  · reposted from {displayName(current.reposted_from_user)}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isMine && (
            <button
              onClick={() => void handleDelete()}
              className="rounded-full p-2 text-white hover:bg-white/10"
              aria-label="Delete"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white hover:bg-white/10"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex h-full w-full max-w-lg items-center justify-center">
        {current.media_type === "video" ? (
          <video
            ref={videoRef}
            src={current.media_url}
            autoPlay
            onTimeUpdate={handleVideoTime}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.media_url}
            alt="Story"
            className="max-h-full max-w-full object-contain"
          />
        )}

        {current.caption && !activityOpen && (
          <div className="absolute bottom-24 left-4 right-4 rounded-xl bg-black/60 px-4 py-2 text-center text-sm text-white backdrop-blur-sm">
            {current.caption}
          </div>
        )}

        {/* Tap zones */}
        <button
          onClick={goPrev}
          className="absolute left-0 top-0 z-10 flex h-full w-1/3 items-center justify-start pl-4 opacity-0 hover:opacity-100"
          aria-label="Previous"
        >
          <ChevronLeft size={32} className="text-white" />
        </button>
        <button
          onClick={goNext}
          className="absolute right-0 top-0 z-10 flex h-full w-1/3 items-center justify-end pr-4 opacity-0 hover:opacity-100"
          aria-label="Next"
        >
          <ChevronRight size={32} className="text-white" />
        </button>
      </div>

      {/* Bottom actions */}
      {!activityOpen && (
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-around gap-2 bg-gradient-to-t from-black/80 to-transparent p-4 pb-6">
          {/* Heart */}
          <button
            onClick={handleLike}
            className="flex flex-col items-center gap-1 text-white"
            aria-label={isMine ? "See who liked" : "Like"}
            title={isMine ? "See who liked" : "Like"}
          >
            <Heart
              size={26}
              className={`transition-transform ${
                likeAnim ? "scale-125" : "scale-100"
              } ${
                isMine
                  ? current.like_count
                    ? "fill-red-500 text-red-500"
                    : ""
                  : current.liked_by_me
                  ? "fill-red-500 text-red-500"
                  : ""
              }`}
            />
            <span className="text-xs">{current.like_count ?? 0}</span>
          </button>

          {/* Comments */}
          <button
            onClick={handleCommentsButton}
            className="flex flex-col items-center gap-1 text-white"
            aria-label="Comments"
          >
            <MessageCircle size={26} />
            <span className="text-xs">{current.comment_count ?? 0}</span>
          </button>

          {/* Activity (فقط برای خودم) */}
          {isMine && (
            <button
              onClick={() => {
                setActivityTab("likes");
                setActivityOpen(true);
              }}
              className="flex flex-col items-center gap-1 text-white"
              aria-label="Activity"
            >
              <Activity size={26} />
              <span className="text-xs">Activity</span>
            </button>
          )}

          {/* Repost (فقط برای دیگران) */}
          {!isMine && (
            <button
              onClick={() => void handleRepost()}
              disabled={replying}
              className="flex flex-col items-center gap-1 text-white disabled:opacity-50"
              aria-label="Repost"
            >
              {replying ? (
                <LoaderCircle size={26} className="animate-spin" />
              ) : (
                <Repeat2 size={26} />
              )}
              <span className="text-xs">Repost</span>
            </button>
          )}
        </div>
      )}

      {/* Activity panel */}
      {activityOpen && (
        <div className="absolute inset-x-0 bottom-0 z-30 flex max-h-[75vh] flex-col rounded-t-2xl bg-white shadow-xl dark:bg-slate-900">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800">
            <div className="flex flex-1 gap-1">
              <button
                onClick={() => setActivityTab("likes")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  activityTab === "likes"
                    ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                    : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <Heart size={14} />
                Likes ({current.like_count ?? 0})
              </button>
              <button
                onClick={() => setActivityTab("comments")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  activityTab === "comments"
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                    : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <MessageCircle size={14} />
                Comments ({current.comment_count ?? 0})
              </button>
            </div>
            <button
              onClick={() => setActivityOpen(false)}
              className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="scrollbar-hidden flex-1 overflow-y-auto px-4 py-3">
            {loadingActivity && (
              <div className="flex justify-center py-8">
                <LoaderCircle
                  size={20}
                  className="animate-spin text-slate-400"
                />
              </div>
            )}

            {/* LIKES TAB */}
            {!loadingActivity && activityTab === "likes" && (
              <>
                {likers.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    No likes yet.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {likers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        {u.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.avatar_url}
                            alt={displayName(u)}
                            className="size-10 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                            {displayName(u).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {displayName(u)}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            @{u.username || "no_username"}
                          </p>
                        </div>
                        <Heart
                          size={16}
                          className="shrink-0 fill-red-500 text-red-500"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* COMMENTS TAB */}
            {!loadingActivity && activityTab === "comments" && (
              <>
                {comments.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    No comments yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((c) => {
                      const canDelete = c.user_id === userId;
                      return (
                        <div key={c.id} className="flex items-start gap-2.5">
                          {c.user?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={c.user.avatar_url}
                              alt={displayName(c.user)}
                              className="size-8 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                              {c.user
                                ? displayName(c.user).charAt(0).toUpperCase()
                                : "?"}
                            </div>
                          )}
                          <div className="min-w-0 flex-1 rounded-2xl bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                                {c.user ? displayName(c.user) : "Unknown"}
                              </p>
                              <span className="shrink-0 text-[10px] text-slate-500 dark:text-slate-400">
                                {relativeTime(c.created_at)}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap break-words text-sm text-slate-800 dark:text-slate-100">
                              {c.content}
                            </p>
                          </div>
                          {canDelete && (
                            <button
                              onClick={() => void handleDeleteComment(c.id)}
                              className="shrink-0 rounded-full p-1 text-slate-400 hover:text-red-500"
                              aria-label="Delete comment"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    <div ref={commentsEndRef} />
                  </div>
                )}

                {/* Composer */}
                <div className="sticky bottom-0 mt-3 border-t border-slate-200 bg-white pt-3 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2">
                    {myProfile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={myProfile.avatar_url}
                        alt="Me"
                        className="size-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                        {myProfile
                          ? displayName(myProfile).charAt(0).toUpperCase()
                          : "?"}
                      </div>
                    )}
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void handleSendComment();
                        }
                      }}
                      placeholder="Add a comment..."
                      maxLength={500}
                      className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                    <button
                      onClick={() => void handleSendComment()}
                      disabled={posting || !commentText.trim()}
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      aria-label="Send"
                    >
                      {posting ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}