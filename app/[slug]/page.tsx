import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/store";
import ReviewArticle from "../components/ReviewArticle";

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
