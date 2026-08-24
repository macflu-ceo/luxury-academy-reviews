import { notFound } from "next/navigation";
import { getLatestPage } from "@/lib/store";
import ReviewArticle from "./components/ReviewArticle";

// 어드민에서 저장하면 바로 반영되도록 매 요청마다 그린다.
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
