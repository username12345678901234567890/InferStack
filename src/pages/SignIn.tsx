import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Github, Mail } from 'lucide-react'
import { LogoMark } from '../components/Logo'
import { Button, Card, Input, Label, toast } from '../components/ui'
import { useStore } from '../store'

export default function SignIn() {
  const signIn = useStore((s) => s.signIn)
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const go = (name: string, mail: string) => {
    const username = mail.split('@')[0].replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'demo'
    signIn({ name, email: mail, username, org: 'Personal' })
    toast.ok(`${name}님, 환영합니다`)
    nav('/')
  }
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center py-10">
      <LogoMark size={48} />
      <h1 className="mt-4 text-xl font-semibold">InferStack 시작하기</h1>
      <p className="mt-1 text-sm text-slate-500">가입 시 $5 무료 크레딧이 지급됩니다</p>
      <Card className="mt-6 w-full space-y-3 p-6">
        <Button variant="outline" className="w-full" onClick={() => go('Demo User', 'demo@inferstack.dev')}>
          <Github size={16} /> GitHub로 계속 (데모)
        </Button>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" /> 또는 <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!/^\S+@\S+\.\S+$/.test(email)) return toast.err('올바른 이메일을 입력하세요')
            go(email.split('@')[0], email)
          }}
          className="space-y-3"
        >
          <div>
            <Label>이메일</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
          <Button type="submit" className="w-full">
            <Mail size={16} /> 매직 링크로 로그인 (데모)
          </Button>
        </form>
        <p className="text-center text-[11px] text-slate-500">데모 환경: 실제 인증 없이 브라우저에만 로그인 상태가 저장됩니다.</p>
      </Card>
    </div>
  )
}
