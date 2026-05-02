import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "@/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus Connect",
  description: "Connect with friends and campus",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
