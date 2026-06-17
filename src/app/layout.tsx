import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { AuthGuard } from "@/components/layout/auth-guard";

export const metadata: Metadata = {
  title: {
    default: "StartupOS — Business Operating System",
    template: "%s | StartupOS",
  },
  description:
    "The unified CRM and Project Management platform. Manage leads, deals, projects and tasks without context switching.",
  keywords: ["CRM", "project management", "SaaS", "business operating system"],
  authors: [{ name: "StartupOS" }],
  creator: "StartupOS",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "StartupOS",
    description: "The unified CRM and Project Management platform.",
    siteName: "StartupOS",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="darkreader-lock" content="true" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <AuthGuard>{children}</AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
