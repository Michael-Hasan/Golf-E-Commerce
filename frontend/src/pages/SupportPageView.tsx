import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { normalizeLang } from '../i18n';
import {
  fetchSupportFaqs,
  lookupSupportOrder,
  submitSupportRequest,
  type SupportFaq,
  type SupportOrderStatus,
  type SupportTicket,
} from './support/support-api';
import type { SupportPageSlug } from './support/support-page-slugs';

type Props = {
  slug: SupportPageSlug;
};

type PolicySlug = Extract<SupportPageSlug, 'privacy' | 'terms' | 'cookies'>;

function formatDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : locale === 'uz' ? 'uz-UZ' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

function SupportChrome({
  slug,
  eyebrow,
  title,
  lead,
  aside,
}: {
  slug: SupportPageSlug;
  eyebrow: string;
  title: string;
  lead: string;
  aside: React.ReactNode;
}) {
  const { t } = useTranslation();
  const nav = [
    { slug: 'home', label: t('supportPage.nav.home'), to: '/support' },
    { slug: 'contact', label: t('supportPage.nav.contact'), to: '/support/contact' },
    { slug: 'faqs', label: t('supportPage.nav.faqs'), to: '/support/faqs' },
    { slug: 'shipping', label: t('supportPage.nav.shipping'), to: '/support/shipping' },
    { slug: 'returns', label: t('supportPage.nav.returns'), to: '/support/returns' },
    { slug: 'size-guide', label: t('supportPage.nav.sizeGuide'), to: '/support/size-guide' },
    { slug: 'track-order', label: t('supportPage.nav.trackOrder'), to: '/support/track-order' },
    { slug: 'privacy', label: t('supportPage.nav.privacy'), to: '/support/privacy' },
    { slug: 'terms', label: t('supportPage.nav.terms'), to: '/support/terms' },
    { slug: 'cookies', label: t('supportPage.nav.cookies'), to: '/support/cookies' },
  ] as const;

  return (
    <>
      <div className="border-b border-[var(--gl-border)] bg-[var(--gl-surface-60)]">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-600 dark:text-slate-400">
            <Link to="/" className="font-medium text-[var(--gl-accent-text)] transition-colors hover:underline">
              {t('supportPage.chrome.home')}
            </Link>
            <span className="mx-2 opacity-60" aria-hidden>
              /
            </span>
            <span className="font-medium text-[var(--gl-accent-text)]">{t('supportPage.chrome.support')}</span>
            <span className="mx-2 opacity-60" aria-hidden>
              /
            </span>
            <span className="font-semibold text-[var(--gl-heading)]">
              {nav.find((item) => item.slug === slug)?.label ?? t('supportPage.chrome.support')}
            </span>
          </nav>
        </div>
      </div>

      <section className="relative overflow-hidden border-b border-[var(--gl-border)]">
        <div className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-30">
          <div className="absolute inset-x-0 top-0 h-52 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.22),_transparent_60%)]" />
          <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-[#f6c84c]/20 blur-3xl" />
          <div className="absolute right-0 top-10 h-80 w-80 rounded-full bg-[#22c55e]/18 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_23rem] lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--gl-accent-text)]">
              {eyebrow}
            </p>
            <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-heading)] text-4xl font-bold tracking-tight text-[var(--gl-heading)] sm:text-5xl">
              {title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              {lead}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/support/contact"
                className="inline-flex items-center justify-center rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-[#042210] transition-colors hover:bg-[#35d76d]"
              >
                {t('supportPage.chrome.contactCta')}
              </Link>
              <Link
                to="/support/track-order"
                className="inline-flex items-center justify-center rounded-full border border-[var(--gl-border)] bg-[var(--gl-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--gl-heading)] transition-colors hover:bg-[var(--gl-raised)]"
              >
                {t('supportPage.chrome.trackCta')}
              </Link>
            </div>
          </div>
          <aside className="rounded-[2rem] border border-[var(--gl-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.72))] p-6 shadow-[0_24px_90px_rgba(5,7,5,0.10)] dark:bg-[linear-gradient(180deg,rgba(8,15,10,0.94),rgba(8,15,10,0.82))]">
            {aside}
          </aside>
        </div>
      </section>

      <div className="border-b border-[var(--gl-border)] bg-[var(--gl-surface)]">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-4 sm:px-6 lg:px-8">
          {nav.map((item) => (
            <Link
              key={item.slug}
              to={item.to}
              className={`inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                item.slug === slug
                  ? 'bg-[var(--gl-nav-active-bg)] text-[var(--gl-nav-active-text)]'
                  : 'bg-[var(--gl-surface-60)] text-slate-600 hover:bg-[var(--gl-hover)] dark:text-slate-300'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

function Section({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--gl-heading)] sm:text-3xl">
        {title}
      </h2>
      {lead ? (
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
          {lead}
        </p>
      ) : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function SupportHomePage() {
  const { t, i18n } = useTranslation();
  const locale = normalizeLang(i18n.resolvedLanguage ?? i18n.language);
  const [faqs, setFaqs] = useState<SupportFaq[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchSupportFaqs(locale, undefined, true).then((result) => {
      if (!active) return;
      if (result.error) {
        setError(result.error);
        return;
      }
      setFaqs(result.data?.supportFaqs ?? []);
    });
    return () => {
      active = false;
    };
  }, [locale]);

  return (
    <main className="flex-1">
      <SupportChrome
        slug="home"
        eyebrow={t('supportPage.homePage.eyebrow')}
        title={t('supportPage.homePage.title')}
        lead={t('supportPage.homePage.lead')}
        aside={
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gl-accent-text)]">
              {t('supportPage.homePage.asideTitle')}
            </p>
            <div className="mt-4 space-y-4">
              {[
                ['supportPage.homePage.aside1Title', 'supportPage.homePage.aside1Body'],
                ['supportPage.homePage.aside2Title', 'supportPage.homePage.aside2Body'],
                ['supportPage.homePage.aside3Title', 'supportPage.homePage.aside3Body'],
              ].map(([titleKey, bodyKey]) => (
                <div key={titleKey} className="rounded-2xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface)] p-4">
                  <h2 className="font-semibold text-[var(--gl-heading)]">{t(titleKey)}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t(bodyKey)}</p>
                </div>
              ))}
            </div>
          </div>
        }
      />

      <Section title={t('supportPage.homePage.jumpTitle')} lead={t('supportPage.homePage.jumpLead')}>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['supportPage.homePage.card1Title', 'supportPage.homePage.card1Body', '/support/contact'],
            ['supportPage.homePage.card2Title', 'supportPage.homePage.card2Body', '/support/faqs'],
            ['supportPage.homePage.card3Title', 'supportPage.homePage.card3Body', '/support/track-order'],
            ['supportPage.homePage.card4Title', 'supportPage.homePage.card4Body', '/support/shipping'],
          ].map(([titleKey, bodyKey, to]) => (
            <Link
              key={titleKey}
              to={to}
              className="group rounded-[1.75rem] border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6 shadow-sm transition-transform hover:-translate-y-1"
            >
              <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--gl-heading)]">
                {t(titleKey)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t(bodyKey)}</p>
              <span className="mt-6 inline-flex text-sm font-semibold text-[var(--gl-accent-text)]">
                {t('supportPage.common.open')}
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <section className="border-y border-[var(--gl-border)] bg-[var(--gl-surface-60)] py-14">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {[
            ['supportPage.homePage.stat1Value', 'supportPage.homePage.stat1Body'],
            ['supportPage.homePage.stat2Value', 'supportPage.homePage.stat2Body'],
            ['supportPage.homePage.stat3Value', 'supportPage.homePage.stat3Body'],
          ].map(([valueKey, detailKey]) => (
            <div key={valueKey} className="rounded-3xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface)] p-6">
              <p className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--gl-heading)]">{t(valueKey)}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t(detailKey)}</p>
            </div>
          ))}
        </div>
      </section>

      <Section title={t('supportPage.homePage.faqTitle')} lead={t('supportPage.homePage.faqLead')}>
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
            {error}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {faqs.map((faq) => (
              <article key={faq.id} className="rounded-3xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gl-accent-text)]">
                  {faq.category}
                </p>
                <h3 className="mt-3 font-semibold text-[var(--gl-heading)]">{faq.question}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{faq.answer}</p>
              </article>
            ))}
          </div>
        )}
      </Section>
    </main>
  );
}

function ContactPage() {
  const { t } = useTranslation();
  const topicOptions = [
    t('supportPage.topics.orderUpdate'),
    t('supportPage.topics.shippingIssue'),
    t('supportPage.topics.returnExchange'),
    t('supportPage.topics.sizingHelp'),
    t('supportPage.topics.productAdvice'),
    t('supportPage.topics.paymentCheckout'),
    t('supportPage.topics.accountAccess'),
    t('supportPage.topics.somethingElse'),
  ];
  const [form, setForm] = useState({
    name: '',
    email: '',
    topic: topicOptions[0],
    orderNumber: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<SupportTicket | null>(null);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      topic: topicOptions.includes(current.topic) ? current.topic : topicOptions[0],
    }));
  }, [topicOptions]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setReceipt(null);

    const result = await submitSupportRequest({
      ...form,
      orderNumber: form.orderNumber.trim() || undefined,
    });

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setReceipt(result.data?.submitSupportRequest ?? null);
    setForm({
      name: '',
      email: '',
      topic: topicOptions[0],
      orderNumber: '',
      message: '',
    });
  }

  return (
    <main className="flex-1">
      <SupportChrome
        slug="contact"
        eyebrow={t('supportPage.contactPage.eyebrow')}
        title={t('supportPage.contactPage.title')}
        lead={t('supportPage.contactPage.lead')}
        aside={
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gl-accent-text)]">
              {t('supportPage.contactPage.asideTitle')}
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              <li>{t('supportPage.contactPage.aside1')}</li>
              <li>{t('supportPage.contactPage.aside2')}</li>
              <li>{t('supportPage.contactPage.aside3')}</li>
            </ul>
          </div>
        }
      />

      <Section title={t('supportPage.contactPage.formTitle')} lead={t('supportPage.contactPage.formLead')}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <form onSubmit={onSubmit} className="space-y-5 rounded-[2rem] border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-medium text-[var(--gl-heading)]">
                {t('supportPage.contactPage.name')}
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[var(--gl-border)] bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--gl-accent-text)]"
                  required
                />
              </label>
              <label className="text-sm font-medium text-[var(--gl-heading)]">
                {t('supportPage.contactPage.email')}
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[var(--gl-border)] bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--gl-accent-text)]"
                  required
                />
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_14rem]">
              <label className="text-sm font-medium text-[var(--gl-heading)]">
                {t('supportPage.contactPage.topic')}
                <select
                  value={form.topic}
                  onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[var(--gl-border)] bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--gl-accent-text)]"
                >
                  {topicOptions.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-[var(--gl-heading)]">
                {t('supportPage.contactPage.orderNumber')}
                <input
                  value={form.orderNumber}
                  onChange={(event) => setForm((current) => ({ ...current, orderNumber: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[var(--gl-border)] bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--gl-accent-text)]"
                  placeholder={t('supportPage.common.optional')}
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-[var(--gl-heading)]">
              {t('supportPage.contactPage.message')}
              <textarea
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                className="mt-2 min-h-40 w-full rounded-[1.75rem] border border-[var(--gl-border)] bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--gl-accent-text)]"
                placeholder={t('supportPage.contactPage.messagePlaceholder')}
                required
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                {error}
              </div>
            ) : null}

            {receipt ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                  {t('supportPage.contactPage.successTitle', { referenceNumber: receipt.referenceNumber })}
                </p>
                <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                  {t('supportPage.contactPage.successBody', { topic: receipt.topic })}
                </p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full bg-[#22c55e] px-6 py-3 text-sm font-semibold text-[#042210] transition-colors hover:bg-[#35d76d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? t('supportPage.contactPage.submitting') : t('supportPage.contactPage.submit')}
            </button>
          </form>

          <div className="space-y-5">
            {[
              ['supportPage.contactPage.info1Title', 'supportPage.contactPage.info1Body'],
              ['supportPage.contactPage.info2Title', 'supportPage.contactPage.info2Body'],
              ['supportPage.contactPage.info3Title', 'supportPage.contactPage.info3Body'],
            ].map(([titleKey, bodyKey]) => (
              <div key={titleKey} className="rounded-3xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-5">
                <h3 className="font-semibold text-[var(--gl-heading)]">{t(titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t(bodyKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </main>
  );
}

function FaqPage() {
  const { t, i18n } = useTranslation();
  const locale = normalizeLang(i18n.resolvedLanguage ?? i18n.language);
  const [faqs, setFaqs] = useState<SupportFaq[]>([]);
  const [category, setCategory] = useState<string>(t('supportPage.common.all'));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCategory(t('supportPage.common.all'));
  }, [t]);

  useEffect(() => {
    let active = true;
    void fetchSupportFaqs(
      locale,
      category === t('supportPage.common.all') ? undefined : category,
    ).then((result) => {
      if (!active) return;
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setFaqs(result.data?.supportFaqs ?? []);
    });
    return () => {
      active = false;
    };
  }, [category, locale, t]);

  const categories = useMemo(() => {
    const values = new Set([t('supportPage.common.all')]);
    for (const faq of faqs) {
      values.add(faq.category);
    }
    return Array.from(values);
  }, [faqs, t]);

  return (
    <main className="flex-1">
      <SupportChrome
        slug="faqs"
        eyebrow={t('supportPage.faqPage.eyebrow')}
        title={t('supportPage.faqPage.title')}
        lead={t('supportPage.faqPage.lead')}
        aside={
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gl-accent-text)]">
              {t('supportPage.faqPage.asideTitle')}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {t('supportPage.faqPage.asideBody')}
            </p>
          </div>
        }
      />

      <Section title={t('supportPage.faqPage.browseTitle')}>
        <div className="flex flex-wrap gap-3">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                item === category
                  ? 'bg-[var(--gl-nav-active-bg)] text-[var(--gl-nav-active-text)]'
                  : 'bg-[var(--gl-surface-60)] text-slate-600 hover:bg-[var(--gl-hover)] dark:text-slate-300'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
            {error}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {faqs.map((faq) => (
              <article key={faq.id} className="rounded-3xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-[var(--gl-surface-60)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gl-accent-text)]">
                    {faq.category}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    {faq.audience}
                  </span>
                </div>
                <h2 className="mt-4 font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--gl-heading)]">
                  {faq.question}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>
        )}
      </Section>
    </main>
  );
}

function ShippingPage() {
  const { t } = useTranslation();
  return (
    <main className="flex-1">
      <SupportChrome
        slug="shipping"
        eyebrow={t('supportPage.shippingPage.eyebrow')}
        title={t('supportPage.shippingPage.title')}
        lead={t('supportPage.shippingPage.lead')}
        aside={
          <div className="space-y-4">
            {[
              ['supportPage.shippingPage.aside1Title', 'supportPage.shippingPage.aside1Body'],
              ['supportPage.shippingPage.aside2Title', 'supportPage.shippingPage.aside2Body'],
              ['supportPage.shippingPage.aside3Title', 'supportPage.shippingPage.aside3Body'],
            ].map(([titleKey, bodyKey]) => (
              <div key={titleKey}>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gl-accent-text)]">{t(titleKey)}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t(bodyKey)}</p>
              </div>
            ))}
          </div>
        }
      />

      <Section title={t('supportPage.shippingPage.howTitle')}>
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            ['supportPage.shippingPage.card1Title', 'supportPage.shippingPage.card1Body'],
            ['supportPage.shippingPage.card2Title', 'supportPage.shippingPage.card2Body'],
            ['supportPage.shippingPage.card3Title', 'supportPage.shippingPage.card3Body'],
          ].map(([titleKey, bodyKey]) => (
            <div key={titleKey} className="rounded-3xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6">
              <h2 className="font-semibold text-[var(--gl-heading)]">{t(titleKey)}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t(bodyKey)}</p>
            </div>
          ))}
        </div>
      </Section>

      <section className="border-y border-[var(--gl-border)] bg-[var(--gl-surface-60)] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-[var(--gl-border)] bg-[var(--gl-surface)] p-8">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--gl-heading)]">{t('supportPage.shippingPage.contactTitle')}</h2>
            <ul className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                'supportPage.shippingPage.point1',
                'supportPage.shippingPage.point2',
                'supportPage.shippingPage.point3',
                'supportPage.shippingPage.point4',
              ].map((itemKey) => (
                <li key={itemKey} className="rounded-2xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface-60)] px-4 py-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {t(itemKey)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}

function ReturnsPage() {
  const { t } = useTranslation();
  return (
    <main className="flex-1">
      <SupportChrome
        slug="returns"
        eyebrow={t('supportPage.returnsPage.eyebrow')}
        title={t('supportPage.returnsPage.title')}
        lead={t('supportPage.returnsPage.lead')}
        aside={
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gl-accent-text)]">{t('supportPage.returnsPage.asideTitle')}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {t('supportPage.returnsPage.asideBody')}
            </p>
          </div>
        }
      />

      <Section title={t('supportPage.returnsPage.qualifiesTitle')}>
        <div className="grid gap-6 md:grid-cols-2">
          {[
            ['supportPage.returnsPage.card1Title', 'supportPage.returnsPage.card1Body'],
            ['supportPage.returnsPage.card2Title', 'supportPage.returnsPage.card2Body'],
          ].map(([titleKey, bodyKey]) => (
            <div key={titleKey} className="rounded-3xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6">
              <h2 className="font-semibold text-[var(--gl-heading)]">{t(titleKey)}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t(bodyKey)}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t('supportPage.returnsPage.workflowTitle')}>
        <ol className="grid gap-5 lg:grid-cols-4">
          {[
            'supportPage.returnsPage.step1',
            'supportPage.returnsPage.step2',
            'supportPage.returnsPage.step3',
            'supportPage.returnsPage.step4',
          ].map((stepKey, index) => (
            <li key={stepKey} className="rounded-3xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gl-accent-text)]">
                {t('supportPage.returnsPage.stepLabel', { count: index + 1 })}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t(stepKey)}</p>
            </li>
          ))}
        </ol>
      </Section>
    </main>
  );
}

function SizeGuidePage() {
  const { t } = useTranslation();
  const rows = [
    ['supportPage.sizeRows.shoesCategory', 'supportPage.sizeRows.shoesFit', 'supportPage.sizeRows.shoesNote'],
    ['supportPage.sizeRows.polosCategory', 'supportPage.sizeRows.polosFit', 'supportPage.sizeRows.polosNote'],
    ['supportPage.sizeRows.pantsCategory', 'supportPage.sizeRows.pantsFit', 'supportPage.sizeRows.pantsNote'],
    ['supportPage.sizeRows.shortsCategory', 'supportPage.sizeRows.shortsFit', 'supportPage.sizeRows.shortsNote'],
    ['supportPage.sizeRows.glovesCategory', 'supportPage.sizeRows.glovesFit', 'supportPage.sizeRows.glovesNote'],
    ['supportPage.sizeRows.headwearCategory', 'supportPage.sizeRows.headwearFit', 'supportPage.sizeRows.headwearNote'],
  ];
  return (
    <main className="flex-1">
      <SupportChrome
        slug="size-guide"
        eyebrow={t('supportPage.sizeGuidePage.eyebrow')}
        title={t('supportPage.sizeGuidePage.title')}
        lead={t('supportPage.sizeGuidePage.lead')}
        aside={
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gl-accent-text)]">{t('supportPage.sizeGuidePage.asideTitle')}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {t('supportPage.sizeGuidePage.asideBody')}
            </p>
          </div>
        }
      />

      <Section title={t('supportPage.sizeGuidePage.tableTitle')}>
        <div className="overflow-hidden rounded-[2rem] border border-[var(--gl-border)] bg-[var(--gl-surface)]">
          <table className="min-w-full divide-y divide-[var(--gl-border)] text-left text-sm">
            <thead className="bg-[var(--gl-surface-60)] text-[var(--gl-heading)]">
              <tr>
                <th className="px-5 py-4 font-semibold">{t('supportPage.sizeGuidePage.tableCategory')}</th>
                <th className="px-5 py-4 font-semibold">{t('supportPage.sizeGuidePage.tableFit')}</th>
                <th className="px-5 py-4 font-semibold">{t('supportPage.sizeGuidePage.tableWatch')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--gl-border)]">
              {rows.map(([categoryKey, fitKey, noteKey]) => (
                <tr key={categoryKey}>
                  <td className="px-5 py-4 font-medium text-[var(--gl-heading)]">{t(categoryKey)}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{t(fitKey)}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{t(noteKey)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={t('supportPage.sizeGuidePage.checksTitle')}>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ['supportPage.sizeGuidePage.check1Title', 'supportPage.sizeGuidePage.check1Body'],
            ['supportPage.sizeGuidePage.check2Title', 'supportPage.sizeGuidePage.check2Body'],
            ['supportPage.sizeGuidePage.check3Title', 'supportPage.sizeGuidePage.check3Body'],
          ].map(([titleKey, bodyKey]) => (
            <div key={titleKey} className="rounded-3xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6">
              <h2 className="font-semibold text-[var(--gl-heading)]">{t(titleKey)}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t(bodyKey)}</p>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}

function localizeOrderStatus(status: string, t: (key: string) => string) {
  const normalized = status.toLowerCase();
  if (normalized === 'processing') return t('supportPage.common.processing');
  if (normalized === 'packed') return t('supportPage.common.packed');
  if (normalized === 'in transit') return t('supportPage.common.inTransit');
  if (normalized === 'delivered') return t('supportPage.common.delivered');
  return status;
}

function TrackOrderPage() {
  const { t, i18n } = useTranslation();
  const locale = normalizeLang(i18n.resolvedLanguage ?? i18n.language);
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<SupportOrderStatus | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);

    const result = await lookupSupportOrder(orderNumber.trim(), email.trim());
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setOrder(result.data?.supportOrderLookup ?? null);
  }

  return (
    <main className="flex-1">
      <SupportChrome
        slug="track-order"
        eyebrow={t('supportPage.trackPage.eyebrow')}
        title={t('supportPage.trackPage.title')}
        lead={t('supportPage.trackPage.lead')}
        aside={
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gl-accent-text)]">{t('supportPage.trackPage.asideTitle')}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {t('supportPage.trackPage.asideBody')}
            </p>
          </div>
        }
      />

      <Section title={t('supportPage.trackPage.lookupTitle')}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <form onSubmit={onSubmit} className="rounded-[2rem] border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6 sm:p-8">
            <label className="block text-sm font-medium text-[var(--gl-heading)]">
              {t('supportPage.trackPage.orderNumber')}
              <input
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--gl-border)] bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--gl-accent-text)]"
                placeholder={t('supportPage.trackPage.placeholder')}
                required
              />
            </label>
            <label className="mt-5 block text-sm font-medium text-[var(--gl-heading)]">
              {t('supportPage.trackPage.email')}
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--gl-border)] bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--gl-accent-text)]"
                required
              />
            </label>
            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                {error}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#22c55e] px-6 py-3 text-sm font-semibold text-[#042210] transition-colors hover:bg-[#35d76d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t('supportPage.trackPage.submitting') : t('supportPage.trackPage.submit')}
            </button>
          </form>

          <div className="rounded-[2rem] border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6 sm:p-8">
            {order ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-[var(--gl-nav-active-bg)] px-4 py-2 text-sm font-semibold text-[var(--gl-nav-active-text)]">
                    {localizeOrderStatus(order.status, t)}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {t('supportPage.trackPage.placed', { date: formatDate(order.placedAtIso, locale) })}
                  </span>
                </div>
                <h2 className="mt-5 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--gl-heading)]">
                  {order.orderNumber}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {t('supportPage.trackPage.shippingTo', {
                    method: order.shippingMethod.toLowerCase(),
                    city: order.deliveryCity,
                    region: order.deliveryRegion,
                    country: order.deliveryCountry,
                  })}
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {[
                    [t('supportPage.trackPage.payment'), order.paymentMethod],
                    [t('supportPage.trackPage.recipient'), order.deliveryName],
                    [t('supportPage.trackPage.total'), `$${order.total.toFixed(2)}`],
                  ].map(([title, body]) => (
                    <div key={String(title)} className="rounded-2xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface-60)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gl-accent-text)]">{title}</p>
                      <p className="mt-2 text-sm text-[var(--gl-heading)]">{body}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-2xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface-60)] px-4 py-4">
                      <div>
                        <p className="font-medium text-[var(--gl-heading)]">{item.brand} {item.name}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t('supportPage.trackPage.qty', { count: item.quantity })}</p>
                      </div>
                      <p className="text-sm font-semibold text-[var(--gl-heading)]">${item.lineTotal.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-56 items-center justify-center rounded-[1.5rem] border border-dashed border-[var(--gl-border)] bg-[var(--gl-surface-60)] px-6 text-center text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {t('supportPage.trackPage.empty')}
              </div>
            )}
          </div>
        </div>
      </Section>
    </main>
  );
}

function PolicyPage({ slug }: { slug: PolicySlug }) {
  const { t } = useTranslation();
  const prefix = slug === 'privacy' ? 'supportPage.privacyPage' : slug === 'terms' ? 'supportPage.termsPage' : 'supportPage.cookiesPage';
  return (
    <main className="flex-1">
      <SupportChrome
        slug={slug}
        eyebrow={t(`${prefix}.eyebrow`)}
        title={t(`${prefix}.title`)}
        lead={t(`${prefix}.lead`)}
        aside={
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gl-accent-text)]">{t('supportPage.policyAsideTitle')}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {t('supportPage.policyAsideBody')}
            </p>
          </div>
        }
      />

      <Section title={t('supportPage.common.policyDetails')}>
        <div className="space-y-5">
          {[
            [`${prefix}.section1Title`, `${prefix}.section1Body`],
            [`${prefix}.section2Title`, `${prefix}.section2Body`],
            [`${prefix}.section3Title`, `${prefix}.section3Body`],
          ].map(([titleKey, bodyKey]) => (
            <article key={titleKey} className="rounded-3xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6 sm:p-8">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--gl-heading)]">
                {t(titleKey)}
              </h2>
              <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {t(bodyKey)}
              </p>
            </article>
          ))}
        </div>
      </Section>
    </main>
  );
}

export default function SupportPageView({ slug }: Props) {
  if (slug === 'home') return <SupportHomePage />;
  if (slug === 'contact') return <ContactPage />;
  if (slug === 'faqs') return <FaqPage />;
  if (slug === 'shipping') return <ShippingPage />;
  if (slug === 'returns') return <ReturnsPage />;
  if (slug === 'size-guide') return <SizeGuidePage />;
  if (slug === 'track-order') return <TrackOrderPage />;
  if (slug === 'privacy' || slug === 'terms' || slug === 'cookies') {
    return <PolicyPage slug={slug} />;
  }
  return null;
}
