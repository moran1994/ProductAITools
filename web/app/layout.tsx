import type { Metadata } from "next";
import { Syne, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "产品经理AI空间站",
  description: "按节点执行的产品管理流程工作台，支持接入 LLM。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${syne.variable} ${plex.variable}`}>
      <body
        style={
          {
            ["--font-display" as string]: "var(--font-syne), system-ui, sans-serif",
            ["--font-body" as string]: "var(--font-plex), system-ui, sans-serif",
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
