"use client";

import { useState } from "react";
import { useSettings } from "@/components/settings/settings-provider";
import { EMAIL_VERIFICATION_CODE_LENGTH } from "@/lib/settings/constants";
import { validateAccountPasswordForm } from "@/lib/settings/password-validation";

export default function AccountSettingsPage() {
  const { settings, update } = useSettings();
  const verificationCodePattern = new RegExp(
    `^\\d{${EMAIL_VERIFICATION_CODE_LENGTH}}$`,
  );
  const verificationCodePlaceholder = "0".repeat(EMAIL_VERIFICATION_CODE_LENGTH);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [emailStep, setEmailStep] = useState<"idle" | "verify">("idle");
  const [pendingEmail, setPendingEmail] = useState("");
  const [code, setCode] = useState("");
  const [emailMessage, setEmailMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);
    const result = validateAccountPasswordForm(newPassword, confirmPassword);
    setPasswordMessage(result);
    if (result.type === "err") return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  function requestEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailMessage(null);
    const trimmed = newEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailMessage({ type: "err", text: "Enter a valid email address." });
      return;
    }
    setPendingEmail(trimmed);
    setEmailStep("verify");
    setCode("");
    setEmailMessage({
      type: "ok",
      text: `Demo: we didn’t send a real email. Enter any ${EMAIL_VERIFICATION_CODE_LENGTH}-digit code to confirm.`,
    });
  }

  function confirmEmailWithCode(e: React.FormEvent) {
    e.preventDefault();
    setEmailMessage(null);
    if (!verificationCodePattern.test(code)) {
      setEmailMessage({
        type: "err",
        text: `Enter a ${EMAIL_VERIFICATION_CODE_LENGTH}-digit verification code.`,
      });
      return;
    }
    update({ email: pendingEmail });
    setEmailStep("idle");
    setNewEmail("");
    setPendingEmail("");
    setCode("");
    setEmailMessage({
      type: "ok",
      text: "Email updated and saved locally.",
    });
  }

  function cancelEmailChange() {
    setEmailStep("idle");
    setNewEmail("");
    setPendingEmail("");
    setCode("");
    setEmailMessage(null);
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Change password</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          For this course build, submitting only validates input. Production would
          call your auth server — never store real passwords in the browser.
        </p>
        <form onSubmit={handlePasswordSubmit} className="mt-6 flex max-w-md flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Current password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              New password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Confirm new password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </label>
          {passwordMessage ? (
            <p
              className={
                passwordMessage.type === "ok"
                  ? "text-sm text-emerald-600 dark:text-emerald-400"
                  : "text-sm text-red-600 dark:text-red-400"
              }
              role="status"
            >
              {passwordMessage.text}
            </p>
          ) : null}
          <button
            type="submit"
            className="mt-2 w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Update password
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Update email</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Current:{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {settings.email || "Not set"}
          </span>
        </p>

        {emailStep === "verify" ? (
          <form
            onSubmit={confirmEmailWithCode}
            className="mt-6 flex max-w-md flex-col gap-4"
          >
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Confirming <strong>{pendingEmail}</strong>
            </p>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Verification code
              </span>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={EMAIL_VERIFICATION_CODE_LENGTH}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder={verificationCodePlaceholder}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-zinc-900 tracking-widest dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </label>
            {emailMessage ? (
              <p
                className={
                  emailMessage.type === "ok"
                    ? "text-sm text-emerald-600 dark:text-emerald-400"
                    : "text-sm text-red-600 dark:text-red-400"
                }
                role="status"
              >
                {emailMessage.text}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Verify and save
              </button>
              <button
                type="button"
                onClick={cancelEmailChange}
                className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={requestEmailChange} className="mt-6 flex max-w-md flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                New email
              </span>
              <input
                type="email"
                autoComplete="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </label>
            {emailMessage ? (
              <p
                className={
                  emailMessage.type === "ok"
                    ? "text-sm text-emerald-600 dark:text-emerald-400"
                    : "text-sm text-red-600 dark:text-red-400"
                }
                role="status"
              >
                {emailMessage.text}
              </p>
            ) : null}
            <button
              type="submit"
              className="w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Continue to verification
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
