import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { isValidEmail, saveNewsletterEmail } from "../../../lib/app-utils";

type NewsletterMessage = { type: "success" | "error"; text: string } | null;

export function FooterNewsletter() {
  const { t } = useTranslation();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState<NewsletterMessage>(null);

  const handleNewsletterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = newsletterEmail.trim();

    if (!isValidEmail(email)) {
      setNewsletterMessage({
        type: "error",
        text: t("footer.invalidEmail"),
      });
      return;
    }

    const status = saveNewsletterEmail(email);
    setNewsletterMessage({
      type: "success",
      text:
        status === "exists"
          ? t("footer.subscribeExists")
          : t("footer.subscribeOk"),
    });
    setNewsletterEmail("");
  };

  return (
    <div className="mt-6">
      <p className="text-sm font-medium text-[var(--gl-heading)]">
        {t("footer.newsletterTitle")}
      </p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {t("footer.newsletterHint")}
      </p>
      <form className="mt-4 flex gap-2" onSubmit={handleNewsletterSubmit}>
        <input
          type="email"
          placeholder={t("footer.emailPlaceholder")}
          value={newsletterEmail}
          onChange={(event) => {
            setNewsletterEmail(event.target.value);
            if (newsletterMessage) setNewsletterMessage(null);
          }}
          className="h-9 w-full flex-1 rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-3 py-1 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 outline-none transition-[color,box-shadow] focus:border-[#2a5f45] focus:ring-[3px] focus:ring-[#2a5f45]/30"
        />
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center gap-1 rounded-md bg-[#22c55e] px-4 py-2 text-sm font-medium text-[#062412] transition-all hover:bg-[#33d06b]"
        >
          {t("footer.subscribe")}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </form>
      {newsletterMessage ? (
        <p
          className={`mt-2 text-xs ${
            newsletterMessage.type === "error"
              ? "text-rose-400"
              : "text-[var(--gl-accent-text)]"
          }`}
        >
          {newsletterMessage.text}
        </p>
      ) : null}
    </div>
  );
}
