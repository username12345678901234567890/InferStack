import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Check, Download, Heart, ShieldCheck, X } from 'lucide-react'
import { MODELS, ORGS, endpointsFor, findModel, weeklyTokens } from '../data/models'
import { ARCHITECTURES } from '../data/architectures'
import { ModelFlags, OrgAvatar } from '../components/ModelBits'
import { CopyButton, cx } from '../components/ui'
import { CONTAINER } from '../components/Layout'
import { HeroConsole } from './home/HeroConsole'
import { LogoGridViz, PipelineViz, PriceViz, RoutingViz } from './home/FeatureViz'
import { trendingLLMs, type HFModelSummary } from '../lib/hf'
import { fmtCtx, fmtNum, fmtPrice, fmtTokens, timeAgo } from '../lib/format'
import { rng } from '../lib/rand'

const BASE_URL = 'https://api.inferstack.dev/v1'

export default function Home() {
  return (
    <div>
      <Hero />
      <Makers />
      <Features />
      <Featured />
      <Upload />
      <Korea />
      <Closing />
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Hero() {
  const maxCtx = Math.max(...MODELS.map((m) => m.context))
  const facts = [
    [String(MODELS.length), '오픈 웨이트 모델'],
    [String(ORGS.length), '모델 제작사'],
    [fmtCtx(maxCtx), '최대 컨텍스트'],
    ['서울', '기본 리전'],
  ]
  return (
    <section className="border-b border-line">
      <div className={cx(CONTAINER, 'grid items-center gap-14 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.06fr)] lg:py-24')}>
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-line2 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-fg2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Open-weight inference
          </span>
          <h1 className="mt-6 text-[42px] font-bold leading-[1.1] tracking-[-0.045em] sm:text-[58px]">
            오픈 웨이트 모델,
            <br />
            올리면 바로 API
            <span className="ml-1.5 inline-block h-[0.72em] w-[0.36em] translate-y-[0.06em] animate-blink rounded-[3px] bg-accent align-baseline" aria-hidden />
          </h1>
          <p className="mt-6 max-w-[33rem] text-[16px] leading-[1.7] text-fg2">
            DeepSeek, Qwen, GLM, Kimi 등 최신 오픈 모델 {MODELS.length}종을 OpenAI 호환 API로 호출하세요. Hugging Face나 ModelScope에서 가져오거나 CLI로 올린 내 모델도 같은 엔드포인트에서 서빙됩니다.
          </p>

          <div className="mt-8 flex h-11 max-w-[30rem] items-center gap-2.5 rounded-lg border border-line2 bg-panel pl-3.5 pr-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            <code className="min-w-0 flex-1 truncate font-mono text-[13.5px] text-fg">{BASE_URL}</code>
            <CopyButton text={BASE_URL} label="복사" className="border border-line" />
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-fg3">
            <ShieldCheck size={14} className="shrink-0" />
            프롬프트와 응답은 기본적으로 저장하지 않습니다.
            <Link to="/docs#routing" className="inline-flex items-center gap-0.5 whitespace-nowrap text-fg2 underline decoration-line2 underline-offset-4 hover:text-fg">
              데이터 정책 <ArrowUpRight size={12} />
            </Link>
          </p>

          <div className="mt-8 flex flex-wrap gap-2.5">
            <Link to="/keys" className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-fg px-5 text-[15px] font-medium text-bg transition-colors hover:bg-fg/85">
              API 키 받기 <ArrowRight size={16} />
            </Link>
            <Link to="/deploy" className="inline-flex h-11 items-center rounded-lg border border-line2 px-5 text-[15px] font-medium transition-colors hover:bg-raised">
              내 모델 올리기
            </Link>
          </div>

          <dl className="mt-12 grid max-w-[30rem] grid-cols-2 gap-x-4 gap-y-5 border-t border-line pt-6 sm:grid-cols-4">
            {facts.map(([v, k]) => (
              <div key={k}>
                <dt className="tabular text-[20px] font-semibold tracking-[-0.02em]">{v}</dt>
                <dd className="mt-0.5 text-[12px] text-fg3">{k}</dd>
              </div>
            ))}
          </dl>
        </div>
        <HeroConsole />
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function Makers() {
  return (
    <section className={cx(CONTAINER, 'py-14')}>
      <p className="text-center text-[13px] text-fg3">{ORGS.length}개 연구소와 기업이 공개한 모델을 서빙합니다</p>
      <div className="mx-auto mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-5">
        {ORGS.map((o) => (
          <Link key={o.id} to={`/models?q=${encodeURIComponent(o.name)}`} className="flex items-center gap-2 text-[13.5px] font-medium text-fg2 transition-colors hover:text-fg">
            <OrgAvatar org={o.id} name={o.name} size={22} />
            {o.name}
          </Link>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function Features() {
  const items = [
    { viz: <LogoGridViz />, title: `${MODELS.length}개 모델, 키 하나`, desc: '모델 이름만 바꿔 DeepSeek에서 Qwen으로 옮깁니다. 스트리밍, 툴 호출, JSON 모드, 이미지 입력까지 같은 형식입니다.', link: ['모델 둘러보기', '/models'] },
    { viz: <RoutingViz />, title: '리전 자동 폴백', desc: '엔드포인트가 응답하지 않으면 같은 모델의 다른 리전으로 다시 보냅니다. 요청 하나 실패하지 않습니다.', link: ['라우팅 옵션', '/docs#routing'] },
    { viz: <PriceViz />, title: '가격과 속도를 비교', desc: '모든 모델의 토큰 가격, 처리량, 첫 토큰 지연을 공개합니다. 쓰임새에 맞는 모델을 숫자로 고르세요.', link: ['랭킹 보기', '/rankings'] },
    { viz: <PipelineViz />, title: '내 모델도 같은 API로', desc: 'Hugging Face, ModelScope, CLI로 가중치를 올리면 전용 엔드포인트가 생깁니다. GGUF와 Safetensors 모두 지원합니다.', link: ['업로드 시작', '/deploy'] },
  ]
  return (
    <section className="border-t border-line">
      <div className={cx(CONTAINER, 'py-20')}>
        <div className="max-w-2xl">
          <h2 className="text-[32px] font-bold leading-tight tracking-[-0.035em]">오픈 모델을 프로덕션에서 쓰는 데 필요한 것</h2>
          <p className="mt-3 text-[15px] text-fg2">모델 선택, 장애 대응, 비용 관리, 그리고 내 모델 서빙까지 한 곳에서 처리합니다.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <article key={it.title} className="flex flex-col overflow-hidden rounded-xl border border-line bg-panel">
              <div className="flex h-[184px] items-center justify-center border-b border-line bg-raised/40 px-5">{it.viz}</div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{it.title}</h3>
                <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-fg2">{it.desc}</p>
                <Link to={it.link[1]} className="mt-4 inline-flex items-center gap-1 self-start text-[13px] font-medium underline decoration-line2 underline-offset-4 hover:decoration-fg">
                  {it.link[0]} <ArrowRight size={13} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

/** 주간 증감률(예시 데이터). 최근 공개된 모델일수록 크게 오른다. */
function growth(m: { slug: string; released: string }) {
  const r = rng(m.slug + 'g')()
  const days = (Date.now() - new Date(m.released).getTime()) / 86400_000
  return days < 60 ? Math.round(25 + r * 60) : Math.round((r - 0.35) * 30)
}

function Featured() {
  const featured = ['deepseek/deepseek-v4.1-flash', 'z-ai/glm-5.3', 'xiaomi/mimo-v2.6-flash'].map((s) => findModel(s)!)
  const recent = useMemo(() => [...MODELS].sort((a, b) => b.released.localeCompare(a.released)).slice(0, 6), [])
  return (
    <section className="border-t border-line">
      <div className={cx(CONTAINER, 'py-20')}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-bold tracking-[-0.03em]">주목할 모델</h2>
            <p className="mt-1.5 text-[14px] text-fg2">이번 주 사용량이 가장 빠르게 늘고 있는 모델</p>
          </div>
          <Link to="/models" className="inline-flex shrink-0 items-center gap-1 text-[13px] text-fg2 hover:text-fg">
            전체 {MODELS.length}개 <ArrowRight size={13} />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {featured.map((m) => {
            const ep = endpointsFor(m)[0]
            const g = growth(m)
            return (
              <Link key={m.slug} to={`/models/${m.slug}`} className="group rounded-xl border border-line bg-panel transition-colors hover:border-line2">
                <div className="flex items-center gap-3 p-5">
                  <OrgAvatar org={m.org} name={m.orgName} size={36} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[15px] font-semibold tracking-[-0.01em]">
                      {m.name} <ModelFlags m={m} />
                    </div>
                    <div className="text-[12.5px] text-fg3">by {m.orgName}</div>
                  </div>
                  <ArrowUpRight size={16} className="ml-auto text-fg3 transition-colors group-hover:text-fg" />
                </div>
                <dl className="tabular divide-y divide-line border-t border-line text-[13px]">
                  <Row k="주간 토큰" v={<>{fmtTokens(weeklyTokens(m))} <span className={g >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>{g >= 0 ? '+' : ''}{g}%</span></>} />
                  <Row k="첫 토큰 지연" v={`${(ep.latency / 1000).toFixed(2)}s`} />
                  <Row k="처리량" v={`${ep.throughput} tok/s`} />
                  <Row k="입력 / 출력" v={`${fmtPrice(m.price.input)} / ${fmtPrice(m.price.output)}`} />
                </dl>
              </Link>
            )
          })}
        </div>

        <div className="mt-14">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[15px] font-semibold">최근 추가</h3>
            <Link to="/models?sort=newest" className="text-[13px] text-fg2 hover:text-fg">
              모두 보기
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="tabular w-full min-w-[720px] text-[13.5px]">
              <thead>
                <tr className="border-b border-line2 text-left text-[12px] text-fg3">
                  <th className="py-2.5 pr-4 font-normal">공개일</th>
                  <th className="py-2.5 pr-4 font-normal">모델</th>
                  <th className="py-2.5 pr-4 font-normal">아키텍처</th>
                  <th className="py-2.5 pr-4 text-right font-normal">컨텍스트</th>
                  <th className="py-2.5 pr-4 text-right font-normal">입력 $/1M</th>
                  <th className="py-2.5 text-right font-normal">출력 $/1M</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((m) => (
                  <tr key={m.slug} className="border-b border-line">
                    <td className="py-3 pr-4 font-mono text-[12.5px] text-fg3">{m.released}</td>
                    <td className="py-3 pr-4">
                      <Link to={`/models/${m.slug}`} className="flex items-center gap-2.5 font-medium hover:underline hover:decoration-fg3 hover:underline-offset-4">
                        <OrgAvatar org={m.org} name={m.orgName} size={20} />
                        {m.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 font-mono text-[12px] text-fg3">{m.architecture}</td>
                    <td className="py-3 pr-4 text-right font-mono text-[12.5px]">{fmtCtx(m.context)}</td>
                    <td className="py-3 pr-4 text-right font-mono text-[12.5px]">{fmtPrice(m.price.input)}</td>
                    <td className="py-3 text-right font-mono text-[12.5px]">{fmtPrice(m.price.output)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-2.5">
      <dt className="text-fg3">{k}</dt>
      <dd className="font-mono text-[12.5px]">{v}</dd>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Upload() {
  const quants = [
    ['Q8_0', '25.5 GB'],
    ['Q6_K', '19.7 GB'],
    ['Q4_K_M', '14.5 GB'],
    ['Q3_K_M', '11.7 GB'],
  ]
  return (
    <section className="border-t border-line">
      <div className={cx(CONTAINER, 'grid items-center gap-14 py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]')}>
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-fg3">Bring your own weights</span>
          <h2 className="mt-3 text-[32px] font-bold leading-tight tracking-[-0.035em]">
            파인튜닝한 모델을
            <br />
            몇 분 만에 엔드포인트로
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-[1.7] text-fg2">Repo ID를 넣으면 config.json과 GGUF 메타데이터에서 아키텍처를 읽고, 양자화 파일과 필요한 GPU를 골라 드립니다. 레지스트리에 없는 새 아키텍처는 추론 코드 패키지를 함께 올리면 됩니다.</p>
          <ul className="mt-7 space-y-3 text-[14px]">
            {[
              ['가져오기', 'Hugging Face · ModelScope · CLI'],
              ['포맷', 'GGUF (Q8_0 ~ IQ1) · Safetensors (BF16 · FP8 · MXFP4)'],
              ['아키텍처', `${ARCHITECTURES.length}종 기본 지원 · 새 아키텍처는 GitHub/로컬 코드`],
              ['엔진', 'vLLM · SGLang · llama.cpp · TensorRT-LLM'],
            ].map(([k, v]) => (
              <li key={k} className="grid grid-cols-[5.5rem_1fr] gap-3 border-b border-line pb-3">
                <span className="text-fg3">{k}</span>
                <span>{v}</span>
              </li>
            ))}
          </ul>
          <Link to="/deploy" className="mt-8 inline-flex h-10 items-center gap-1.5 rounded-lg bg-fg px-4 text-sm font-medium text-bg hover:bg-fg/85">
            모델 올리기 <ArrowRight size={15} />
          </Link>
        </div>

        {/* product fragment: wizard */}
        <div className="min-w-0 overflow-hidden rounded-2xl border border-line2 bg-panel shadow-[0_30px_80px_-40px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 border-b border-line px-5 py-3 text-[12.5px]">
            {['소스', '가중치', '런타임', '엔드포인트'].map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                <span className={cx('flex h-5 w-5 items-center justify-center rounded-full text-[10.5px]', i < 1 ? 'bg-fg text-bg' : i === 1 ? 'border border-fg text-fg' : 'border border-line2 text-fg3')}>{i < 1 ? <Check size={11} strokeWidth={3} /> : i + 1}</span>
                <span className={i <= 1 ? 'text-fg' : 'text-fg3'}>{s}</span>
                {i < 3 && <span className="mx-1 h-px w-5 bg-line2" />}
              </span>
            ))}
          </div>
          <div className="space-y-4 p-5">
            <div className="rounded-lg border border-line">
              <div className="flex items-center gap-2 border-b border-line px-3.5 py-2.5 font-mono text-[12.5px]">
                <OrgAvatar org="liquid" name="Liquid AI" size={18} />
                LiquidAI/LFM2.5-24B-A2B-GGUF
                <span className="ml-auto flex items-center gap-1 font-sans text-[11.5px] text-emerald-600 dark:text-emerald-400">
                  <Check size={12} /> 불러옴
                </span>
              </div>
              <div className="tabular grid grid-cols-4 divide-x divide-line text-[12px]">
                {[
                  ['GGUF arch', 'lfm2moe'],
                  ['파라미터', '24B'],
                  ['컨텍스트', '131,072'],
                  ['파일', '10 · 186 GB'],
                ].map(([k, v]) => (
                  <div key={k} className="px-3.5 py-2.5">
                    <div className="text-[11px] text-fg3">{k}</div>
                    <div className="mt-0.5 font-mono">{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-line">
              {quants.map(([q, size]) => {
                const on = q === 'Q4_K_M'
                return (
                  <div key={q} className={cx('grid grid-cols-[16px_80px_1fr_auto] items-center gap-3 border-b border-line px-3.5 py-2.5 text-[12.5px] last:border-0', on && 'bg-raised')}>
                    <span className={cx('h-3.5 w-3.5 rounded-full border', on ? 'border-[4px] border-fg' : 'border-line2')} />
                    <span className="font-mono">{q}</span>
                    <span className="truncate font-mono text-[11.5px] text-fg3">LFM2.5-24B-A2B-{q}.gguf</span>
                    <span className="tabular font-mono text-fg2">{size}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between rounded-lg bg-raised px-3.5 py-2.5 text-[12.5px]">
              <span className="text-fg2">
                필요 VRAM <span className="font-mono text-fg">~24 GB</span> · 추천 <span className="font-mono text-fg">1× L40S</span>
              </span>
              <span className="tabular font-mono text-fg">$1.60/hr</span>
            </div>
          </div>
        </div>
      </div>
      <HFTrending />
    </section>
  )
}

function HFTrending() {
  const [items, setItems] = useState<HFModelSummary[] | null>(null)
  const [err, setErr] = useState(false)
  useEffect(() => {
    trendingLLMs(6)
      .then(setItems)
      .catch(() => setErr(true))
  }, [])
  if (err) return null
  return (
    <div className={cx(CONTAINER, 'pb-20')}>
      <div className="rounded-xl border border-line">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <span className="text-[13px] font-medium">Hugging Face에서 지금 오르는 모델</span>
          <span className="flex items-center gap-1.5 text-[12px] text-fg3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> huggingface.co 실시간
          </span>
        </div>
        <div className="grid divide-line md:grid-cols-2 md:divide-x lg:grid-cols-3">
          {(items ?? Array.from({ length: 6 }, () => null)).map((m, i) => (
            <div key={m?.id ?? i} className="flex items-center gap-3 border-b border-line px-5 py-3.5 [&:nth-last-child(-n+3)]:lg:border-b-0">
              {m ? (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-mono text-[12.5px]">{m.id}</div>
                    <div className="tabular mt-0.5 flex items-center gap-3 text-[11.5px] text-fg3">
                      <span className="flex items-center gap-1">
                        <Heart size={10} /> {fmtNum(m.likes)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download size={10} /> {fmtTokens(m.downloads)}
                      </span>
                      {m.createdAt && <span>{timeAgo(m.createdAt)}</span>}
                    </div>
                  </div>
                  <Link to={`/deploy/new?source=huggingface&repo=${encodeURIComponent(m.id)}`} className="shrink-0 rounded-md border border-line2 px-2.5 py-1 text-[12px] font-medium hover:bg-raised">
                    배포
                  </Link>
                </>
              ) : (
                <div className="h-9 w-full animate-pulse rounded bg-raised" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Korea() {
  return (
    <section className="border-t border-line">
      <div className={cx(CONTAINER, 'py-20')}>
        <div className="grid overflow-hidden rounded-2xl border border-line bg-panel lg:grid-cols-2">
          <div className="p-8 sm:p-10">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-fg3">For teams in Korea</span>
            <h2 className="mt-3 text-[28px] font-bold leading-snug tracking-[-0.035em]">
              해외 AI API 결제,
              <br />
              세금계산서에서 막히셨나요?
            </h2>
            <p className="mt-4 max-w-md text-[14.5px] leading-[1.7] text-fg2">해외 모델 제공사에 카드로 직접 결제하면 국내 세금계산서를 받을 수 없어 예산 집행이 어렵습니다. InferStack은 원화로 충전하고 매월 세금계산서를 발행합니다.</p>
            <div className="mt-7 space-y-2.5 text-[13.5px]">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-line px-4 py-3">
                <span className="flex items-center gap-2.5">
                  <X size={15} className="text-rose-500" /> 해외 제공사에 카드 직접 결제
                </span>
                <span className="text-[12.5px] text-fg3">세금계산서 발행 불가</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-fg/30 bg-raised px-4 py-3">
                <span className="flex items-center gap-2.5 font-medium">
                  <Check size={15} className="text-emerald-500" /> InferStack 원화 충전
                </span>
                <span className="text-[12.5px] text-fg2">월별 세금계산서 발행</span>
              </div>
            </div>
          </div>
          <div className="grid border-t border-line lg:border-l lg:border-t-0">
            {[
              ['세금계산서 자동 발행', '사용한 만큼 원화로 정산하고 매월 초 전자세금계산서를 발행합니다.'],
              ['원화 충전과 법인카드', '카드, 계좌이체, 법인카드로 충전합니다. 잔액이 줄면 자동으로 충전할 수 있습니다.'],
              ['서울 리전 우선', '요청은 ap-seoul-1을 먼저 거치고, 응답이 없으면 도쿄 리전으로 넘어갑니다.'],
            ].map(([t, d]) => (
              <div key={t} className="border-b border-line px-8 py-6 last:border-0 sm:px-10">
                <h3 className="text-[15px] font-semibold">{t}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-fg2">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function Closing() {
  return (
    <section className="border-t border-line">
      <div className={cx(CONTAINER, 'grid items-center gap-10 py-24 lg:grid-cols-2')}>
        <div>
          <h2 className="text-[36px] font-bold leading-[1.15] tracking-[-0.04em]">
            base URL 하나만
            <br />
            바꾸세요.
          </h2>
          <p className="mt-4 max-w-md text-[15px] text-fg2">OpenAI SDK, LangChain, LlamaIndex, Vercel AI SDK처럼 OpenAI 호환 클라이언트라면 코드를 그대로 씁니다.</p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <Link to="/keys" className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-fg px-5 text-[15px] font-medium text-bg hover:bg-fg/85">
              API 키 받기 <ArrowRight size={16} />
            </Link>
            <Link to="/docs" className="inline-flex h-11 items-center rounded-lg border border-line2 px-5 text-[15px] font-medium hover:bg-raised">
              문서 읽기
            </Link>
          </div>
        </div>
        <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#0c0d0f] font-mono text-[13px] leading-[1.9] text-white/80">
          <div className="border-b border-white/[0.07] px-4 py-2 text-[11px] text-white/35">.env</div>
          <div className="overflow-x-auto py-3">
            <div className="min-w-max bg-rose-500/10 px-4 text-rose-300/90">- OPENAI_BASE_URL=https://api.openai.com/v1</div>
            <div className="min-w-max bg-emerald-500/10 px-4 text-emerald-300">+ OPENAI_BASE_URL={BASE_URL}</div>
            <div className="min-w-max px-4 text-white/45">&nbsp; OPENAI_API_KEY=sk-is-v1-••••••••••••</div>
          </div>
        </div>
      </div>
    </section>
  )
}
