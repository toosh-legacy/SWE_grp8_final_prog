/**
 * Account settings — password form (demo / client-side only).
 * Shared with tests so rules stay aligned with the Account settings page.
 */
export const ACCOUNT_PASSWORD_ERR_TOO_SHORT =
  "New password must be at least 8 characters." as const;
export const ACCOUNT_PASSWORD_ERR_MISMATCH =
  "New password and confirmation do not match." as const;
export const ACCOUNT_PASSWORD_OK_DEMO =
  "Password updated (demo only — connect a real auth API in production)." as const;

export type AccountPasswordFormMessage = {
  type: "ok" | "err";
  text: string;
};

/**
 * @param newPassword    proposed new password
 * @param confirmPassword must match newPassword when length ≥ 8
 */
export function validateAccountPasswordForm(
  newPassword: string,
  confirmPassword: string,
): AccountPasswordFormMessage {
  if (newPassword.length < 8) {
    return { type: "err", text: ACCOUNT_PASSWORD_ERR_TOO_SHORT };
  }
  if (newPassword !== confirmPassword) {
    return { type: "err", text: ACCOUNT_PASSWORD_ERR_MISMATCH };
  }
  return { type: "ok", text: ACCOUNT_PASSWORD_OK_DEMO };
}
