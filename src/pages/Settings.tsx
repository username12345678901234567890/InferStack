import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input, Label, Modal, PageHeader, Select, Toggle, toast } from '../components/ui'
import { MODELS } from '../data/models'
import { useStore } from '../store'

export default function Settings() {
  const user = useStore((s) => s.user)
  const signIn = useStore((s) => s.signIn)
  const settings = useStore((s) => s.settings)
  const update = useStore((s) => s.updateSettings)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const reset = useStore((s) => s.resetDemo)
  const [name, setName] = useState(user?.name ?? '')
  const [confirm, setConfirm] = useState(false)
  const nav = useNavigate()

  return (
    <div className="max-w-3xl">
      <PageHeader title="설정" />
      <div className="space-y-6">
        <Card className="space-y-4 p-5">
          <div className="text-sm font-semibold">계정</div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>이름</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>이메일</Label>
              <Input value={user?.email ?? ''} disabled />
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => user && (signIn({ ...user, name }), toast.ok('저장했습니다'))}>저장</Button>
        </Card>

        <Card className="space-y-4 p-5">
          <div className="text-sm font-semibold">기본값</div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>채팅 기본 모델</Label>
              <Select value={settings.defaultModel} onChange={(e) => update({ defaultModel: e.target.value })}>
                {MODELS.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>선호 리전</Label>
              <Select value={settings.preferredRegion} onChange={(e) => update({ preferredRegion: e.target.value })}>
                <option value="auto">자동 (가격·지연 최적)</option>
                <option value="ap-seoul-1">서울 (ap-seoul-1)</option>
                <option value="ap-tokyo-1">도쿄 (ap-tokyo-1)</option>
                <option value="us-east-1">버지니아 (us-east-1)</option>
                <option value="eu-central-1">프랑크푸르트 (eu-central-1)</option>
              </Select>
            </div>
            <div>
              <Label>테마</Label>
              <Select value={theme} onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}>
                <option value="dark">다크</option>
                <option value="light">라이트</option>
              </Select>
            </div>
          </div>
          <Toggle checked={settings.fallbackRouting} onChange={(v) => update({ fallbackRouting: v })} label="자동 폴백 라우팅" description="기본 엔드포인트가 실패하면 다른 리전으로 재시도합니다" />
        </Card>

        <Card className="space-y-4 p-5">
          <div className="text-sm font-semibold">프라이버시</div>
          <Toggle checked={settings.logPrompts} onChange={(v) => update({ logPrompts: v })} label="프롬프트·응답 로깅" description="활동 페이지에서 요청 본문을 볼 수 있습니다. 기본값은 OFF" />
          <Toggle checked={settings.allowTraining} onChange={(v) => update({ allowTraining: v })} label="학습 데이터 사용 허용 엔드포인트 포함" description="OFF이면 데이터 보존·학습을 하지 않는 엔드포인트로만 라우팅합니다" />
        </Card>

        <Card className="flex items-center justify-between gap-4 border-rose-500/30 p-5">
          <div>
            <div className="font-medium text-rose-600 dark:text-rose-400">데모 데이터 초기화</div>
            <div className="text-sm text-slate-500">API 키, 크레딧, 활동 로그, 커스텀 모델을 초기 상태로 되돌립니다.</div>
          </div>
          <Button variant="danger" onClick={() => setConfirm(true)}>초기화</Button>
        </Card>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="데모 데이터를 초기화할까요?" size="sm" footer={<><Button variant="ghost" onClick={() => setConfirm(false)}>취소</Button><Button variant="danger" onClick={() => { reset(); localStorage.removeItem('inferstack-chats'); setConfirm(false); toast.ok('초기화했습니다'); nav('/') }}>초기화</Button></>}>
        <p className="text-sm">브라우저에 저장된 모든 데모 데이터가 삭제됩니다.</p>
      </Modal>
    </div>
  )
}
