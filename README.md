# Campus Study App

Next.js study platform prototype with a complete settings experience for students across campuses in the U.S.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- `next-themes` for light/dark/system theme switching

## Implemented Features

### Global app/theme infrastructure

- Added app-level providers in `components/providers.tsx`
- Integrated `next-themes` via `components/theme-provider.tsx`
- Updated `app/layout.tsx` to use:
  - `suppressHydrationWarning` on `<html>`
  - global providers wrapper
  - semantic body theme classes (`bg-background`, `text-foreground`)
- Updated `app/globals.css` to:
  - use class-based dark mode variables (`.dark`)
  - keep theme tokens centralized via CSS variables
  - switch body font to the configured Geist sans variable

### Settings area (multi-page)

- Added shared settings layout and nav:
  - `app/settings/layout.tsx`
  - `components/settings/settings-nav.tsx`
- Added settings hub page:
  - `app/settings/page.tsx`
  - quick links + current profile snapshot

### Account settings

Implemented in `app/settings/account/page.tsx`:

- Change password form with validation:
  - minimum length check
  - confirm password match check
  - safe demo behavior (no password storage)
- Update email flow with 2-step verification UX:
  - step 1: enter new email + validation
  - step 2: enter 6-digit verification code
  - successful verification persists updated email locally
- Cancel verification now fully resets the flow (including the email input field)

### Profile settings

Implemented in `app/settings/profile/page.tsx`:

- Edit display name
- Edit bio
- Change campus from U.S. campus list
- Upload profile photo and banner image
- Preview avatar/banner immediately in UI
- Image size guard for local storage safety

### Preferences settings

Implemented in `app/settings/preferences/page.tsx`:

- Theme preference:
  - Light
  - Dark
  - System
- Default study mode:
  - Focus
  - Group
  - Review

### Notification settings

Implemented in `app/settings/notifications/page.tsx`:

- Toggle switches for:
  - Study reminders
  - Group activity
  - Campus announcements
  - Quiet hours

### Settings data model + persistence

Added under `lib/settings/` and `components/settings/`:

- `lib/settings/types.ts` for the strongly-typed `UserSettings` model
- `lib/settings/storage.ts` for `localStorage` load/save utilities
- `lib/settings/constants.ts` for storage key and shared constants
- `lib/settings/campuses.ts` for campus catalog and labels
- `lib/settings/image.ts` for safe image-to-dataURL conversion
- `components/settings/settings-provider.tsx` for app-wide settings state and updates

### Home page integration

- Added a visible **Settings** entry point on `app/page.tsx` linking to `/settings`

## Routes

- `/` Home
- `/settings` Settings overview
- `/settings/account` Account settings
- `/settings/profile` Profile settings
- `/settings/preferences` Preferences settings
- `/settings/notifications` Notification settings

## Local Development

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Current Scope Notes

- This is an MVP with client-side persistence (`localStorage`), intended for coursework/prototyping.
- Email verification is simulated with a 6-digit code UX (no real mail service yet).
- Password updates are UI-level demo behavior and intentionally do not store real credentials.
- A production version should connect auth + backend APIs (e.g., Auth.js/Clerk/Firebase + DB).