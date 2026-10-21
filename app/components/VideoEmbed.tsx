import { parseVideo } from "@/lib/video";

/**
 * 영상 임베드.
 * 문의 폼과 같은 트리에 있지만 상태가 없는 서버 컴포넌트라, 폼을 채우거나 제출해도
 * 이 iframe 은 다시 그려지지 않는다. 즉 영상이 끊기지 않는다.
 */
export default function VideoEmbed({ url, caption }: { url: string; caption?: string }) {
  const video = parseVideo(url);
  if (!video) return null;

  return (
    <section className="video">
      <div className="video-frame">
        <iframe
          src={video.embedUrl}
          title={caption || "영상"}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      {caption ? <p className="video-caption">{caption}</p> : null}
    </section>
  );
}
