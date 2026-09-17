import type { Metadata } from "next";
import { Page, shareDescription, shareImage } from "./types";

/** 후기 페이지 하나의 링크 미리보기(오픈그래프·트위터) 정보 */
export function pageMetadata(page: Page, path: string): Metadata {
  const title = page.title || "명품창업사관학교";
  const description = shareDescription(page);
  const image = shareImage(page);

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: "article",
      siteName: "명품창업사관학교",
      locale: "ko_KR",
      images: image ? [{ url: image, alt: title }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
