import { getTranslations } from 'next-intl/server';
import { PageNav } from '@/components/ui/page-nav';
import { ContactForm } from './contact-form';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return { 
    title: `${t('title')} — BRAND_NAME_PLACEHOLDER`,
    description: t('subtitle')
  };
}

export default async function ContactePage() {
  const t = await getTranslations('contact');
  return (
    <>
      <PageNav />
      <main className="page-content">
        <div className="contact-page">
          <header className="contact-header">
            <h1>{t('title')}</h1>
            <p className="contact-header__sub">{t('subtitle')}</p>
          </header>
          <ContactForm />
        </div>
      </main>
    </>
  );
}
