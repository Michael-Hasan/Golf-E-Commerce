import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useTranslation } from "react-i18next";

import {
  getChatIdentityFromToken,
  persistHiddenChatMessageIds,
  persistUnreadChatCount,
  readHiddenChatMessageIds,
  readStoredToken,
  readUnreadChatCount,
} from "../../../lib/app-utils";
import type { ChatMessage } from "../../../types/app";
import { CHAT_WS_ENDPOINT, SOCKET_IO_PATH } from "../../../config/app-config";

export function ChatWidget() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [unreadCount, setUnreadCount] = useState(() => readUnreadChatCount());
  const [hiddenMessageIds, setHiddenMessageIds] = useState<string[]>([]);
  const [deleteMenuId, setDeleteMenuId] = useState<string | null>(null);
  const isOpenRef = useRef(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const roomId = "global";
  const token = readStoredToken();
  const identity = useMemo(() => getChatIdentityFromToken(token), [token]);
  const visibleMessages = useMemo(
    () => messages.filter((message) => !hiddenMessageIds.includes(message.id)),
    [messages, hiddenMessageIds],
  );

  useEffect(() => {
    setHiddenMessageIds(readHiddenChatMessageIds(identity.userId));
  }, [identity.userId]);

  useEffect(() => {
    persistHiddenChatMessageIds(identity.userId, hiddenMessageIds);
  }, [hiddenMessageIds, identity.userId]);

  useEffect(() => {
    const socket = io(CHAT_WS_ENDPOINT, {
      path: SOCKET_IO_PATH,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 4000,
      timeout: 5000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("chat:join", {
        roomId,
        userId: identity.userId,
        userName: identity.userName,
      });
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("chat:history", (history: ChatMessage[]) => {
      setMessages(Array.isArray(history) ? history : []);
    });

    socket.on("chat:presence", (payload: { onlineCount?: number }) => {
      setOnlineCount(Math.max(0, Number(payload?.onlineCount ?? 0)));
    });

    socket.on("chat:message", (message: ChatMessage) => {
      setMessages((current) => [...current, message].slice(-100));
      if (!isOpenRef.current && message.userId !== identity.userId) {
        setUnreadCount((count) => {
          const next = count + 1;
          persistUnreadChatCount(next);
          return next;
        });
      }
    });

    socket.on(
      "chat:deleted",
      (payload: { messageId?: string; mode?: "me" | "all" }) => {
        const messageId = payload?.messageId?.trim();
        if (!messageId) return;
        if (payload.mode === "all") {
          setMessages((current) =>
            current.filter((message) => message.id !== messageId),
          );
          return;
        }
        setHiddenMessageIds((current) =>
          current.includes(messageId) ? current : [...current, messageId],
        );
      },
    );

    return () => {
      socket.emit("chat:leave", { roomId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [identity.userId, identity.userName]);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (!isOpen) return;
    setUnreadCount(0);
    persistUnreadChatCount(0);
  }, [isOpen]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isOpen]);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    socketRef.current?.emit("chat:send", {
      roomId,
      userId: identity.userId,
      userName: identity.userName,
      text,
    });
    setDraft("");
  };

  const deleteMessageForMe = (messageId: string) => {
    socketRef.current?.emit("chat:delete", {
      roomId,
      messageId,
      mode: "me",
      userId: identity.userId,
    });
    setDeleteMenuId(null);
  };

  const deleteMessageForAll = (messageId: string) => {
    socketRef.current?.emit("chat:delete", {
      roomId,
      messageId,
      mode: "all",
      userId: identity.userId,
    });
    setDeleteMenuId(null);
  };

  const hasOnlineSupport = connected && onlineCount > 0;

  return (
    <>
      {isOpen ? (
        <div className="fixed bottom-28 right-4 z-[70] w-[calc(100vw-2rem)] max-w-[22rem] overflow-hidden rounded-2xl border border-[var(--gl-border-card)] bg-[var(--gl-surface)] shadow-2xl shadow-black/15 dark:border-[#5a3b0d] dark:bg-[#130b03] dark:shadow-black/50 sm:right-6">
          <div className="flex items-center justify-between border-b border-[var(--gl-border-muted)] px-4 py-3 dark:border-[#4a2f09]">
            <div>
              <p className="text-sm font-semibold text-[var(--gl-heading)] dark:text-slate-100">
                {t("chat.title")}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {connected
                  ? t("chat.online", { count: onlineCount })
                  : t("chat.connecting")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#2b1a05] dark:hover:text-white"
              aria-label={t("a11y.closeChat")}
            >
              ✕
            </button>
          </div>

          <div
            ref={listRef}
            className="max-h-[26rem] min-h-[18rem] space-y-2 overflow-y-auto bg-[var(--gl-surface-muted)]/60 px-4 py-3 dark:bg-transparent"
          >
            {visibleMessages.length === 0 ? (
              <p className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface)] px-3 py-2 text-xs text-slate-600 dark:border-[#5a3b0d] dark:bg-[#1c1205] dark:text-slate-400">
                {t("chat.emptyPrompt")}
              </p>
            ) : (
              visibleMessages.map((message) => {
                const isMine = message.userId === identity.userId;
                const isSystem = message.userId === "system";
                const canDelete = isMine && !isSystem;
                return (
                  <div
                    key={message.id}
                    className={
                      canDelete ? "group relative ml-auto max-w-[85%]" : ""
                    }
                  >
                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteMenuId((current) =>
                            current === message.id ? null : message.id,
                          )
                        }
                        className={`absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md border border-amber-800/35 bg-white/95 text-amber-900 transition-all duration-200 hover:bg-amber-50 hover:text-rose-700 dark:border-[#5a3b0d]/70 dark:bg-[#2a1a06]/80 dark:text-amber-100 dark:hover:bg-[#3b2408] dark:hover:text-rose-300 ${
                          deleteMenuId === message.id
                            ? "translate-x-0 opacity-100"
                            : "translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100"
                        }`}
                        aria-label="Delete message options"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                          <path d="M3 6h18" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    ) : null}
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                        isSystem
                          ? "mx-auto border border-amber-200/90 bg-amber-50 text-xs text-amber-900 dark:border-[#5a3b0d] dark:bg-[#2a1a06] dark:text-[#f2bf62]"
                          : isMine
                            ? "ml-auto bg-[#f59e0b] pr-11 text-[#3f2100]"
                            : "border border-[var(--gl-border)] bg-[var(--gl-surface)] text-slate-800 dark:border-[#5a3b0d] dark:bg-[#1c1205] dark:text-slate-100"
                      }`}
                    >
                      {!isMine && !isSystem ? (
                        <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {message.userName}
                        </p>
                      ) : null}
                      <p>{message.text}</p>
                    </div>
                    {deleteMenuId === message.id ? (
                      <div className="absolute -right-1 top-[calc(100%+0.35rem)] z-10 w-32 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-1.5 shadow-xl dark:border-[#5a3b0d] dark:bg-[#1a1004]">
                        <button
                          type="button"
                          onClick={() => deleteMessageForMe(message.id)}
                          className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-[var(--gl-hover)] dark:text-slate-400 dark:hover:bg-[#2a1a06]"
                        >
                          {t("chat.deleteForMe")}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMessageForAll(message.id)}
                          className="mt-1 block w-full rounded-md px-2 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-[#2a1017]"
                        >
                          {t("chat.deleteForAll")}
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-[var(--gl-border-muted)] p-3 dark:border-[#4a2f09]">
            <div className="flex items-center gap-2 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-2 py-2 dark:border-[#5a3b0d] dark:bg-[#1a1004]">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={t("chat.placeholder")}
                className="h-8 flex-1 bg-transparent px-2 text-sm text-slate-900 outline-none placeholder:text-slate-500 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={sendMessage}
                className="inline-flex h-8 items-center justify-center rounded-md bg-[#f59e0b] px-3 text-xs font-semibold text-[#3f2100] hover:bg-[#fbbf24]"
              >
                {t("chat.send")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed bottom-6 right-4 z-[70] flex flex-col items-center gap-1 sm:right-6">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className={`relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#f59e0b] text-[#3f2100] shadow-xl shadow-[#f59e0b]/35 transition-transform hover:scale-105 hover:bg-[#fbbf24] ${
            hasOnlineSupport
              ? "ring-2 ring-emerald-400/70 ring-offset-2 ring-offset-[var(--gl-page)]"
              : ""
          }`}
          aria-label={t("a11y.openChat")}
        >
          {hasOnlineSupport ? (
            <>
              <span className="absolute -left-1 -top-1 inline-flex h-4 w-4 rounded-full bg-emerald-400/80 animate-ping" />
              <span className="absolute -left-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-emerald-200/60 bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.8)]" />
            </>
          ) : null}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          </svg>
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>
        <span className="pointer-events-none select-none text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-800 drop-shadow-[0_1px_0_rgba(255,255,255,0.9)] dark:text-white dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
          {t("chat.label")}
        </span>
      </div>
    </>
  );
}

export default ChatWidget;
