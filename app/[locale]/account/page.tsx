import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/actions/auth'
import Button from '@/components/ui/Button'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = await getLocale()
  const t = await getTranslations('account')

  if (!user) redirect(`/${locale}/login`)

  const { count } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <div className="min-h-screen pt-28 px-8 md:px-16 pb-16" style={{ backgroundColor: '#060606' }}>
      <p className="font-mono text-[9px] uppercase mb-12" style={{ letterSpacing: '0.4em', color: '#666666' }}>{t('title')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 max-w-2xl" style={{ gap: '1px', backgroundColor: '#2A2A2A' }}>
        <div className="p-8" style={{ backgroundColor: '#060606' }}>
          <p className="font-mono text-[8px] uppercase mb-3" style={{ letterSpacing: '0.3em', color: '#666666' }}>EMAIL</p>
          <p className="font-mono text-[11px]" style={{ letterSpacing: '0.1em', color: '#E8E8E8' }}>{user.email}</p>
        </div>
        <div className="p-8" style={{ backgroundColor: '#060606' }}>
          <p className="font-mono text-[8px] uppercase mb-3" style={{ letterSpacing: '0.3em', color: '#666666' }}>{t('orders').toUpperCase()}</p>
          <p className="font-mono text-[11px]" style={{ letterSpacing: '0.1em', color: '#E8E8E8' }}>{count ?? 0}</p>
        </div>
      </div>

      <div className="flex gap-4 mt-12">
        <Link href={`/${locale}/account/orders`}>
          <Button variant="ghost">{t('orders')} →</Button>
        </Link>
        <form action={signOut.bind(null, locale)}>
          <Button variant="ghost" type="submit">DÉCONNEXION</Button>
        </form>
      </div>
    </div>
  )
}
