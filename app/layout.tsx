import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GUXON 新品專案管理",
  description: "GUXON 新品上市專案管理系統",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
