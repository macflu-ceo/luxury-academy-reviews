import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/store";
import ReviewArticle from "../components/ReviewArticle";

// 방문자마다 저장소를 읽으면 트래픽이 몰릴 때 저장소 한도부터 터진다.
// 60초 캐시: 어드민에서 고치면 최대 1분 뒤에 반영된다.
export const revalidate = 60;

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
