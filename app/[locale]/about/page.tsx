import { getTranslations } from 'next-intl/server'

export default async function AboutPage() {
  const t = await getTranslations('about')
  const values = t.raw('values') as string[]

  return (
    <div
      className="min-h-screen pt-28 px-8 md:px-16 pb-16 flex flex-col justify-center max-w-2xl"
      style={{ backgroundColor: '#060606' }}
    >
      <p className="font-mono text-[9px] uppercase mb-8" style={{ letterSpacing: '0.4em', color: '#666666' }}>
        {t('title')}
      </p>
      <p
        className="font-sans font-light leading-relaxed mb-16"
        style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', letterSpacing: '0.05em', color: '#E8E8E8' }}
      >
        {t('body')}
      </p>
      <div className="flex gap-8">
        {values.map((v: string) => (
          <div
            key={v}
            className="font-mono text-[8px] uppercase pt-4"
            style={{ letterSpacing: '0.4em', color: '#666666', borderTop: '1px solid #2A2A2A' }}
          >
            {v}
          </div>
        ))}
      </div>
    </div>
  )
}
