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
    toast.ok(`Welcome, ${name}`)
    nav('/')
  }
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center py-10">
      <LogoMark size={48} />
      <h1 className="mt-4 text-xl font-semibold">Get started with InferStack</h1>
      <p className="mt-1 text-sm text-fg3">Get $5 in free credits when you sign up</p>
      <Card className="mt-6 w-full space-y-3 p-6">
        <Button variant="outline" className="w-full" onClick={() => go('Demo User', 'demo@inferstack.dev')}>
          <Github size={16} /> Continue with GitHub (demo)
        </Button>
        <div className="flex items-center gap-3 text-xs text-fg3">
          <span className="h-px flex-1 bg-raised" /> or <span className="h-px flex-1 bg-raised" />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!/^\S+@\S+\.\S+$/.test(email)) return toast.err('Enter a valid email address')
            go(email.split('@')[0], email)
          }}
          className="space-y-3"
        >
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
          <Button type="submit" className="w-full">
            <Mail size={16} /> Sign in with magic link (demo)
          </Button>
        </form>
        <p className="text-center text-[11px] text-fg3">Demo only: there's no real authentication. Your sign-in state is stored in this browser.</p>
      </Card>
    </div>
  )
}
