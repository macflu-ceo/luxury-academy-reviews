import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/store";
import ReviewArticle from "../components/ReviewArticle";

// 페이지 캐시(ISR)를 쓰면 백그라운드 갱신 중 저장소 읽기가 막혀 비상 화면이 캐시된다.
// 매 요청 렌더하고, 저장소 읽기는 lib/store.ts 의 메모리 캐시로 줄인다.
export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props) {
  const page = await getPageBySlug(decodeURIComponent(params.slug));
  if (!page) return { title: "후기를 찾을 수 없습니다" };
  return { title: page.title, description: page.lead };
}

export default async function SlugPage({ params }: Props) {
  const page = await getPageBySlug(decodeURIComponent(params.slug));
  if (!page) notFound();
  return <ReviewArticle page={page} />;
}
