import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "固定版型海報產生器",
  description: "選版型、填資料，同步預覽並下載目前或全部變體的固定版型海報工具。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
