import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect, notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { PageNav } from '@/components/ui/page-nav';

interface ImportJobPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function ImportJobPage({ params }: ImportJobPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  let authorized = false;
  if (user) {
    if (user.email === adminEmail) {
      authorized = true;
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      if (profile?.is_admin) authorized = true;
    }
  }
  if (!authorized) redirect('/');

  const { id } = await params;
  const locale = await getLocale();

  const db = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: job } = await db
    .from('import_jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (!job) notFound();

  const { data: spaces } = await db
    .from('spaces')
    .select('id, slug, title, type, address, status, verified, external_url, source')
    .eq('import_job_id', id)
    .order('created_at', { ascending: false });

  return (
    <>
      <PageNav />
      <div className="page-form">
        <div className="page-form__inner page-form__inner--wide">
          <header className="page-form__header">
            <a href={`/${locale}/admin`} className="page-form__back">
              ←
            </a>
            <h1>Importació: {job.query}</h1>
          </header>

          <div className="import-job-meta">
            <span>
              <strong>Font:</strong> {job.source}
            </span>
            <span>
              <strong>Data:</strong>{' '}
              {new Date(job.created_at).toLocaleDateString('ca-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span>
              <strong>Espais importats:</strong> {job.space_count}
            </span>
          </div>

          {spaces && spaces.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Títol</th>
                  <th>Tipus</th>
                  <th>Adreça</th>
                  <th>Estat</th>
                  <th>Accions</th>
                </tr>
              </thead>
              <tbody>
                {spaces.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <a href={`/${locale}/espai/${s.slug}`} target="_blank" rel="noopener noreferrer">
                        {s.title}
                      </a>
                    </td>
                    <td>
                      <span className={`type-badge type-badge--${s.type}`}>{s.type}</span>
                    </td>
                    <td>{s.address ?? '—'}</td>
                    <td>
                      <span className={`status-badge status-badge--${s.status}`}>{s.status}</span>
                      {!s.verified && (
                        <span className="status-badge status-badge--pending" style={{ marginLeft: 4 }}>
                          no verificat
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="admin-actions">
                        <a
                          href={`/${locale}/admin?edit=${s.id}`}
                          className="admin-action-btn admin-action-btn--edit"
                        >
                          Editar
                        </a>
                        {s.external_url && (
                          <a
                            href={s.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-action-btn"
                          >
                            Maps ↗
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="admin-empty">Cap espai associat a aquesta importació.</p>
          )}
        </div>
      </div>
    </>
  );
}
