/**
 * password-validation.test.ts - Campus Connect Settings
 * Test Class: Account — Change password (TypeScript)
 *
 * Framework: Vitest
 * Module:    lib/settings/password-validation.ts
 *
 * ---------------------------------------------------------------------------
 * FIG P1 - INPUT VALUE ANALYSIS
 * ---------------------------------------------------------------------------
 *
 * validateAccountPasswordForm(newPassword, confirmPassword)
 * +-----------------+------------------+------------------+------------------+
 * | Variable        | Valid            | Invalid          | Exceptional     |
 * +-----------------+------------------+------------------+-----------------+
 * | newPassword     | len >= 8, any    | len < 8          | empty string    |
 * | confirmPassword | equals new       | differs          | empty string    |
 * +-----------------+------------------+------------------+-----------------+
 *
 * Order of checks (matches Account page): length first, then equality.
 *
 * ---------------------------------------------------------------------------
 * FIG P2 - TEST CASE SCENARIOS
 * ---------------------------------------------------------------------------
 *
 * validateAccountPasswordForm() - 4 scenarios
 * +------+-------------------------------------------------------------------+
 * | TC # | Scenario -> Expected Output                                       |
 * +------+-------------------------------------------------------------------+
 * | PV1  | len >= 8 and passwords match -> type ok, demo success text        |
 * | PV2  | newPassword too short -> type err, too-short text                 |
 * | PV3  | newPassword long enough but mismatch -> type err, mismatch text |
 * | PV4  | empty newPassword -> type err, too-short text                     |
 * +------+-------------------------------------------------------------------+
 */
import { describe, expect, it } from "vitest";
import {
  ACCOUNT_PASSWORD_ERR_MISMATCH,
  ACCOUNT_PASSWORD_ERR_TOO_SHORT,
  ACCOUNT_PASSWORD_OK_DEMO,
  validateAccountPasswordForm,
} from "./password-validation";

describe("validateAccountPasswordForm()", () => {
  it("PV1 | len >= 8 and match -> type ok and demo success message", () => {
    const result = validateAccountPasswordForm("secure-8", "secure-8");
    expect(result).toEqual({ type: "ok", text: ACCOUNT_PASSWORD_OK_DEMO });
  });

  it("PV2 | new password too short -> err too short", () => {
    const result = validateAccountPasswordForm("short1", "short1");
    expect(result).toEqual({ type: "err", text: ACCOUNT_PASSWORD_ERR_TOO_SHORT });
  });

  it("PV3 | long enough but confirmation mismatch -> err mismatch (not too short)", () => {
    const result = validateAccountPasswordForm("longenuf1", "longenuf2");
    expect(result).toEqual({ type: "err", text: ACCOUNT_PASSWORD_ERR_MISMATCH });
  });

  it("PV4 | empty new password -> err too short", () => {
    const result = validateAccountPasswordForm("", "");
    expect(result).toEqual({ type: "err", text: ACCOUNT_PASSWORD_ERR_TOO_SHORT });
  });
});
