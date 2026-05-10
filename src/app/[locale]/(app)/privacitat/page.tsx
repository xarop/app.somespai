import { setRequestLocale, getTranslations } from 'next-intl/server';
import { PageNav } from '@/components/ui/page-nav';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: `${t('legal.privacyTitle')} — somespai`,
    description: t('legal.privacyTitle'),
  };
}

function PrivacyCA() {
  return (
    <div className="legal-body">
      <p className="legal-updated">Darrera actualització: maig de 2026</p>

      <section>
        <h2>1. Responsable del tractament</h2>
        <p>El responsable del tractament de les dades personals és <strong>Somespai</strong> (gestionat per Xarop.com), amb adreça de contacte electrònic: <a href="mailto:somespai@xarop.com">somespai@xarop.com</a>.</p>
      </section>

      <section>
        <h2>2. Quines dades recopilem</h2>
        <ul>
          <li><strong>Dades de compte:</strong> adreça de correu electrònic i, opcionalment, nom visible, en el moment del registre.</li>
          <li><strong>Dades d'espai publicat:</strong> títol, descripció, adreça, coordenades geogràfiques, preu, fotos i informació de contacte que l'usuari proporciona en publicar un espai.</li>
          <li><strong>Dades d'ús:</strong> pàgines visitades, cerques realitzades i altres dades d'analítica web (Google Analytics / Vercel Analytics) de forma agregada i anonimitzada.</li>
          <li><strong>Cookies tècniques:</strong> necessàries per mantenir la sessió autenticada.</li>
        </ul>
      </section>

      <section>
        <h2>3. Finalitats i base jurídica</h2>
        <table className="legal-table">
          <thead>
            <tr><th>Finalitat</th><th>Base jurídica</th></tr>
          </thead>
          <tbody>
            <tr><td>Gestionar el compte d'usuari</td><td>Execució d'un contracte (art. 6.1.b RGPD)</td></tr>
            <tr><td>Publicar i gestionar espais</td><td>Execució d'un contracte (art. 6.1.b RGPD)</td></tr>
            <tr><td>Enviar comunicacions relacionades amb el servei</td><td>Interès legítim (art. 6.1.f RGPD)</td></tr>
            <tr><td>Millorar el servei mitjançant analítica</td><td>Consentiment (art. 6.1.a RGPD)</td></tr>
            <tr><td>Complir obligacions legals</td><td>Obligació legal (art. 6.1.c RGPD)</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>4. Conservació de les dades</h2>
        <p>Les dades de compte es conserven mentre el compte estigui actiu. Un cop sol·licitada la baixa, les dades s'eliminen en un termini màxim de <strong>30 dies</strong>, excepte les que siguin necessàries per complir obligacions legals (fins a 5 anys per a dades fiscals i contractuals).</p>
        <p>Els espais publicats i les seves dades associades es conserven mentre estiguin actius. Si un espai s'elimina, les seves dades deixen d'estar visibles públicament de manera immediata.</p>
      </section>

      <section>
        <h2>5. Destinataris de les dades</h2>
        <p>Les dades no es venen ni es cedeixen a tercers. Es comparteixen exclusivament amb els proveïdors tècnics necessaris per prestar el servei:</p>
        <ul>
          <li><strong>Supabase Inc.</strong> (base de dades i autenticació) — EUA, amb clàusules contractuals tipus aprovades per la Comissió Europea.</li>
          <li><strong>Vercel Inc.</strong> (allotjament web) — EUA, amb clàusules contractuals tipus aprovades per la Comissió Europea.</li>
          <li><strong>Google LLC</strong> (analítica web) — EUA, amb dades anonimitzades.</li>
        </ul>
      </section>

      <section>
        <h2>6. Transferències internacionals</h2>
        <p>Els proveïdors esmentats anteriorment estan ubicats als Estats Units. Les transferències es realitzen amb les garanties adequades previstes al Capítol V del RGPD (clàusules contractuals tipus o Marc de Privacitat UE–EUA).</p>
      </section>

      <section>
        <h2>7. Drets dels usuaris</h2>
        <p>D'acord amb el RGPD i la LOPDGDD, teniu dret a:</p>
        <ul>
          <li><strong>Accés:</strong> obtenir confirmació de si tractem les vostres dades i una còpia.</li>
          <li><strong>Rectificació:</strong> corregir dades inexactes o incompletes.</li>
          <li><strong>Supressió ("dret a l'oblit"):</strong> sol·licitar l'eliminació de les vostres dades.</li>
          <li><strong>Limitació:</strong> restringir el tractament en determinades circumstàncies.</li>
          <li><strong>Portabilitat:</strong> rebre les vostres dades en format estructurat i llegible per màquina.</li>
          <li><strong>Oposició:</strong> oposar-vos al tractament basat en interès legítim.</li>
          <li><strong>Retirada del consentiment:</strong> en qualsevol moment, per als tractaments basats en consentiment.</li>
        </ul>
        <p>Per exercir aquests drets, envieu un correu a <a href="mailto:somespai@xarop.com">somespai@xarop.com</a>. Respondrem en un termini màxim de <strong>30 dies</strong>. Si no quedeu satisfets, podeu presentar una reclamació davant l'<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">Agència Espanyola de Protecció de Dades (AEPD)</a>.</p>
      </section>

      <section>
        <h2>8. Seguretat</h2>
        <p>Apliquem mesures tècniques i organitzatives per protegir les dades: connexions xifrades (HTTPS/TLS), autenticació segura, control d'accés per rol i còpies de seguretat periòdiques. En cas de bretxa de seguretat que afecti els vostres drets, us notificarem en el termini legalment establert.</p>
      </section>

      <section>
        <h2>9. Cookies</h2>
        <p>Utilitzem únicament cookies tècniques estrictament necessàries per mantenir la sessió d'usuari. No fem servir cookies publicitàries ni de seguiment de tercers. L'analítica web es realitza de manera agregada i no permet la identificació individual dels usuaris.</p>
      </section>

      <section>
        <h2>10. Modificacions</h2>
        <p>Podrem actualitzar aquesta política per adaptar-la a canvis legals o del servei. Us notificarem els canvis significatius per correu electrònic o mitjançant un avís destacat a la plataforma. La data de la darrera actualització apareix a l'inici d'aquest document.</p>
      </section>

      <section>
        <h2>11. Contacte</h2>
        <p>Per a qualsevol qüestió relacionada amb la privacitat, contacteu amb nosaltres a: <a href="mailto:somespai@xarop.com">somespai@xarop.com</a></p>
      </section>
    </div>
  );
}

function PrivacyES() {
  return (
    <div className="legal-body">
      <p className="legal-updated">Última actualización: mayo de 2026</p>

      <section>
        <h2>1. Responsable del tratamiento</h2>
        <p>El responsable del tratamiento de datos personales es <strong>Somespai</strong> (gestionado por Xarop.com), con dirección de contacto electrónico: <a href="mailto:somespai@xarop.com">somespai@xarop.com</a>.</p>
      </section>

      <section>
        <h2>2. Datos que recopilamos</h2>
        <ul>
          <li><strong>Datos de cuenta:</strong> dirección de correo electrónico y, opcionalmente, nombre visible, en el momento del registro.</li>
          <li><strong>Datos de espacio publicado:</strong> título, descripción, dirección, coordenadas geográficas, precio, fotos e información de contacto que el usuario facilita al publicar un espacio.</li>
          <li><strong>Datos de uso:</strong> páginas visitadas, búsquedas realizadas y otros datos de analítica web de forma agregada y anonimizada.</li>
          <li><strong>Cookies técnicas:</strong> necesarias para mantener la sesión autenticada.</li>
        </ul>
      </section>

      <section>
        <h2>3. Finalidades y base jurídica</h2>
        <table className="legal-table">
          <thead>
            <tr><th>Finalidad</th><th>Base jurídica</th></tr>
          </thead>
          <tbody>
            <tr><td>Gestionar la cuenta de usuario</td><td>Ejecución de un contrato (art. 6.1.b RGPD)</td></tr>
            <tr><td>Publicar y gestionar espacios</td><td>Ejecución de un contrato (art. 6.1.b RGPD)</td></tr>
            <tr><td>Enviar comunicaciones del servicio</td><td>Interés legítimo (art. 6.1.f RGPD)</td></tr>
            <tr><td>Mejorar el servicio mediante analítica</td><td>Consentimiento (art. 6.1.a RGPD)</td></tr>
            <tr><td>Cumplir obligaciones legales</td><td>Obligación legal (art. 6.1.c RGPD)</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>4. Conservación de los datos</h2>
        <p>Los datos de cuenta se conservan mientras la cuenta esté activa. Tras solicitar la baja, los datos se eliminan en un plazo máximo de <strong>30 días</strong>, salvo los necesarios para cumplir obligaciones legales (hasta 5 años para datos fiscales y contractuales).</p>
      </section>

      <section>
        <h2>5. Destinatarios de los datos</h2>
        <p>Los datos no se venden ni ceden a terceros. Se comparten exclusivamente con proveedores técnicos necesarios para prestar el servicio: Supabase Inc., Vercel Inc. y Google LLC, todos con garantías adecuadas para transferencias internacionales.</p>
      </section>

      <section>
        <h2>6. Derechos de los usuarios</h2>
        <p>Conforme al RGPD y la LOPDGDD, tiene derecho a acceder, rectificar, suprimir, limitar, portar y oponerse al tratamiento de sus datos. Para ejercer estos derechos, escríbanos a <a href="mailto:somespai@xarop.com">somespai@xarop.com</a>. Si no queda satisfecho, puede reclamar ante la <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">Agencia Española de Protección de Datos (AEPD)</a>.</p>
      </section>

      <section>
        <h2>7. Seguridad y cookies</h2>
        <p>Aplicamos medidas de seguridad técnicas y organizativas (HTTPS, autenticación segura, control de acceso). Utilizamos únicamente cookies técnicas estrictamente necesarias para la sesión del usuario.</p>
      </section>

      <section>
        <h2>8. Contacto</h2>
        <p><a href="mailto:somespai@xarop.com">somespai@xarop.com</a></p>
      </section>
    </div>
  );
}

function PrivacyEN() {
  return (
    <div className="legal-body">
      <p className="legal-updated">Last updated: May 2026</p>

      <section>
        <h2>1. Data Controller</h2>
        <p><strong>Somespai</strong> (operated by Xarop.com) is the data controller. Contact: <a href="mailto:somespai@xarop.com">somespai@xarop.com</a>.</p>
      </section>

      <section>
        <h2>2. Data We Collect</h2>
        <ul>
          <li><strong>Account data:</strong> email address and optional display name at registration.</li>
          <li><strong>Listing data:</strong> title, description, address, coordinates, price, photos and contact details provided when publishing a space.</li>
          <li><strong>Usage data:</strong> aggregated, anonymised analytics (pages visited, searches).</li>
          <li><strong>Technical cookies:</strong> strictly necessary to maintain authenticated sessions.</li>
        </ul>
      </section>

      <section>
        <h2>3. Purposes and Legal Basis</h2>
        <table className="legal-table">
          <thead>
            <tr><th>Purpose</th><th>Legal basis</th></tr>
          </thead>
          <tbody>
            <tr><td>Manage user account</td><td>Contract performance (Art. 6(1)(b) GDPR)</td></tr>
            <tr><td>Publish and manage spaces</td><td>Contract performance (Art. 6(1)(b) GDPR)</td></tr>
            <tr><td>Send service communications</td><td>Legitimate interest (Art. 6(1)(f) GDPR)</td></tr>
            <tr><td>Improve service via analytics</td><td>Consent (Art. 6(1)(a) GDPR)</td></tr>
            <tr><td>Comply with legal obligations</td><td>Legal obligation (Art. 6(1)(c) GDPR)</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>4. Data Retention</h2>
        <p>Account data is retained while your account is active, then deleted within <strong>30 days</strong> of account closure (except where required by law for up to 5 years).</p>
      </section>

      <section>
        <h2>5. Recipients and International Transfers</h2>
        <p>Data is shared only with technical providers: Supabase Inc., Vercel Inc. and Google LLC (all US-based, with EU Standard Contractual Clauses or equivalent safeguards).</p>
      </section>

      <section>
        <h2>6. Your Rights</h2>
        <p>Under GDPR you have the right to access, rectify, erase, restrict, port and object to processing of your data. Contact us at <a href="mailto:somespai@xarop.com">somespai@xarop.com</a>. You may also lodge a complaint with the <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">Spanish Data Protection Authority (AEPD)</a>.</p>
      </section>

      <section>
        <h2>7. Security and Cookies</h2>
        <p>We implement appropriate technical and organisational security measures. We use only strictly necessary technical cookies to maintain user sessions.</p>
      </section>

      <section>
        <h2>8. Contact</h2>
        <p><a href="mailto:somespai@xarop.com">somespai@xarop.com</a></p>
      </section>
    </div>
  );
}

export default async function PrivacitatPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('legal');

  return (
    <>
      <PageNav />
      <div className="seo-page">
        <div className="seo-page__inner seo-page__inner--wide">
          <header className="seo-page__header">
            <h1>{t('privacyTitle')}</h1>
          </header>
          {locale === 'es' ? <PrivacyES /> : locale === 'en' ? <PrivacyEN /> : <PrivacyCA />}
        </div>
      </div>
    </>
  );
}
