"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string; exact?: boolean };

const links: NavLink[] = [
  { href: "/settings", label: "Overview", exact: true },
  { href: "/settings/account", label: "Account" },
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/preferences", label: "Preferences" },
  { href: "/settings/notifications", label: "Notifications" },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-zinc-200 pb-4 dark:border-zinc-800"
      aria-label="Settings sections"
    >
      {links.map(({ href, label, exact: exactMatch }) => {
        const active = isActive(pathname, href, exactMatch);
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
