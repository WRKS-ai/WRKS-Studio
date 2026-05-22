"use client";

import { motion } from "motion/react";

type Provider = "google" | "apple";

export function OAuthButton({
  provider,
  label,
  onClick,
}: {
  provider: Provider;
  label: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      className="group relative w-full h-11 rounded-[10px] border border-white/[0.10] bg-white/[0.02] hover:border-white/[0.22] hover:bg-white/[0.04] transition-colors text-[14px] font-sans font-medium text-ink flex items-center justify-center gap-2.5"
    >
      <ProviderIcon provider={provider} />
      {label}
    </motion.button>
  );
}

export function OAuthRow({
  onGoogle,
  onApple,
}: {
  onGoogle?: () => void;
  onApple?: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <CompactOAuthButton provider="google" label="Google" onClick={onGoogle} />
      <CompactOAuthButton provider="apple" label="Apple" onClick={onApple} />
    </div>
  );
}

function CompactOAuthButton({
  provider,
  label,
  onClick,
}: {
  provider: Provider;
  label: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      className="group relative h-11 rounded-[10px] border border-white/[0.10] bg-white/[0.02] hover:border-white/[0.22] hover:bg-white/[0.04] transition-colors text-[13.5px] font-sans font-medium text-ink flex items-center justify-center gap-2"
    >
      <ProviderIcon provider={provider} />
      {label}
    </motion.button>
  );
}

function ProviderIcon({ provider }: { provider: Provider }) {
  if (provider === "google") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="#4285F4"
          d="M22.5 12.27c0-.76-.07-1.49-.2-2.18H12v4.13h5.88a5.04 5.04 0 0 1-2.18 3.3v2.74h3.52c2.06-1.9 3.28-4.7 3.28-7.99z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.95 0 5.42-.98 7.22-2.66l-3.52-2.74c-.98.66-2.23 1.05-3.7 1.05-2.84 0-5.25-1.92-6.1-4.5H2.24v2.82A11 11 0 0 0 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.9 14.15a6.62 6.62 0 0 1 0-4.3V7.03H2.24a11 11 0 0 0 0 9.94l3.66-2.82z"
        />
        <path
          fill="#EA4335"
          d="M12 5.7c1.6 0 3.04.55 4.18 1.63l3.12-3.12C17.41 2.42 14.95 1.5 12 1.5A11 11 0 0 0 2.24 7.03l3.66 2.82C6.75 7.62 9.16 5.7 12 5.7z"
        />
      </svg>
    );
  }
  return (
    <svg
      width="14"
      height="16"
      viewBox="0 0 14 16"
      fill="currentColor"
      aria-hidden
    >
      <path d="M11.4 8.5c0-2 1.6-2.95 1.67-3-.91-1.33-2.33-1.51-2.83-1.53-1.2-.12-2.35.71-2.96.71-.62 0-1.56-.69-2.57-.67-1.32.02-2.54.77-3.22 1.95-1.38 2.38-.35 5.9 1 7.84.66.95 1.43 2.02 2.45 1.98 1-.04 1.36-.64 2.56-.64 1.19 0 1.52.64 2.56.62 1.06-.02 1.73-.96 2.37-1.92.75-1.1 1.06-2.17 1.07-2.22-.02-.01-2.05-.78-2.07-3.1zM9.45 2.8c.54-.65.9-1.55.8-2.45-.78.03-1.71.52-2.27 1.17-.5.57-.94 1.5-.82 2.38.87.07 1.76-.44 2.29-1.1z" />
    </svg>
  );
}
