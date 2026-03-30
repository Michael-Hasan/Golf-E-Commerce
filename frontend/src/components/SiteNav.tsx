import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  SITE_NAV_GROUPS,
  type SiteNavGroupId,
} from "../nav/site-nav";

type SiteNavDesktopProps = {
  isUzHeader: boolean;
  isKoHeader: boolean;
};

export function SiteNavDesktop({ isUzHeader, isKoHeader }: SiteNavDesktopProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<SiteNavGroupId | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const triggerClass = `inline-flex items-center gap-1 shrink-0 whitespace-nowrap rounded-md px-2 py-1.5 font-semibold text-slate-700 transition-colors hover:bg-[var(--gl-hover)] hover:text-slate-950 dark:text-slate-300 dark:hover:bg-[var(--gl-hover)] dark:hover:text-white ${
    isUzHeader ? "text-xs sm:text-sm" : "text-sm xl:text-base"
  }`;

  return (
    <div
      ref={containerRef}
      className={`mx-auto flex min-h-9 w-max max-w-none flex-nowrap items-center justify-start px-2 ${
        isUzHeader
          ? "gap-1 sm:gap-2 xl:gap-3"
          : isKoHeader
            ? "gap-2 sm:gap-3 xl:gap-4"
            : "gap-2 sm:gap-3 xl:gap-4"
      }`}
    >
      {SITE_NAV_GROUPS.map((group) => {
        const isOpen = open === group.id;
        return (
          <div key={group.id} className="relative">
            <button
              type="button"
              className={triggerClass}
              aria-expanded={isOpen}
              aria-haspopup="true"
              aria-controls={`site-nav-panel-${group.id}`}
              id={`site-nav-trigger-${group.id}`}
              onClick={() => setOpen(isOpen ? null : group.id)}
            >
              <span>{t(group.titleKey)}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`shrink-0 opacity-70 transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {isOpen ? (
              <div
                id={`site-nav-panel-${group.id}`}
                role="region"
                aria-labelledby={`site-nav-trigger-${group.id}`}
                className="absolute left-0 top-full z-[60] mt-1 min-w-[16.5rem] max-w-[calc(100vw-2rem)] rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface)] py-2 shadow-xl shadow-slate-900/10 dark:shadow-black/40"
              >
                <ul className="max-h-[min(70vh,24rem)] overflow-y-auto py-1">
                  {group.links.map((link) => (
                    <li key={`${group.id}-${link.labelKey}`}>
                      <Link
                        to={link.to}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-[var(--gl-hover)] dark:text-slate-200 dark:hover:bg-[var(--gl-hover)]"
                        onClick={() => setOpen(null)}
                      >
                        <span>{t(link.labelKey)}</span>
                        {link.hotBadge ? (
                          <span className="ml-auto inline-flex shrink-0 items-center justify-center rounded-full bg-[#f6c84c] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
                            {t("nav.hot")}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

type SiteNavMobileDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function SiteNavMobileDrawer({ open, onClose }: SiteNavMobileDrawerProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<SiteNavGroupId | null>("shop");

  useEffect(() => {
    if (open) {
      setExpanded("shop");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label={t("a11y.closePanelBackdrop")}
        className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        className="fixed left-0 top-0 z-[56] flex h-full w-full max-w-sm flex-col border-r border-[var(--gl-border)] bg-[var(--gl-drawer)] shadow-2xl"
        aria-modal
        role="dialog"
        aria-label={t("nav.primaryMenuAria")}
      >
        <div className="flex items-center justify-between border-b border-[var(--gl-border)] px-4 py-3">
          <span className="font-[family-name:var(--font-heading)] text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t("nav.primaryMenuTitle")}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-md text-slate-700 dark:text-slate-300 transition-all hover:bg-[var(--gl-hover)]"
            aria-label={t("nav.menuClose")}
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
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Primary">
          {SITE_NAV_GROUPS.map((group) => {
            const isExpanded = expanded === group.id;
            return (
              <div
                key={group.id}
                className="mb-1 border-b border-[var(--gl-border)] pb-1 last:border-b-0"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-3 text-left font-semibold text-slate-900 dark:text-slate-100"
                  aria-expanded={isExpanded}
                  onClick={() =>
                    setExpanded(isExpanded ? null : group.id)
                  }
                >
                  {t(group.titleKey)}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {isExpanded ? (
                  <ul className="space-y-0.5 pb-2">
                    {group.links.map((link) => (
                      <li key={`${group.id}-m-${link.labelKey}`}>
                        <Link
                          to={link.to}
                          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                          onClick={onClose}
                        >
                          <span>{t(link.labelKey)}</span>
                          {link.hotBadge ? (
                            <span className="ml-auto inline-flex shrink-0 items-center justify-center rounded-full bg-[#f6c84c] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
                              {t("nav.hot")}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
