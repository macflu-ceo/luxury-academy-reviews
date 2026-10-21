/**
 * 어드민에 붙여넣은 영상 주소를 임베드용으로 바꾼다.
 * 유튜브(일반·단축·쇼츠·임베드)와 비메오를 알아본다.
 */
export type Video = {
  provider: "youtube" | "vimeo";
  id: string;
  /** iframe src */
  embedUrl: string;
  /** 링크 미리보기에 쓸 썸네일 (없으면 빈 문자열) */
  thumbnail: string;
};

const YOUTUBE_ID = /^[\w-]{11}$/;

export function parseVideo(raw: string): Video | null {
  const input = (raw || "").trim();
  if (!input) return null;

  // 주소가 아니라 영상 아이디만 붙여넣은 경우
  if (YOUTUBE_ID.test(input)) return youtube(input);

  let url: URL;
  try {
    url = new URL(input.startsWith("http") ? input : `https://${input}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be") {
    return parts[0] && YOUTUBE_ID.test(parts[0]) ? youtube(parts[0]) : null;
  }
  if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
    const v = url.searchParams.get("v");
    if (v && YOUTUBE_ID.test(v)) return youtube(v);
    // /embed/ID, /shorts/ID, /live/ID, /v/ID
    const id = parts.length > 1 ? parts[1] : "";
    return YOUTUBE_ID.test(id) ? youtube(id) : null;
  }
  if (host.endsWith("vimeo.com")) {
    const id = parts.find((p) => /^\d+$/.test(p));
    return id
      ? {
          provider: "vimeo",
          id,
          embedUrl: `https://player.vimeo.com/video/${id}?dnt=1&playsinline=1`,
          thumbnail: "",
        }
      : null;
  }
  return null;
}

function youtube(id: string): Video {
  const params = new URLSearchParams({
    rel: "0", // 끝나고 남의 영상 추천하지 않도록
    modestbranding: "1",
    playsinline: "1", // 아이폰에서 전체화면으로 튀지 않게
  });
  return {
    provider: "youtube",
    id,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?${params}`,
    thumbnail: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
  };
}
