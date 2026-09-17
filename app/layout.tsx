import type { Metadata } from "next";
import "./globals.css";

/** 미리보기 이미지·주소를 절대주소로 만들 기준. 운영에서는 Vercel 이 넣어 준다. */
function siteUrl(): URL {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return new URL(host ? `https://${host}` : "http://localhost:3111");
}

// 제목·설명·미리보기 이미지는 페이지마다 generateMetadata 에서 정한다.
export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: "명품창업사관학교 후기",
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
