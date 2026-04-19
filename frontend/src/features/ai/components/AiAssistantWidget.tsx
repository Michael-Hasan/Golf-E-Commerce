import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getChatIdentityFromToken,
  persistAiHistory,
  readAiHistory,
  readStoredToken,
  type GreenlinksAiOpenDetail,
} from "../../../lib/app-utils";
import type { AiPanelMessage } from "../../../types/app";
import { AI_CHAT_ENDPOINT, GREENLINKS_AI_OPEN_EVENT } from "../../../config/app-config";
import { normalizeLang } from "../../../i18n";

export function AiAssistantWidget() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<AiPanelMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([
    t("ai.suggest1"),
    t("ai.suggest2"),
    t("ai.suggest3"),
    t("ai.suggest4"),
  ]);
  const listRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const token = readStoredToken();
  const identity = useMemo(() => getChatIdentityFromToken(token), [token]);

  useEffect(() => {
    const stored = readAiHistory(identity.userId);
    if (stored.length) {
      setMessages(stored);
      return;
    }
    const welcome: AiPanelMessage = {
      id: `ai-welcome-${Date.now()}`,
      role: "assistant",
      text: t("ai.welcome"),
      createdAt: new Date().toISOString(),
    };
    setMessages([welcome]);
  }, [identity.userId]);

  useEffect(() => {
    if (!messages.length) return;
    persistAiHistory(identity.userId, messages);
  }, [messages, identity.userId]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isOpen, isThinking]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (!containerRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const askAi = async (question: string) => {
    const text = question.trim();
    if (!text || isThinking) return;

    const userMessage: AiPanelMessage = {
      id: `ai-user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: "user",
      text,
      createdAt: new Date().toISOString(),
    };
    const historyPayload = [...messages.slice(-8), userMessage].map((item) => ({
      role: item.role,
      text: item.text,
    }));
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setIsThinking(true);

    try {
      const response = await fetch(AI_CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          language: normalizeLang(i18n.language),
        }),
      });

      if (!response.ok) {
        throw new Error(`AI request failed (${response.status})`);
      }

      const payload = (await response.json()) as {
        answer?: string;
        suggestions?: string[];
      };
      const answer = payload.answer?.trim() || t("ai.failAnswer");
      const aiMessage: AiPanelMessage = {
        id: `ai-assistant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: "assistant",
        text: answer,
        createdAt: new Date().toISOString(),
      };
      setMessages((current) => [...current, aiMessage]);
      if (Array.isArray(payload.suggestions) && payload.suggestions.length) {
        setSuggestions(payload.suggestions.slice(0, 4));
      }
    } catch {
      const failMessage: AiPanelMessage = {
        id: `ai-error-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: "assistant",
        text: t("ai.unavailable"),
        createdAt: new Date().toISOString(),
      };
      setMessages((current) => [...current, failMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const askAiRef = useRef(askAi);
  askAiRef.current = askAi;

  useEffect(() => {
    const onOpen = (event: Event) => {
      const custom = event as CustomEvent<GreenlinksAiOpenDetail>;
      const { message, autoSend } = custom.detail ?? {};
      setIsOpen(true);
      const q = message?.trim();
      if (!q) return;
      if (autoSend) {
        queueMicrotask(() => {
          void askAiRef.current(q);
        });
      } else {
        setDraft(q);
      }
    };
    window.addEventListener(GREENLINKS_AI_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(GREENLINKS_AI_OPEN_EVENT, onOpen);
  }, []);

  return (
    <>
      {isOpen ? (
        <div
          ref={containerRef}
          className="fixed bottom-28 left-4 z-[70] w-[calc(100vw-2rem)] max-w-[22rem] overflow-hidden rounded-2xl border border-[var(--gl-border-card)] bg-[var(--gl-surface)] shadow-2xl shadow-black/15 dark:border-[#224b86] dark:bg-[#071126] dark:shadow-black/50 sm:left-6"
        >
          <div className="flex items-center justify-between border-b border-[var(--gl-border-muted)] px-4 py-3 dark:border-[#1b355f]">
            <div>
              <p className="text-sm font-semibold text-[var(--gl-heading)] dark:text-slate-100">
                {t("product.aiTitle")}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t("product.aiSub")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#112241] dark:hover:text-white"
              aria-label={t("a11y.closeAi")}
            >
              ✕
            </button>
          </div>

          <div
            ref={listRef}
            className="max-h-[26rem] min-h-[18rem] space-y-2 overflow-y-auto bg-[var(--gl-surface-muted)]/60 px-4 py-3 dark:bg-transparent"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[88%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  message.role === "assistant"
                    ? "border border-[var(--gl-border)] bg-[var(--gl-surface)] text-slate-800 dark:bg-[#0b1a35] dark:text-slate-100"
                    : "ml-auto bg-[#4f9cff] text-[#04142b]"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
            ))}
            {isThinking ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface)] px-3 py-2 text-xs text-slate-600 dark:bg-[#0b1a35] dark:text-slate-400">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-[#2563eb] dark:bg-[#61a8ff]" />
                {t("product.aiThinking")}
              </div>
            ) : null}
          </div>

          <div className="border-t border-[var(--gl-border-muted)] p-3 dark:border-[#1b355f]">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    void askAi(suggestion);
                  }}
                  className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-chip)] px-2 py-1 text-[10px] font-medium text-[var(--gl-accent-text)] transition-colors hover:bg-[var(--gl-hover)] dark:bg-[#0b1a35] dark:text-[#9ec7ff] dark:hover:bg-[#102448]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-2 dark:bg-[#0b1a35]">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void askAi(draft);
                  }
                }}
                placeholder={t("product.placeholderAsk")}
                className="h-8 flex-1 bg-transparent px-2 text-sm text-slate-900 outline-none placeholder:text-slate-500 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => {
                  void askAi(draft);
                }}
                disabled={isThinking}
                className="inline-flex h-8 items-center justify-center rounded-md bg-[#4f9cff] px-3 text-xs font-semibold text-[#04142b] hover:bg-[#61a8ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("product.ask")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed bottom-6 left-4 z-[70] flex flex-col items-center gap-1 sm:left-6">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="group relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] via-[#6366f1] to-[#06b6d4] text-white shadow-[0_12px_40px_-8px_rgba(124,58,237,0.65),0_0_0_1px_rgba(255,255,255,0.12)_inset] transition-all duration-300 hover:scale-105 hover:shadow-[0_16px_48px_-8px_rgba(99,102,241,0.75),0_0_32px_-4px_rgba(6,182,212,0.45)]"
          aria-label={t("a11y.openAi")}
        >
          {/* Soft glow ring — reads as “smart / active” */}
          <span
            className="pointer-events-none absolute inset-0 rounded-full opacity-70 blur-md transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(196,181,253,0.5), transparent 55%), radial-gradient(circle at 70% 70%, rgba(103,232,249,0.35), transparent 50%)",
            }}
          />
          <span className="pointer-events-none absolute inset-[3px] rounded-full bg-[#0f172a]/25 ring-1 ring-white/25" />
          {/* Sparkles icon — common “AI magic” visual language */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.65"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="relative z-[1] h-[1.65rem] w-[1.65rem] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
            aria-hidden="true"
          >
            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09L9 18.75l.813 2.846z" />
            <path d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456z" />
            <path d="M16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423z" />
          </svg>
        </button>
        <span className="pointer-events-none select-none text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-800 drop-shadow-[0_1px_0_rgba(255,255,255,0.9)] dark:text-white dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
          {t("ai.label")}
        </span>
      </div>
    </>
  );
}

export default AiAssistantWidget;
