/**
 * One-time / maintenance: maps hardcoded hex classes in App.tsx to CSS variables
 * so light/dark themes work. Run: node scripts/apply-theme-vars.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appPath = path.join(__dirname, '..', 'src', 'App.tsx');

/** Longest keys first */
const pairs = [
  ['focus-visible:ring-offset-[#07150d]', 'focus-visible:ring-offset-[var(--gl-surface)]'],
  ['focus-visible:ring-offset-[#0a1c13]', 'focus-visible:ring-offset-[var(--gl-card)]'],
  ['ring-offset-[#020603]', 'ring-offset-[var(--gl-page)]'],
  ['ring-offset-[#050705]', 'ring-offset-[var(--gl-page)]'],
  ['from-[#07150d]/90', 'from-[var(--gl-surface-90)]'],
  ['bg-[#07150d]/95', 'bg-[var(--gl-surface-95)]'],
  ['bg-[#07150d]/90', 'bg-[var(--gl-surface-90)]'],
  ['bg-[#07150d]/70', 'bg-[var(--gl-surface-70)]'],
  ['bg-[#07150d]/60', 'bg-[var(--gl-surface-60)]'],
  ['bg-[#07150d]/30', 'bg-[var(--gl-surface-30)]'],
  ['bg-[#050705]/95', 'bg-[var(--gl-header-bg)]'],
  ['border-[#173626]', 'border-[var(--gl-border)]'],
  ['border-[#123224]', 'border-[var(--gl-border-strong)]'],
  ['border-[#12422a]', 'border-[var(--gl-header-border)]'],
  ['border-[#1f3d2d]', 'border-[var(--gl-border-soft)]'],
  ['border-[#325748]', 'border-[var(--gl-border-accent)]'],
  ['border-[#234d3a]', 'border-[var(--gl-border-card)]'],
  ['border-[#1a3024]', 'border-[var(--gl-border-muted)]'],
  ['border-[#1c4a34]', 'border-[var(--gl-border-card)]'],
  ['border-[#1e4a35]', 'border-[var(--gl-border)]'],
  ['border-[#143124]', 'border-[var(--gl-border-strong)]'],
  ['border-[#213f6f]', 'border-[var(--gl-border)]'],
  ['border-[#274c84]', 'border-[var(--gl-border)]'],
  ['border-[#2a4d38]', 'border-[var(--gl-border-soft)]'],
  ['border-[#54471f]', 'border-[var(--gl-border)]'],
  ['hover:bg-[#0d1711]', 'hover:bg-[var(--gl-hover)]'],
  ['hover:bg-[#0b1a13]', 'hover:bg-[var(--gl-raised)]'],
  ['hover:bg-[#0c1f15]', 'hover:bg-[var(--gl-raised2)]'],
  ['hover:bg-[#163424]', 'hover:bg-[var(--gl-hover)]'],
  ['hover:bg-[#10261a]', 'hover:bg-[var(--gl-hover)]'],
  ['bg-[#07150d]', 'bg-[var(--gl-surface)]'],
  ['bg-[#020603]', 'bg-[var(--gl-page)]'],
  ['bg-[#030a06]', 'bg-[var(--gl-deep)]'],
  ['bg-[#0a1c13]', 'bg-[var(--gl-card)]'],
  ['bg-[#0a120e]', 'bg-[var(--gl-surface-muted)]'],
  ['bg-[#050b08]', 'bg-[var(--gl-drawer)]'],
  ['bg-[#0a120d]', 'bg-[var(--gl-input-bg)]'],
  ['bg-[#0d1711]', 'bg-[var(--gl-hover)]'],
  ['bg-[#13281c]', 'bg-[var(--gl-raised)]'],
  ['bg-[#163424]', 'bg-[var(--gl-hover)]'],
  ['bg-[#062412]', 'bg-[var(--gl-deep)]'],
  ['bg-[#061208]', 'bg-[var(--gl-page-deep)]'],
  ['bg-[#050a08]', 'bg-[var(--gl-page-deep)]'],
  ['bg-[#0e2a1d]', 'bg-[var(--gl-surface)]'],
  ['bg-[#0b2015]', 'bg-[var(--gl-card)]'],
  ['bg-[#0e2419]', 'bg-[var(--gl-tile-from)]'],
  ['to-[#020603]', 'to-[var(--gl-page)]'],
  ['to-[#050a08]', 'to-[var(--gl-page-deep)]'],
  ['from-[#020603]', 'from-[var(--gl-page)]'],
  ['via-[#020603]', 'via-[var(--gl-page)]'],
  ['from-[#07150d]', 'from-[var(--gl-surface)]'],
  ['via-[#07150d]', 'via-[var(--gl-surface)]'],
  ['from-[#0d1f15]', 'from-[var(--gl-hero-from)]'],
  ['from-[#0e2419]', 'from-[var(--gl-tile-from)]'],
  ['from-[#0b2015]', 'from-[var(--gl-hero-from)]'],
  ['to-[#0e2a1d]', 'to-[var(--gl-surface)]'],
  ['to-[#061208]', 'to-[var(--gl-tile-to)]'],
];

let s = fs.readFileSync(appPath, 'utf8');
const original = s;

for (const [a, b] of pairs) {
  if (!s.includes(a)) continue;
  const parts = s.split(a);
  const n = parts.length - 1;
  if (n > 0) {
    console.log(n, a.slice(0, 48) + (a.length > 48 ? '…' : ''));
  }
  s = parts.join(b);
}

if (s === original) {
  console.log('No changes applied (already patched or patterns missing).');
} else {
  fs.writeFileSync(appPath, s);
  console.log('Updated', appPath);
}
