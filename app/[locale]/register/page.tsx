'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { useState } from 'react'
import { signUp } from '@/actions/auth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function RegisterPage() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await signUp(new FormData(e.currentTarget), locale)
    if (result?.error) setError(result.error)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="font-mono text-[9px] uppercase mb-8" style={{ letterSpacing: '0.4em', color: '#666666' }}>
          CAPSULE · {t('register')}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input name="fullName" type="text" placeholder={t('fullName')} required />
          <Input name="email" type="email" placeholder={t('email')} required />
          <Input name="password" type="password" placeholder={t('password')} minLength={8} required />

          {error && (
            <p className="font-mono text-[9px]" style={{ letterSpacing: '0.1em', color: 'rgba(248,113,113,0.7)' }}>{error}</p>
          )}

          <Button type="submit" disabled={loading} className="mt-2 w-full justify-center">
            {loading ? '...' : t('register')}
          </Button>
        </form>

        <p className="font-mono text-[9px] mt-6" style={{ letterSpacing: '0.2em', color: '#666666' }}>
          {t('hasAccount')}{' '}
          <Link href={`/${locale}/login`} style={{ color: '#E8E8E8' }}>
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
