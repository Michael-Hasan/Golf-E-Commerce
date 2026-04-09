import React from "react";
import { Link } from "react-router-dom";
import { TFunction } from "i18next";

import { ThemeMode } from "../../../theme-context";

type TopNavControlsProps = {
  t: TFunction;
  theme: ThemeMode;
  toggleTheme: () => void;
  language: string;
  onLanguageChange: (value: string) => void;
  isUzHeader: boolean;
  isAuthenticated: boolean;
  wishlistCount: number;
  cartItemCount: number;
  onWishlistOpen: () => void;
  onCartOpen: () => void;
  onMobileNavOpen: () => void;
};

export function TopNavControls({
  t,
  theme,
  toggleTheme,
  language,
  onLanguageChange,
  isUzHeader,
  isAuthenticated,
  wishlistCount,
  cartItemCount,
  onWishlistOpen,
  onCartOpen,
  onMobileNavOpen,
}: TopNavControlsProps) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      <button
        type="button"
        onClick={toggleTheme}
        className="inline-flex size-8 items-center justify-center rounded-md text-slate-600 transition-all hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
        aria-label={
          theme === "dark" ? t("theme.toLight") : t("theme.toDark")
        }
        title={theme === "dark" ? t("theme.light") : t("theme.dark")}
      >
        {theme === "dark" ? (
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
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        ) : (
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
            aria-hidden="true"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        )}
      </button>
      <label className="sr-only" htmlFor="gl-lang-select">
        {t("a11y.language")}
      </label>
      <select
        id="gl-lang-select"
        value={language}
        onChange={(event) => onLanguageChange(event.target.value)}
        className="h-9 min-w-[6rem] w-max max-w-none rounded-md border border-[var(--gl-border)] bg-[var(--gl-input-bg)] px-2 text-xs font-medium leading-normal text-slate-700 outline-none dark:text-slate-300"
      >
        <option value="en">{t("lang.en")}</option>
        <option value="ko">{t("lang.ko")}</option>
        <option value="uz">{t("lang.uz")}</option>
      </select>
      {isAuthenticated ? (
        <>
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 transition-all hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100 lg:hidden"
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
              <path d="m21 21-4.34-4.34" />
              <circle cx="11" cy="11" r="8" />
            </svg>
            <span className="sr-only">{t("a11y.search")}</span>
          </button>
          <button
            type="button"
            onClick={onWishlistOpen}
            className="relative hidden size-8 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 transition-all hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100 sm:flex"
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
              <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
            </svg>
            {wishlistCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#22c55e] px-1 text-[10px] font-bold text-[#042210]">
                {wishlistCount}
              </span>
            ) : null}
            <span className="sr-only">{t("a11y.wishlist")}</span>
          </button>
          <Link
            to="/my-page"
            className="hidden size-8 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 transition-all hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100 sm:flex"
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
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="sr-only">{t("a11y.account")}</span>
          </Link>
          <button
            type="button"
            data-cart-fly-target
            onClick={onCartOpen}
            className="relative inline-flex size-8 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 transition-all hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100"
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
              <path d="M16 10a4 4 0 0 1-8 0" />
              <path d="M3.103 6.034h17.794" />
              <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z" />
            </svg>
            {cartItemCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#22c55e] px-1 text-[10px] font-bold text-[#042210]">
                {cartItemCount}
              </span>
            ) : null}
            <span className="sr-only">{t("a11y.cart")}</span>
          </button>
          <button
            type="button"
            onClick={onMobileNavOpen}
            className="inline-flex size-8 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 transition-all hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100 lg:hidden"
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
              <path d="M4 5h16" />
              <path d="M4 12h16" />
              <path d="M4 19h16" />
            </svg>
            <span className="sr-only">{t("a11y.menu")}</span>
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={onMobileNavOpen}
            className="inline-flex size-8 items-center justify-center rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 transition-all hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100 lg:hidden"
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
              <path d="M4 5h16" />
              <path d="M4 12h16" />
              <path d="M4 19h16" />
            </svg>
            <span className="sr-only">{t("a11y.menu")}</span>
          </button>
          <Link
            to="/auth"
            title={t("nav.loginSignupFull")}
            className={`inline-flex items-center justify-center rounded-md border border-[var(--gl-border-soft)] bg-[var(--gl-surface)] px-3 py-2 text-center font-medium leading-snug text-slate-900 dark:text-slate-100 transition-all hover:bg-[var(--gl-raised)] ${
              isUzHeader
                ? "w-full min-w-0 max-w-[13.5rem] whitespace-normal break-words text-xs [overflow-wrap:anywhere] sm:max-w-[15rem] sm:text-sm lg:w-auto lg:max-w-[17rem] xl:max-w-[19rem]"
                : "max-w-[min(20rem,calc(100vw-7rem))] break-words text-xs [overflow-wrap:anywhere] sm:max-w-[min(22rem,calc(100vw-8rem))] sm:text-sm lg:max-w-[min(26rem,calc(100vw-12rem))]"
            }`}
          >
            {t("nav.loginSignup")}
          </Link>
        </>
      )}
    </div>
  );
}
