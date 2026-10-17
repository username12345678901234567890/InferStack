import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { MODELS, ORGS, endpointsFor, findModel, weeklyTokens } from '../data/models'
import { ARCHITECTURES } from '../data/architectures'
import { ModelFlags, OrgAvatar } from '../components/ModelBits'
import { ButtonLink, Segmented, buttonClass, cx } from '../components/ui'
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
    <section className={cx(CONTAINER, 'pb-16 pt-20 sm:pt-24')}>
      <div className="flex flex-col items-center text-center">
        <h1 className="text-[34px] font-bold leading-[1.25] tracking-[-0.025em] sm:text-[50px]">
          오픈 모델과 내 모델을
          <br />
          하나의 API로
        </h1>
        <p className="mt-5 text-[16px] leading-relaxed text-fg2 sm:text-[17px]">더 낮은 가격, 가까운 서울 리전, 구독 없이 쓴 만큼만.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          <ButtonLink to="/keys" size="lg" className="min-w-[140px]">
            API 키 받기
          </ButtonLink>
          <ButtonLink to="/models" size="lg" variant="outline" className="min-w-[140px]">
            모델 둘러보기
          </ButtonLink>
        </div>
      </div>
      <dl className="mt-16 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
        {stats.map(([v, k]) => (
          <div key={k} className="text-center">
            <dt className="tabular text-[28px] font-semibold tracking-[-0.02em]">{v}</dt>
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
    <section className={cx(CONTAINER, 'pb-14')}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <Link key={it.title} to={it.link[1]} className="group flex flex-col overflow-hidden rounded-xl border border-line bg-panel transition-colors hover:border-line2">
            <div className="flex h-[184px] items-center justify-center bg-raised/70 px-6">{it.art}</div>
            <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
              <h3 className="text-[15.5px] font-semibold">{it.title}</h3>
              <p className="mt-1.5 flex-1 text-[14px] leading-relaxed text-fg2">{it.desc}</p>
              <span className="mt-4 text-[13.5px] text-fg3 transition-colors group-hover:text-fg">{it.link[0]} →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function Featured() {
  const featured = ['deepseek/deepseek-v4.1-flash', 'z-ai/glm-5.3', 'qwen/qwen3.8-27b'].map((s) => findModel(s)!)
  return (
    <section className={cx(CONTAINER, SECTION)}>
      <Head title="주목할 모델" sub="새로 들어왔거나 많이 쓰이는 모델" link={['모든 모델', '/models']} />
      <div className="grid gap-4 md:grid-cols-3">
          {featured.map((m) => {
            const ep = endpointsFor(m)[0]
            return (
              <Link key={m.slug} to={`/models/${m.slug}`} className="flex flex-col rounded-xl border border-line bg-panel transition-colors hover:border-line2">
                <div className="flex items-start gap-3 p-5">
                  <OrgAvatar org={m.org} name={m.orgName} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[15.5px] font-semibold">{m.name}</span>
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
                      <dt className="text-[16px] font-semibold">{v}</dt>
                      <dd className="mt-0.5 text-[12.5px] text-fg3">{k}</dd>
                    </div>
                  ))}
                </dl>
              </Link>
            )
          })}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function Steps() {
  return (
    <section className={cx(CONTAINER, SECTION)}>
      <Head title="3단계로 시작하기" sub="가입부터 첫 호출까지 몇 분이면 됩니다" />
      <div className="grid gap-4 md:grid-cols-3">
          <Step n={1} title="가입하기" desc="GitHub 계정이나 이메일로 가입하면 체험용 크레딧 $5가 들어옵니다.">
            <div className="flex flex-col gap-2">
              <div className="flex h-9 items-center justify-center rounded-lg bg-fg text-[13px] font-medium text-bg">GitHub로 계속</div>
              <div className="flex h-9 items-center justify-center rounded-lg border border-line2 text-[13px] font-medium text-fg2">이메일로 계속</div>
            </div>
          </Step>
          <Step n={2} title="크레딧 충전" desc="원화로 충전하고, 쓴 토큰만큼만 차감됩니다. 무료 모델은 차감되지 않습니다.">
            <div className="flex items-center justify-between rounded-lg bg-raised px-4 py-3">
              <div>
                <div className="text-[12px] text-fg3">잔액</div>
                <div className="tabular text-[20px] font-bold">$48.25</div>
              </div>
              <div className="flex gap-1.5">
                {['+$10', '+$25'].map((a) => (
                  <span key={a} className="rounded-md bg-panel px-2 py-1 text-[12.5px] text-fg2 ring-1 ring-inset ring-line">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </Step>
          <Step n={3} title="키 발급 후 호출" desc="API 키를 만들고 기존 코드의 base URL만 바꾸면 끝입니다.">
            <div className="overflow-hidden rounded-lg bg-raised px-4 py-3 font-mono text-[11.5px] leading-[1.9] text-fg">
              <div className="truncate">
                <span className="text-fg3">base_url=</span>"https://api.inferstack.dev/v1"
              </div>
              <div className="truncate">
                <span className="text-fg3">api_key=</span>"sk-is-v1-••••"
              </div>
            </div>
          </Step>
      </div>
    </section>
  )
}

function Step({ n, title, desc, children }: { n: number; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-xl border border-line bg-panel p-5">
      <div className="flex items-center gap-3">
        <span className="tabular flex h-6 w-6 items-center justify-center rounded-full bg-raised text-[12.5px] font-semibold text-fg2">{n}</span>
        <h3 className="text-[15.5px] font-semibold">{title}</h3>
      </div>
      <p className="mt-2.5 flex-1 text-[14px] leading-relaxed text-fg2">{desc}</p>
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
    <section className={cx(CONTAINER, SECTION, 'grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16')}>
        <div>
          <h2 className="text-[28px] font-bold leading-[1.3] tracking-[-0.02em]">
            직접 학습한 모델도
            <br />
            몇 분 만에 API로
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-[1.7] text-fg2">Repo ID만 넣으면 아키텍처와 양자화 파일을 읽고, 필요한 GPU까지 골라 드립니다. 목록에 없는 새 아키텍처는 추론 코드를 함께 올리면 됩니다.</p>
          <ul className="mt-7 space-y-2.5 text-[14.5px]">
            {['Hugging Face · ModelScope · CLI 업로드', 'GGUF와 Safetensors, 배포 시 FP8 양자화', `${ARCHITECTURES.length}개 아키텍처 자동 감지`, '비공개로 쓰거나 공개해서 매출의 80% 정산'].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <Check size={15} className="shrink-0 text-fg3" /> {t}
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
                className="h-10 min-w-0 flex-1 rounded-lg border border-line2 bg-panel px-3.5 text-[14px] text-fg placeholder:text-fg3 focus:border-fg/35 focus:outline-none"
              />
              <button type="submit" className={buttonClass('primary', 'md', 'h-10 shrink-0 px-5')}>
                불러오기
              </button>
            </div>
          </form>
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border border-line bg-panel shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)]">
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
                  <span className={cx('h-4 w-4 shrink-0 rounded-full border', on ? 'border-[5px] border-fg' : 'border-line2')} />
                  <span className="w-20 font-mono">{q}</span>
                  <span className="flex-1 text-fg3">{on ? '추천' : ''}</span>
                  <span className="tabular text-fg2">{size}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between border-t border-line px-5 py-3.5 text-[13.5px]">
            <span className="text-fg2">
              추천 GPU <span className="font-semibold text-fg">1× L40S</span>
            </span>
            <span className="tabular font-semibold">$1.60 / 시간</span>
          </div>
        </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function Korea() {
  return (
    <>
      <section className={cx(CONTAINER, SECTION, 'grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16')}>
        <div>
          <div className="text-[13.5px] font-medium text-fg3">한국 팀을 위한 결제</div>
          <h2 className="mt-2 text-[28px] font-bold leading-[1.3] tracking-[-0.02em]">
            해외 AI API 결제,
            <br />
            세금계산서 때문에 막히셨나요?
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-[1.7] text-fg2">해외 모델 회사에 카드로 직접 결제하면 국내 세금계산서를 받을 수 없습니다. InferStack은 원화로 충전하고 매월 세금계산서를 발행합니다.</p>
          <div className="mt-8 flex gap-2.5">
            <ButtonLink to="/signin">무료로 시작하기</ButtonLink>
            <ButtonLink to="/pricing" variant="outline">
              가격 보기
            </ButtonLink>
          </div>
        </div>
        <dl className="lg:pt-7">
          {[
            ['세금계산서 자동 발행', '사용한 만큼 원화로 정산하고 매월 초 전자세금계산서를 보내 드립니다.'],
            ['원화 충전, 법인카드', '카드, 계좌이체, 법인카드로 충전합니다. 잔액이 줄면 자동으로 충전할 수도 있습니다.'],
            ['서울 리전 우선', '요청은 서울 리전에서 먼저 처리하고, 응답이 없으면 도쿄 리전으로 넘깁니다.'],
          ].map(([t, d]) => (
            <div key={t} className="border-t border-line py-6 first:border-0 first:pt-1 last:pb-0">
              <dt className="text-[15.5px] font-semibold">{t}</dt>
              <dd className="mt-1.5 text-[14px] leading-relaxed text-fg2">{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={cx(CONTAINER, 'pb-20 pt-6')}>
        <div className="flex flex-col items-center rounded-2xl bg-raised px-6 py-14 text-center">
          <h2 className="text-[26px] font-bold tracking-[-0.02em]">지금 바로 호출해 보세요</h2>
          <p className="mt-2.5 text-[15px] text-fg2">가입하면 체험용 크레딧 $5와 무료 모델을 바로 쓸 수 있습니다.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            <ButtonLink to="/keys" size="lg">
              API 키 받기
            </ButtonLink>
            <ButtonLink to="/chat" size="lg" variant="outline" className="bg-panel">
              채팅으로 써보기
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ */

const SECTION = 'py-12 sm:py-14'

/** 홈 섹션 제목. 모든 섹션이 같은 모양을 쓴다 */
function Head({ title, sub, link }: { title: string; sub?: string; link?: [string, string] }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[24px] font-bold tracking-[-0.02em]">{title}</h2>
        {sub && <p className="mt-1.5 text-[15px] text-fg2">{sub}</p>}
      </div>
      {link && (
        <Link to={link[1]} className="shrink-0 text-[14px] text-fg3 transition-colors hover:text-fg">
          {link[0]} →
        </Link>
      )}
    </div>
  )
}
