import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function FooterLegalLinks() {
  const { t } = useTranslation();

  return (
    <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--gl-border)] pt-8 sm:flex-row">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {t("footer.copyright")}
      </p>
      <div className="flex gap-6">
        <Link
          to="/"
          className="text-sm text-slate-600 dark:text-slate-400 transition-colors hover:text-[var(--gl-accent-text)]"
        >
          {t("footer.privacy")}
        </Link>
        <Link
          to="/"
          className="text-sm text-slate-600 dark:text-slate-400 transition-colors hover:text-[var(--gl-accent-text)]"
        >
          {t("footer.terms")}
        </Link>
        <Link
          to="/"
          className="text-sm text-slate-600 dark:text-slate-400 transition-colors hover:text-[var(--gl-accent-text)]"
        >
          {t("footer.cookies")}
        </Link>
      </div>
    </div>
  );
}
