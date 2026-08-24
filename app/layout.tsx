import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "명품창업사관학교 후기",
  description: "먼저 시작한 분들이 남긴 기록입니다.",
  openGraph: {
    title: "명품창업사관학교 후기",
    description: "먼저 시작한 분들이 남긴 기록입니다.",
    type: "article",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
