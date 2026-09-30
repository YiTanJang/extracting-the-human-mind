"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold leading-snug">{children}</h1>
      {sub && <p className="mt-2 text-muted">{sub}</p>}
    </header>
  );
}

export function Card({ children, tone = "paper" }: { children: ReactNode; tone?: "paper" | "sage" | "warm" }) {
  const tones = { paper: "bg-paper border-line", sage: "bg-sage-soft border-sage/30", warm: "bg-warm-soft border-warm/30" };
  return <section className={`mb-4 rounded-2xl border p-5 ${tones[tone]}`}>{children}</section>;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "quiet" | "warm" }) {
  const variants = {
    primary: "bg-sage text-white hover:brightness-110 disabled:bg-line disabled:text-muted",
    quiet: "bg-transparent text-charcoal border border-line hover:bg-paper",
    warm: "bg-warm text-white hover:brightness-110 disabled:bg-line disabled:text-muted",
  };
  return (
    <button
      className={`min-h-11 rounded-xl px-5 py-3 font-medium transition disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

/** Bottom-fixed action area for one-handed use (ui_ux_guidelines §8). */
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-line bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-xl gap-3 px-5 py-4">{children}</div>
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-4 py-3">
      <span className="flex-1">
        <span className="block font-medium">{label}</span>
        {description && <span className="mt-1 block text-sm text-muted">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-sage" : "bg-line"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-6" : "left-1"}`}
        />
      </button>
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete = "off",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="min-h-11 w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:border-sage"
      />
    </label>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mb-4 rounded-xl bg-warm-soft px-4 py-3 text-sm text-charcoal">
      {message}
    </p>
  );
}

export function NavLinks() {
  return (
    <nav className="mt-8 flex flex-wrap gap-4 text-sm text-muted">
      <Link href="/home" className="underline-offset-4 hover:underline">
        홈
      </Link>
      <Link href="/me" className="underline-offset-4 hover:underline">
        내 데이터
      </Link>
      <Link href="/help" className="underline-offset-4 hover:underline">
        힘들 때
      </Link>
    </nav>
  );
}
