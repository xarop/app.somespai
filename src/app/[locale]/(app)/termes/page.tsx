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
    title: `${t('legal.termsTitle')} — coslot`,
    description: t('legal.termsTitle'),
  };
}

function TermsCA() {
  return (
    <div className="legal-body">
      <p className="legal-updated">Darrera actualització: maig de 2026</p>

      <section>
        <h2>1. Objecte i àmbit d'aplicació</h2>
        <p>Aquestes condicions d'ús regulen l'accés i la utilització de la plataforma <strong>Somespai</strong> (d'ara endavant, "la Plataforma"), gestionada per <strong>Xarop.com</strong>, accessible a través d'internet. L'ús de la Plataforma implica l'acceptació íntegra d'aquestes condicions.</p>
        <p>Si no esteu d'acord amb alguna d'aquestes condicions, us demanem que no feu servir la Plataforma.</p>
      </section>

      <section>
        <h2>2. Descripció del servei</h2>
        <p>Somespai és una plataforma de publicació i cerca d'espais disponibles per a lloguer o cessió temporal a Catalunya (sales, estudis, trasters, places d'aparcament, espais exteriors i similars). La Plataforma actua com a intermediari tècnic entre els qui ofereixen espais ("publicadors") i els qui els cerquen ("cercadors"), sense ser part de cap contracte de lloguer o cessió.</p>
        <p>Somespai no garanteix la disponibilitat, qualitat, exactitud ni legalitat dels espais publicats pels usuaris, ni la solvència o identitat de les parts.</p>
      </section>

      <section>
        <h2>3. Registre i compte d'usuari</h2>
        <ul>
          <li>Per publicar espais és necessari crear un compte amb una adreça de correu electrònic vàlida.</li>
          <li>L'usuari és responsable de mantenir la confidencialitat de les seves credencials i de tota l'activitat realitzada des del seu compte.</li>
          <li>Cada persona física o jurídica pot tenir un sol compte actiu.</li>
          <li>Podeu sol·licitar la baixa del compte en qualsevol moment enviant un correu a <a href="mailto:somespai@xarop.com">somespai@xarop.com</a>.</li>
        </ul>
      </section>

      <section>
        <h2>4. Obligacions dels publicadors</h2>
        <p>Els usuaris que publiquen espais es comprometen a:</p>
        <ul>
          <li>Proporcionar informació veraç, actualitzada i completa sobre l'espai (ubicació, preu, característiques, fotos).</li>
          <li>Tenir els drets o les autoritzacions necessàries per oferir l'espai en lloguer o cessió.</li>
          <li>Complir amb la normativa aplicable (arrendaments urbans, activitats econòmiques, normativa municipal, etc.).</li>
          <li>Actualitzar o eliminar l'anunci quan l'espai ja no estigui disponible.</li>
          <li>No publicar continguts que siguin falsos, enganyosos, il·legals o que vulnerin drets de tercers.</li>
        </ul>
      </section>

      <section>
        <h2>5. Continguts prohibits</h2>
        <p>Queda expressament prohibit publicar a la Plataforma:</p>
        <ul>
          <li>Continguts il·legals, pornogràfics, violents, discriminatoris o que inciten a l'odi.</li>
          <li>Espais l'oferta dels quals infringeixi la normativa vigent (p. ex., allotjament turístic sense llicència, activitats il·lícites).</li>
          <li>Anuncis falsos, duplicats o destinats a enganyar els cercadors.</li>
          <li>Informació de contacte de tercers sense el seu consentiment.</li>
          <li>Continguts que vulnerin drets de propietat intel·lectual o industrial de tercers.</li>
        </ul>
        <p>Somespai es reserva el dret d'eliminar qualsevol contingut que incompleixi aquestes condicions, sense previ avís i sense dret a indemnització.</p>
      </section>

      <section>
        <h2>6. Propietat intel·lectual</h2>
        <p>Tots els elements de la Plataforma (disseny, codi, logotips, textos propis) són propietat de Somespai / Xarop.com o dels seus llicenciants, i estan protegits per la legislació de propietat intel·lectual i industrial.</p>
        <p>Els usuaris que publiquen continguts (textos, fotos) cedeixen a Somespai una llicència no exclusiva, gratuïta i mundial per reproduir, mostrar i distribuir aquests continguts exclusivament en el marc del servei prestat per la Plataforma. L'usuari garanteix que és titular dels drets sobre el contingut que publica o disposa de les autoritzacions necessàries.</p>
      </section>

      <section>
        <h2>7. Limitació de responsabilitat</h2>
        <p>Somespai no es fa responsable de:</p>
        <ul>
          <li>La veracitat, exactitud o legalitat dels anuncis publicats pels usuaris.</li>
          <li>Les transaccions, acords o conflictes que es produeixin entre publicadors i cercadors.</li>
          <li>La disponibilitat ininterrompuda de la Plataforma (manteniment, errors tècnics, força major).</li>
          <li>Danys derivats de l'ús indegut de la Plataforma per part de tercers.</li>
        </ul>
        <p>En qualsevol cas, la responsabilitat màxima de Somespai es limita a l'import abonat per l'usuari durant els 12 mesos anteriors al fet que origina el dany, si n'hi ha.</p>
      </section>

      <section>
        <h2>8. Suspensió i cancel·lació del servei</h2>
        <p>Somespai pot suspendre o cancel·lar l'accés d'un usuari a la Plataforma, de forma temporal o definitiva, si es detecta un incompliment d'aquestes condicions, un ús fraudulent o qualsevol activitat que perjudiqui la Plataforma o altres usuaris. En casos greus, es podrà actuar sense previ avís.</p>
      </section>

      <section>
        <h2>9. Modificació de les condicions</h2>
        <p>Somespai es reserva el dret de modificar aquestes condicions en qualsevol moment. Els canvis significatius es comunicaran als usuaris registrats per correu electrònic o mitjançant un avís destacat a la Plataforma, amb una antelació mínima de 15 dies. L'ús continuat de la Plataforma després de l'entrada en vigor dels canvis implica l'acceptació de les noves condicions.</p>
      </section>

      <section>
        <h2>10. Llei aplicable i jurisdicció</h2>
        <p>Aquestes condicions es regeixen per la legislació espanyola, en particular per la Llei 34/2002, d'11 de juliol, de serveis de la societat de la informació i de comerç electrònic (LSSI-CE), el Reial Decret Legislatiu 1/2007 (TRLGDCU) i el Codi Civil espanyol.</p>
        <p>Per a la resolució de qualsevol controvèrsia derivada d'aquestes condicions, les parts se sotmeten, amb renúncia expressa a qualsevol altre fur, als jutjats i tribunals de la ciutat de Barcelona.</p>
        <p>Si sou consumidor/a amb residència a la UE, podeu accedir a la <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">plataforma europea de resolució de litigis en línia (ODR)</a>.</p>
      </section>

      <section>
        <h2>11. Contacte</h2>
        <p>Per a qualsevol consulta sobre aquestes condicions: <a href="mailto:somespai@xarop.com">somespai@xarop.com</a></p>
      </section>
    </div>
  );
}

function TermsES() {
  return (
    <div className="legal-body">
      <p className="legal-updated">Última actualización: mayo de 2026</p>

      <section>
        <h2>1. Objeto y ámbito de aplicación</h2>
        <p><strong>Somespai</strong> (gestionado por Xarop.com) es una plataforma de publicación y búsqueda de espacios disponibles para alquiler o cesión temporal en Cataluña. El uso de la Plataforma implica la aceptación íntegra de estas condiciones.</p>
      </section>

      <section>
        <h2>2. Descripción del servicio</h2>
        <p>Somespai actúa como intermediario técnico entre quienes ofrecen espacios ("publicadores") y quienes los buscan ("buscadores"). No es parte de ningún contrato de alquiler o cesión, y no garantiza la disponibilidad, calidad ni legalidad de los espacios publicados.</p>
      </section>

      <section>
        <h2>3. Registro y cuenta de usuario</h2>
        <p>Para publicar espacios es necesario crear una cuenta con un correo electrónico válido. El usuario es responsable de mantener la confidencialidad de sus credenciales y de toda la actividad realizada desde su cuenta.</p>
      </section>

      <section>
        <h2>4. Obligaciones de los publicadores</h2>
        <p>Los usuarios que publican espacios se comprometen a proporcionar información veraz y actualizada, a disponer de los derechos necesarios para ofrecer el espacio, a cumplir con la normativa aplicable y a eliminar el anuncio cuando el espacio ya no esté disponible.</p>
      </section>

      <section>
        <h2>5. Contenidos prohibidos</h2>
        <p>Queda prohibido publicar contenidos ilegales, falsos, engañosos, discriminatorios o que vulneren derechos de terceros. Somespai puede eliminar cualquier contenido que incumpla estas condiciones sin previo aviso.</p>
      </section>

      <section>
        <h2>6. Propiedad intelectual</h2>
        <p>Todos los elementos de la Plataforma son propiedad de Somespai / Xarop.com. Los usuarios que publican contenidos ceden a Somespai una licencia no exclusiva y gratuita para mostrarlos en el marco del servicio.</p>
      </section>

      <section>
        <h2>7. Limitación de responsabilidad</h2>
        <p>Somespai no se hace responsable de la veracidad de los anuncios, de las transacciones entre usuarios ni de la disponibilidad ininterrumpida de la Plataforma. La responsabilidad máxima se limita a los importes abonados en los 12 meses anteriores al hecho causante.</p>
      </section>

      <section>
        <h2>8. Ley aplicable y jurisdicción</h2>
        <p>Estas condiciones se rigen por la legislación española (LSSI-CE, TRLGDCU, Código Civil). Para la resolución de conflictos, las partes se someten a los juzgados y tribunales de Barcelona. Los consumidores de la UE pueden acudir a la <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">plataforma ODR</a>.</p>
      </section>

      <section>
        <h2>9. Contacto</h2>
        <p><a href="mailto:somespai@xarop.com">somespai@xarop.com</a></p>
      </section>
    </div>
  );
}

function TermsEN() {
  return (
    <div className="legal-body">
      <p className="legal-updated">Last updated: May 2026</p>

      <section>
        <h2>1. Introduction</h2>
        <p><strong>Somespai</strong> (operated by Xarop.com) is a platform for listing and finding spaces available for rent or temporary use in Catalonia. By using the Platform you accept these Terms of Use in full.</p>
      </section>

      <section>
        <h2>2. Service Description</h2>
        <p>Somespai acts as a technical intermediary between those who list spaces ("publishers") and those who search for them ("searchers"). Somespai is not a party to any rental or lending agreement and does not guarantee the accuracy, availability, or legality of listed spaces.</p>
      </section>

      <section>
        <h2>3. Account Registration</h2>
        <p>Publishing spaces requires a registered account with a valid email address. You are responsible for maintaining the confidentiality of your login credentials and for all activity on your account.</p>
      </section>

      <section>
        <h2>4. Publisher Obligations</h2>
        <p>Publishers must provide accurate and up-to-date information, hold the necessary rights to offer the space, comply with applicable law, and remove listings when the space is no longer available.</p>
      </section>

      <section>
        <h2>5. Prohibited Content</h2>
        <p>You may not publish illegal, false, misleading, or discriminatory content, or content that infringes third-party rights. Somespai may remove non-compliant content without notice.</p>
      </section>

      <section>
        <h2>6. Intellectual Property</h2>
        <p>All Platform elements are owned by Somespai / Xarop.com. By publishing content you grant Somespai a non-exclusive, royalty-free licence to display that content within the service.</p>
      </section>

      <section>
        <h2>7. Limitation of Liability</h2>
        <p>Somespai is not liable for the accuracy of listings, transactions between users, or Platform unavailability. Maximum liability is limited to amounts paid in the 12 months preceding the claim.</p>
      </section>

      <section>
        <h2>8. Governing Law</h2>
        <p>These Terms are governed by Spanish law (LSSI-CE, TRLGDCU, Civil Code). Disputes shall be submitted to the courts of Barcelona. EU consumers may use the <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">EU ODR platform</a>.</p>
      </section>

      <section>
        <h2>9. Contact</h2>
        <p><a href="mailto:somespai@xarop.com">somespai@xarop.com</a></p>
      </section>
    </div>
  );
}

export default async function TermesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('legal');

  return (
    <>
      <PageNav />
      <div className="seo-page">
        <div className="seo-page__inner seo-page__inner--wide">
          <header className="seo-page__header">
            <h1>{t('termsTitle')}</h1>
          </header>
          {locale === 'es' ? <TermsES /> : locale === 'en' ? <TermsEN /> : <TermsCA />}
        </div>
      </div>
    </>
  );
}
