import { notFound } from "next/navigation";
import { getLatestPage } from "@/lib/store";
import ReviewArticle from "./components/ReviewArticle";

// 페이지 캐시(ISR)를 쓰면 백그라운드 갱신 중 저장소 읽기가 막혀 비상 화면이 캐시된다.
// 매 요청 렌더하고, 저장소 읽기는 lib/store.ts 의 메모리 캐시로 줄인다.
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const page = await getLatestPage();
  return { title: page?.title || "후기", description: page?.lead || "" };
}

/** 주소 없이 들어오면 가장 최근에 저장한 후기 페이지를 보여준다. */
export default async function Home() {
  const page = await getLatestPage();
  if (!page) notFound();
  return <ReviewArticle page={page} />;
}
