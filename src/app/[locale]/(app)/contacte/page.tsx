import { getTranslations } from 'next-intl/server';
import { PageNav } from '@/components/ui/page-nav';
import { ContactForm } from './contact-form';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return { 
    title: `${t('title')} — coslot`,
    description: t('subtitle')
  };
}

interface ContactePageProps {
  searchParams: Promise<{ title?: string; address?: string }>;
}

export default async function ContactePage({ searchParams }: ContactePageProps) {
  const t = await getTranslations('contact');
  const { title, address } = await searchParams;
  return (
    <>
      <PageNav />
      <main className="page-content">
        <div className="contact-page">
          <header className="contact-header">
            <h1>{t('title')}</h1>
            <p className="contact-header__sub">{t('subtitle')}</p>
          </header>
          <ContactForm spaceTitle={title} spaceAddress={address} />
        </div>
      </main>
    </>
  );
}
