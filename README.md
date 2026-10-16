<p align="center">
  <img src="public/brand/inferstack-logo-dark.svg#gh-dark-mode-only" width="320" alt="InferStack" />
  <img src="public/brand/inferstack-logo.svg#gh-light-mode-only" width="320" alt="InferStack" />
</p>

# InferStack — 오픈 모델 추론 플랫폼 (프론트엔드 데모)

OpenRouter 스타일의 **오픈소스 LLM 통합 API 플랫폼** 프론트엔드 데모입니다.
실제 백엔드는 없으며, 추론·결제·배포는 브라우저에서 시뮬레이션됩니다
(상태는 `localStorage`에 저장). Hugging Face / GitHub 연동은 실제 공개 API를 호출합니다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ (정적 호스팅 가능, HashRouter 사용)
```

## 주요 기능

| 영역 | 내용 |
|---|---|
| 브랜딩 | 3단 레이어 스택 로고 (`public/brand/*.svg`, `public/favicon.svg`, `src/components/Logo.tsx`) |
| 홈 | 히어로·모델 검색, 신규/인기 모델, 코드 예제, BYOM 소개, **Hugging Face 실시간 트렌딩** |
| 모델 카탈로그 | 2026-10 기준 최신 오픈 LLM 36종 (DeepSeek V4.1, Qwen3.8, GLM-5.3, Kimi K3, MiMo V2.6, Gemma 4, gpt-oss, LFM2.5, Ling 3.1 등) — 아키텍처·파라미터·컨텍스트·라이선스는 HF Hub 메타데이터 기준, 입력/출력/캐시 가격 책정 |
| 모델 상세 | 엔드포인트(리전·GPU·양자화·처리량·TTFT·가동률), API 예제, 사용량 차트, HF 실시간 정보 |
| 채팅 | 모델 최대 3개 동시 비교, 스트리밍(시뮬레이션), 토큰·비용·tok/s 표시, 크레딧 차감 |
| API 키 | 생성(1회 노출), 크레딧 한도, 만료, 허용 모델 제한, 비활성화/삭제 |
| 크레딧 / 활동 | 충전(데모), 자동 충전, 프로모션 코드, 일별 비용·토큰 차트, 요청 로그, CSV 내보내기 |
| 랭킹 / 가격 / 문서 | 주간 토큰 순위, 제공자 점유율, 모델·GPU 가격표, API·CLI·아키텍처 패키지 문서 |
| **모델 업로드** | 5단계 마법사 (아래) + 내 모델 관리(빌드 로그, 일시정지, 공개/비공개, 삭제) |

### 커스텀 모델 업로드 흐름

1. **소스** — Hugging Face(검색 자동완성, revision, 게이트 모델 토큰) / ModelScope(API → HF 미러 → 이름 추정 폴백) / CLI(명령어 안내 + 업로드 시뮬레이션, config.json 붙여넣기로 아키텍처 감지)
2. **가중치 포맷** — Safetensors(dtype, FP8/NVFP4/AWQ/GPTQ 서빙 양자화) 또는 GGUF(리포지토리의 양자화 파일 자동 그룹핑·분할 파일 지원)
3. **아키텍처** — HF `config.json`의 `architectures` 또는 GGUF `general.architecture`로 자동 감지, 지원 레지스트리 45종에서 선택
   - 레지스트리에 없는 **새 아키텍처**는 `inferstack.yaml` + `model.py` 규격의 추론 코드를 **GitHub**(공개 리포 실시간 검증) 또는 **로컬**(드래그&드롭/폴더 선택)로 업로드. 템플릿 다운로드 제공
4. **배포 설정** — VRAM 추정 및 GPU 추천, 오토스케일/scale-to-zero, 컨텍스트, 채팅 템플릿, 비공개/마켓플레이스 공개 + 가격
5. **검토 → 배포** — 빌드 단계·로그 시뮬레이션 후 Live, 채팅/API에서 바로 사용

## 구조

```
src/
  data/       models.ts(카탈로그) architectures.ts(레지스트리·GPU) customArchSpec.ts(패키지 규격) types.ts
  lib/        hf.ts(HF Hub API) modelscope.ts github.ts build.ts(배포 시뮬레이션) mockLLM.ts format.ts
  store/      zustand 전역 상태 (키·크레딧·로그·커스텀 모델, localStorage 영속화)
  components/ Layout, Logo, ui 프리미티브, Markdown, ModelBits
  pages/      Home, Models, ModelDetail, Chat, Rankings, Docs, Pricing, Keys, Credits, Activity, Settings, SignIn, MyModels
  pages/deploy/ DeployHome, DeployWizard, SourceStep, FormatStep, ArchStep, ConfigStep
```

스택: Vite · React 18 · TypeScript · Tailwind CSS · Zustand · Recharts · lucide-react
