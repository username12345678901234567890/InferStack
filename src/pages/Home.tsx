import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Compass, X } from 'lucide-react'
import { MODELS, ORGS, endpointsFor, findModel, weeklyTokens } from '../data/models'
import { ARCHITECTURES } from '../data/architectures'
import { ModelFlags, OrgAvatar } from '../components/ModelBits'
import { ButtonLink, Segmented, cx } from '../components/ui'
import { CONTAINER } from '../components/Layout'
import { FallbackArt, LogosArt, MetricsArt, UploadArt } from './home/Illustrations'
import { fmtCtx, fmtPrice, fmtTokens } from '../lib/format'

export default function Home() {
  return (
    <div>
      <Hero />
      <Features />
      <Featured />
      <Steps />
      <Upload />
      <Korea />
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Hero() {
  const maxCtx = Math.max(...MODELS.map((m) => m.context))
  const stats = [
    [String(MODELS.length), '오픈 모델'],
    [String(ORGS.length), '모델 제작사'],
    [String(ARCHITECTURES.length), '지원 아키텍처'],
    [fmtCtx(maxCtx), '최대 컨텍스트'],
  ]
  return (
    <section className={cx(CONTAINER, 'flex flex-col items-center pb-20 pt-20 text-center sm:pt-28')}>
      <h1 className="text-[40px] font-bold leading-[1.1] tracking-[-0.045em] sm:text-[64px]">
        오픈 모델과 내 모델을
        <br />
        하나의 API로
      </h1>
      <p className="mt-6 text-[17px] text-fg2 sm:text-[18px]">
        더 낮은{' '}
        <Link to="/pricing" className="text-fg underline decoration-fg3 underline-offset-[5px] hover:decoration-fg">
          가격
        </Link>
        , 가까운{' '}
        <Link to="/docs#routing" className="text-fg underline decoration-fg3 underline-offset-[5px] hover:decoration-fg">
          서울 리전
        </Link>
        , 구독 없이 쓴 만큼만.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/keys" size="lg" className="min-w-[150px]">
          API 키 받기
        </ButtonLink>
        <ButtonLink to="/models" size="lg" variant="outline" className="min-w-[150px]">
          모델 둘러보기 <Compass size={16} />
        </ButtonLink>
      </div>
      <dl className="mt-20 grid w-full max-w-3xl grid-cols-2 gap-y-8 sm:grid-cols-4">
        {stats.map(([v, k]) => (
          <div key={k}>
            <dt className="tabular text-[34px] font-bold tracking-[-0.03em]">{v}</dt>
            <dd className="mt-1 text-[13.5px] text-fg3">{k}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function Features() {
  const items = [
    { art: <LogosArt />, title: '최신 오픈 모델을 한 곳에서', desc: 'DeepSeek, Qwen, GLM, Kimi 등 19개 제작사의 모델을 같은 형식으로 호출합니다.', link: ['모델 둘러보기', '/models'] },
    { art: <FallbackArt />, title: '장애가 나도 멈추지 않게', desc: '리전 하나가 응답하지 않으면 같은 모델을 서빙하는 다른 리전으로 바로 넘어갑니다.', link: ['라우팅 알아보기', '/docs#routing'] },
    { art: <MetricsArt />, title: '가격과 성능을 투명하게', desc: '모델마다 토큰 가격, 처리량, 첫 토큰 지연을 공개합니다. 숫자로 비교하고 고르세요.', link: ['랭킹 보기', '/rankings'] },
    { art: <UploadArt />, title: '내 모델도 같은 API로', desc: 'Hugging Face, ModelScope, CLI로 가중치를 올리면 전용 엔드포인트가 만들어집니다.', link: ['모델 올리기', '/deploy'] },
  ]
  return (
    <section className={cx(CONTAINER, 'pb-24')}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <article key={it.title} className="flex flex-col overflow-hidden rounded-xl border border-line bg-panel">
            <div className="flex h-[196px] items-center justify-center border-b border-line bg-raised/40 px-6">{it.art}</div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-[16px] font-semibold tracking-[-0.015em]">{it.title}</h3>
              <p className="mt-2 flex-1 text-[14px] leading-relaxed text-fg2">{it.desc}</p>
              <Link to={it.link[1]} className="mt-4 self-start text-[13.5px] font-medium underline decoration-fg3 underline-offset-4 hover:decoration-fg">
                {it.link[0]}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function Featured() {
  const featured = ['deepseek/deepseek-v4.1-flash', 'z-ai/glm-5.3', 'qwen/qwen3.8-27b'].map((s) => findModel(s)!)
  return (
    <section className="border-t border-line">
      <div className={cx(CONTAINER, 'py-20')}>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-bold tracking-[-0.03em]">주목할 모델</h2>
            <p className="mt-1.5 text-[14.5px] text-fg2">새로 들어왔거나 많이 쓰이는 모델</p>
          </div>
          <Link to="/models" className="shrink-0 text-[14px] text-fg2 hover:text-fg">
            모든 모델 →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {featured.map((m) => {
            const ep = endpointsFor(m)[0]
            return (
              <Link key={m.slug} to={`/models/${m.slug}`} className="group flex flex-col rounded-xl border border-line bg-panel transition-colors hover:border-line2">
                <div className="flex items-start gap-3 p-5">
                  <OrgAvatar org={m.org} name={m.orgName} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[16px] font-semibold tracking-[-0.015em]">{m.name}</span>
                      <ModelFlags m={m} />
                    </div>
                    <div className="mt-0.5 text-[13px] text-fg3">by {m.orgName}</div>
                  </div>
                </div>
                <p className="line-clamp-2 px-5 text-[13.5px] leading-relaxed text-fg2">{m.description}</p>
                <dl className="tabular mt-5 grid grid-cols-3 border-t border-line">
                  {[
                    [fmtTokens(weeklyTokens(m)), '주간 토큰'],
                    [`${(ep.latency / 1000).toFixed(2)}s`, '첫 토큰'],
                    [fmtPrice(m.price.output), '출력 / 1M'],
                  ].map(([v, k], i) => (
                    <div key={k} className={cx('px-5 py-4', i > 0 && 'border-l border-line')}>
                      <dt className="text-[17px] font-semibold tracking-[-0.01em]">{v}</dt>
                      <dd className="mt-0.5 text-[12.5px] text-fg3">{k}</dd>
                    </div>
                  ))}
                </dl>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function Steps() {
  return (
    <section className="border-t border-line">
      <div className={cx(CONTAINER, 'py-20')}>
        <h2 className="text-[24px] font-bold tracking-[-0.03em]">3단계로 시작하기</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Step n={1} title="가입하기" desc="GitHub 계정이나 이메일로 가입하면 체험용 크레딧 $5가 들어옵니다.">
            <div className="flex flex-col gap-2">
              <div className="flex h-9 items-center justify-center rounded-lg border border-line2 bg-panel text-[13px] font-medium">GitHub로 계속</div>
              <div className="flex h-9 items-center justify-center rounded-lg border border-line2 bg-panel text-[13px] font-medium text-fg2">이메일로 계속</div>
            </div>
          </Step>
          <Step n={2} title="크레딧 충전" desc="원화로 충전하고, 쓴 토큰만큼만 차감됩니다. 무료 모델은 차감되지 않습니다.">
            <div className="flex items-center justify-between rounded-lg border border-line2 bg-panel px-4 py-3">
              <div>
                <div className="text-[12px] text-fg3">잔액</div>
                <div className="tabular text-[20px] font-bold">$48.25</div>
              </div>
              <div className="flex gap-1.5">
                {['+$10', '+$25'].map((a) => (
                  <span key={a} className="rounded-md border border-line2 px-2 py-1 text-[12.5px] text-fg2">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </Step>
          <Step n={3} title="키 발급 후 호출" desc="API 키를 만들고 기존 코드의 base URL만 바꾸면 끝입니다.">
            <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0c0d0f] px-3.5 py-3 font-mono text-[12px] leading-[1.8] text-white/80">
              <div>
                <span className="text-white/40">base_url=</span>
                <span className="text-[#a5d6a7]">"https://api.inferstack.dev/v1"</span>
              </div>
              <div>
                <span className="text-white/40">api_key=</span>
                <span className="text-[#a5d6a7]">"sk-is-v1-••••"</span>
              </div>
            </div>
          </Step>
        </div>
      </div>
    </section>
  )
}

function Step({ n, title, desc, children }: { n: number; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-xl border border-line bg-panel p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-raised text-[13px] font-semibold ring-1 ring-line2">{n}</span>
        <h3 className="text-[16px] font-semibold">{title}</h3>
      </div>
      <p className="mt-3 text-[14px] leading-relaxed text-fg2">{desc}</p>
      <div className="mt-5">{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Upload() {
  const nav = useNavigate()
  const [source, setSource] = useState<'huggingface' | 'modelscope'>('huggingface')
  const [repo, setRepo] = useState('')
  const go = (r = repo) => r.trim() && nav(`/deploy/new?source=${source}&repo=${encodeURIComponent(r.trim())}`)
  const quants = [
    ['Q8_0', '25.5 GB'],
    ['Q6_K', '19.7 GB'],
    ['Q4_K_M', '14.5 GB'],
  ]
  return (
    <section className="border-t border-line">
      <div className={cx(CONTAINER, 'grid items-center gap-14 py-20 lg:grid-cols-2')}>
        <div>
          <h2 className="text-[32px] font-bold leading-tight tracking-[-0.035em]">
            직접 학습한 모델도
            <br />
            몇 분 만에 API로
          </h2>
          <p className="mt-4 max-w-md text-[15.5px] leading-[1.7] text-fg2">Repo ID만 넣으면 아키텍처와 양자화 파일을 읽고, 필요한 GPU까지 골라 드립니다. 목록에 없는 새 아키텍처는 추론 코드를 함께 올리면 됩니다.</p>
          <ul className="mt-7 space-y-2.5 text-[14.5px]">
            {['Hugging Face · ModelScope · CLI 업로드', 'GGUF와 Safetensors, 배포 시 FP8 양자화', `${ARCHITECTURES.length}개 아키텍처 자동 감지`, '비공개로 쓰거나 공개해서 매출의 80% 정산'].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <Check size={16} className="shrink-0 text-accent" /> {t}
              </li>
            ))}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              go()
            }}
            className="mt-8 max-w-md"
          >
            <Segmented
              value={source}
              onChange={setSource}
              options={[
                { id: 'huggingface', label: 'Hugging Face' },
                { id: 'modelscope', label: 'ModelScope' },
              ]}
            />
            <div className="mt-3 flex gap-2">
              <input
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="Qwen/Qwen3.8-27B"
                aria-label="리포지토리 ID"
                className="h-11 min-w-0 flex-1 rounded-lg border border-line2 bg-panel px-3.5 font-mono text-[14px] text-fg placeholder:text-fg3 focus:border-fg/40 focus:outline-none"
              />
              <button type="submit" className="h-11 shrink-0 rounded-lg bg-accent px-5 text-[14px] font-medium text-white hover:bg-accent/90">
                불러오기
              </button>
            </div>
          </form>
        </div>

        <div className="min-w-0 overflow-hidden rounded-2xl border border-line2 bg-panel shadow-[0_30px_80px_-40px_rgba(0,0,0,0.45)]">
          <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
            <OrgAvatar org="liquid" name="Liquid AI" size={28} />
            <div className="min-w-0">
              <div className="truncate font-mono text-[13px] font-medium">LiquidAI/LFM2.5-24B-A2B-GGUF</div>
              <div className="text-[12px] text-fg3">Hugging Face에서 불러옴</div>
            </div>
            <span className="ml-auto flex shrink-0 items-center gap-1 text-[12.5px] font-medium text-emerald-600 dark:text-emerald-400">
              <Check size={14} /> 분석 완료
            </span>
          </div>
          <dl className="tabular grid grid-cols-3 border-b border-line">
            {[
              ['아키텍처', 'Lfm2Moe'],
              ['파라미터', '24B'],
              ['컨텍스트', '131K'],
            ].map(([k, v], i) => (
              <div key={k} className={cx('px-5 py-3.5', i > 0 && 'border-l border-line')}>
                <dt className="text-[12px] text-fg3">{k}</dt>
                <dd className="mt-0.5 text-[15px] font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="px-5 pb-2 pt-4 text-[12.5px] font-medium text-fg3">양자화 파일</div>
          <div className="px-3 pb-3">
            {quants.map(([q, size]) => {
              const on = q === 'Q4_K_M'
              return (
                <div key={q} className={cx('flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px]', on && 'bg-raised')}>
                  <span className={cx('h-4 w-4 shrink-0 rounded-full border', on ? 'border-[5px] border-accent' : 'border-line2')} />
                  <span className="w-20 font-mono">{q}</span>
                  <span className="flex-1 text-fg3">{on ? '추천' : ''}</span>
                  <span className="tabular text-fg2">{size}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between border-t border-line bg-raised/40 px-5 py-3.5 text-[13.5px]">
            <span className="text-fg2">
              추천 GPU <span className="font-semibold text-fg">1× L40S</span>
            </span>
            <span className="tabular font-semibold">$1.60 / 시간</span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function Korea() {
  return (
    <section className="border-t border-line">
      <div className={cx(CONTAINER, 'py-20')}>
        <div className="grid overflow-hidden rounded-2xl border border-line bg-panel lg:grid-cols-2">
          <div className="p-8 sm:p-10">
            <div className="text-[13.5px] font-medium text-accent">한국 팀을 위한 결제</div>
            <h2 className="mt-3 text-[28px] font-bold leading-snug tracking-[-0.035em]">
              해외 AI API 결제,
              <br />
              세금계산서 때문에 막히셨나요?
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-[1.7] text-fg2">해외 모델 회사에 카드로 직접 결제하면 국내 세금계산서를 받을 수 없습니다. InferStack은 원화로 충전하고 매월 세금계산서를 발행합니다.</p>
            <div className="mt-7 space-y-2.5 text-[14px]">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-line px-4 py-3">
                <span className="flex items-center gap-2.5 text-fg2">
                  <X size={16} className="text-rose-500" /> 해외 회사에 카드 직접 결제
                </span>
                <span className="text-[13px] text-fg3">세금계산서 불가</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/[0.06] px-4 py-3">
                <span className="flex items-center gap-2.5 font-medium">
                  <Check size={16} className="text-emerald-500" /> InferStack 원화 충전
                </span>
                <span className="text-[13px] text-fg2">세금계산서 매월 발행</span>
              </div>
            </div>
            <div className="mt-8 flex gap-2.5">
              <ButtonLink to="/signin">무료로 시작하기</ButtonLink>
              <ButtonLink to="/pricing" variant="outline">
                가격 보기
              </ButtonLink>
            </div>
          </div>
          <div className="flex flex-col border-t border-line lg:border-l lg:border-t-0">
            {[
              ['세금계산서 자동 발행', '사용한 만큼 원화로 정산하고 매월 초 전자세금계산서를 보내 드립니다.'],
              ['원화 충전, 법인카드', '카드, 계좌이체, 법인카드로 충전합니다. 잔액이 줄면 자동으로 충전할 수도 있습니다.'],
              ['서울 리전 우선', '요청은 서울 리전에서 먼저 처리하고, 응답이 없으면 도쿄 리전으로 넘깁니다.'],
            ].map(([t, d]) => (
              <div key={t} className="flex flex-1 flex-col justify-center border-b border-line px-8 py-7 last:border-0 sm:px-10">
                <h3 className="text-[16px] font-semibold">{t}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-fg2">{d}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-20 flex flex-col items-center text-center">
          <h2 className="text-[30px] font-bold tracking-[-0.035em]">지금 바로 호출해 보세요</h2>
          <p className="mt-3 text-[15.5px] text-fg2">가입하면 체험용 크레딧 $5와 무료 모델을 바로 쓸 수 있습니다.</p>
          <div className="mt-7 flex gap-3">
            <ButtonLink to="/keys" size="lg">
              API 키 받기 <ArrowRight size={16} />
            </ButtonLink>
            <ButtonLink to="/chat" size="lg" variant="outline">
              채팅으로 써보기
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  )
}
