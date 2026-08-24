# 후기 페이지 (명품창업사관학교)

문자로 보내는 한 장짜리 후기 페이지. 위에서 아래로 읽는 블로그 글 형태이고,
맨 아래에 상담신청 폼이 붙어 있다. 내용은 전부 `/admin`에서 쓴다.

## 화면

| 주소 | 설명 |
| --- | --- |
| `/` | 문자로 보낼 후기 페이지 (공개) |
| `/admin` | 후기 내용 편집 (비밀번호 필요) |
| `/admin/consults` | 상담신청 목록 (비밀번호 필요) |
| `/admin/login` | 관리자 로그인 |

`/`에는 관리자 링크가 없다. 문자를 받은 사람은 어드민이 있는지 알 수 없다.

## 로컬에서 실행

```bash
npm install
cp .env.example .env.local   # ADMIN_PASSWORD, SESSION_SECRET 만 채우면 됨
npm run dev
```

`http://localhost:3000` 이 후기 페이지, `http://localhost:3000/admin` 이 관리자다.

로컬에서는 저장소 설정 없이 바로 돌아간다. 후기 내용과 상담신청은 `.data/` 폴더에,
업로드한 사진은 `public/uploads/` 에 저장된다. 둘 다 git에 올라가지 않는다.

## Vercel 배포

1. 이 폴더를 GitHub에 올린다.
2. Vercel에서 New Project → 그 레포를 선택 → Deploy.
3. Settings → Environment Variables 에 두 개를 넣는다.
   - `ADMIN_PASSWORD` — 관리자 비밀번호
   - `SESSION_SECRET` — 아무 긴 문자열 (`openssl rand -base64 32`)
4. Storage 탭 → **Blob** 스토어를 만들어 이 프로젝트에 연결한다.
   `BLOB_READ_WRITE_TOKEN` 이 자동으로 주입된다.
5. 다시 Deploy.

Blob 스토어를 연결해야 후기 내용·상담신청·사진이 저장된다. Vercel은 파일 시스템이
읽기 전용이라 로컬 방식(`.data/`)이 동작하지 않는다.

## 데이터

| 항목 | 저장 위치 |
| --- | --- |
| 후기 내용 (제목·소개·후기글·폼 설정) | Blob `reviews/data/content-*.json` |
| 상담신청 (이름·전화번호·자본금 규모) | Blob `reviews/data/consults-*.json` |
| 업로드한 사진 | Blob `reviews/images/*` |

구글시트로 옮기려면 `lib/store.ts` 의 네 함수
(`getContent` / `saveContent` / `addConsult` / `listConsults`) 만 바꿔 끼우면 된다.
나머지 코드는 손댈 필요가 없다.

## 후기글 한 개의 구성

- 제목
- 사진 (선택)
- 공급가 / 정가 / 마진 (선택) — 셋 다 비우면 그 후기에는 금액이 표시되지 않는다.
  마진을 비워두면 정가에서 공급가를 뺀 값이 자동으로 들어간다.
- 내용 — 빈 줄 하나로 문단이 나뉜다.

## 상담신청 폼

이름 · 전화번호 · 자본금 규모(드롭다운) · 개인정보 수집 동의.
자본금 선택지는 `/admin` 에서 한 줄에 하나씩 자유롭게 바꾼다. 기본값은
1천만원 / 3천만원 / 5천만원 / 1억.
