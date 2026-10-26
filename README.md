# 박우영 · Game Client Developer

Unity 게임·VR 클라이언트 개발 포트폴리오. 빌드 도구 없이 동작하는 HTML/CSS/JavaScript 사이트입니다.

## 구성

- `index.html`: 소개, 프로젝트, 기술 사례, 경력, 다운로드, 연락처
- `gallery.js`: 프로젝트 이미지 팝업, 이미지 사전 디코딩·캐시, 닫기와 포커스 복귀
- `style.css`: 반응형 레이아웃, 키보드 포커스, 모션 감소 및 인쇄 스타일
- `assets/`: 제공된 포트폴리오 PDF에서 추출한 실제 프로젝트 화면
- `downloads/`: 원본 이력서·포트폴리오 PDF

## GitHub Pages

`wooing26.github.io` 저장소의 `main` 브랜치 루트에 파일을 배치하고 Settings → Pages → Deploy from a branch → main / (root)로 설정합니다.

공식 설정 안내: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 수정

내용은 `index.html`, 색상·배치는 `style.css`에서 수정합니다. PDF 교체 시 같은 경로를 유지하고 페이지 수·용량 표기도 함께 갱신합니다. 새 프로젝트나 경력은 사실 확인 후 추가합니다. 세 최신 프로젝트의 시작 월은 최초 커밋 기준입니다.

다운로드 PDF에는 원본의 연락처 등 개인정보가 포함됩니다. 사이트와 PDF는 공개 열람용입니다. 개별 게임 자산을 배포하는 사이트가 아니며 이미지의 권리는 각 권리자에게 있습니다. 팬게임은 비공식 학습 프로젝트입니다.

## 로컬 확인

이 폴더에서 `python -m http.server 4173`을 실행하고 `http://localhost:4173`을 엽니다. 서버 없이 `index.html`을 직접 열어도 본문과 다운로드가 동작합니다.

검증: `python check_site.py` (표준 라이브러리만 사용).
