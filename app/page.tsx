import { notFound } from "next/navigation";
import { getLatestPage } from "@/lib/store";
import ReviewArticle from "./components/ReviewArticle";

export const revalidate = 60;

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
