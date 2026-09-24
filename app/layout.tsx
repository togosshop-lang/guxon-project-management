import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "GUXON 新品專案管理",
  description: "GUXON 新品上市專案管理系統",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>
        <Link
          href="/strategy"
          aria-label="AI 新品策略"
          style={{
            position: "fixed",
            right: 18,
            bottom: 18,
            zIndex: 1000,
            padding: "10px 14px",
            borderRadius: 999,
            background: "#324BAA",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 8px 24px rgba(0,0,0,.16)",
          }}
        >
          AI 新品策略
        </Link>
        {children}
      </body>
    </html>
  );
}
