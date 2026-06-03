import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crisis Resources",
  description:
    "If tonight is harder than it should be: 988, Crisis Text Line, the National Domestic Violence Hotline, and more. The light will stay.",
};

/**
 * The Long Light — public crisis resources page.
 *
 * Adapted from Stone Harbor's /crisis-resources with the Long Light
 * voice (softer, patient, second-person) and the women-specific
 * resource emphasis called for in the Brand Foundation §3: the
 * National Domestic Violence Hotline is surfaced prominently,
 * postpartum support and pregnancy-loss support are added.
 *
 * Reachable without signing in. Linked from LongLightCrisisFooter on
 * every page. Semantic HTML throughout — this page may be read by a
 * screen reader in a moment when every barrier matters.
 */
export default function CrisisResourcesPage() {
  return (
    <main className="px-6 py-16 max-w-2xl mx-auto">
      <header className="mb-12">
        <h1 className="font-serif text-4xl md:text-5xl leading-tight mb-6 text-[var(--primary)]">
          If you&rsquo;re in crisis, you don&rsquo;t have to be here.
        </h1>
        <p className="font-serif text-lg text-[var(--text-primary)] leading-relaxed mb-4">
          The Long Light is a quiet place. It is not where the help you need
          right now lives. The numbers and links below connect you to people
          whose work is to be with you in this hour.
        </p>
        <p className="font-sans text-base text-[var(--text-secondary)] leading-relaxed">
          Call, or text, or click. The light will stay. It will be here when
          you come back.
        </p>
      </header>

      {/* Primary resources — first, large, tappable */}
      <section aria-labelledby="primary-resources" className="mb-14">
        <h2 id="primary-resources" className="sr-only">
          Immediate help
        </h2>

        <div className="space-y-8">
          <article className="border-l-2 border-[var(--danger)] pl-5">
            <h3 className="font-serif text-2xl text-[var(--primary)] mb-2">
              988 Suicide &amp; Crisis Lifeline
            </h3>
            <p className="font-sans text-sm text-[var(--text-secondary)] mb-3">
              For anyone in emotional distress, or thinking about suicide.
            </p>
            <p className="font-sans text-base text-[var(--text-primary)]">
              <a href="tel:988" className="text-[var(--primary)] underline underline-offset-2">
                Call 988
              </a>
              {" · "}
              <a href="sms:988" className="text-[var(--primary)] underline underline-offset-2">
                Text 988
              </a>
              {" · "}
              <a
                href="https://988lifeline.org/chat/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--primary)] underline underline-offset-2"
              >
                Chat online
              </a>
            </p>
            <p className="font-sans text-xs text-[var(--text-secondary)] mt-2">
              24/7, in English and Spanish. Free and confidential.
            </p>
          </article>

          <article className="border-l-2 border-[var(--danger)] pl-5">
            <h3 className="font-serif text-2xl text-[var(--primary)] mb-2">
              Crisis Text Line
            </h3>
            <p className="font-sans text-sm text-[var(--text-secondary)] mb-3">
              For text-first support, if calling is hard right now.
            </p>
            <p className="font-sans text-base text-[var(--text-primary)]">
              <a
                href="sms:741741?body=HOME"
                className="text-[var(--primary)] underline underline-offset-2"
              >
                Text HOME to 741741
              </a>
            </p>
            <p className="font-sans text-xs text-[var(--text-secondary)] mt-2">
              24/7 in the US, Canada, UK, and Ireland. Free and confidential.
            </p>
          </article>

          <article className="border-l-2 border-[var(--danger)] pl-5">
            <h3 className="font-serif text-2xl text-[var(--primary)] mb-2">
              National Domestic Violence Hotline
            </h3>
            <p className="font-sans text-sm text-[var(--text-secondary)] mb-3">
              For anyone living with domestic violence, witnessing it, or
              trying to help someone who is.
            </p>
            <p className="font-sans text-base text-[var(--text-primary)]">
              <a
                href="tel:18007997233"
                className="text-[var(--primary)] underline underline-offset-2"
              >
                Call 1-800-799-7233
              </a>
              {" · "}
              <a
                href="sms:88788?body=START"
                className="text-[var(--primary)] underline underline-offset-2"
              >
                Text START to 88788
              </a>
              {" · "}
              <a
                href="https://www.thehotline.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--primary)] underline underline-offset-2"
              >
                Chat online
              </a>
            </p>
            <p className="font-sans text-xs text-[var(--text-secondary)] mt-2">
              24/7. Free and confidential. More than 200 languages available.
            </p>
          </article>

          <article className="border-l-2 border-[var(--danger)] pl-5">
            <h3 className="font-serif text-2xl text-[var(--primary)] mb-2">
              911 &mdash; Emergency
            </h3>
            <p className="font-sans text-base text-[var(--text-primary)]">
              If you are in immediate physical danger, or someone you love is,
              call{" "}
              <a href="tel:911" className="text-[var(--primary)] underline underline-offset-2">
                911
              </a>
              . Outside the US, dial your local emergency number.
            </p>
          </article>
        </div>
      </section>

      {/* Additional resources */}
      <section aria-labelledby="more-resources" className="mb-14">
        <h2
          id="more-resources"
          className="font-serif text-2xl text-[var(--primary)] mb-6"
        >
          If you&rsquo;re looking for something more specific.
        </h2>

        <dl className="space-y-6 font-sans text-[var(--text-primary)]">
          <div>
            <dt className="font-serif text-lg text-[var(--primary)]">
              Postpartum Support International
            </dt>
            <dd className="text-sm text-[var(--text-secondary)] mt-1">
              For the weight of new motherhood, postpartum depression, anxiety,
              and the parts of it no one named for you.{" "}
              <a
                href="tel:18009444773"
                className="text-[var(--primary)] underline underline-offset-2"
              >
                Call 1-800-944-4773
              </a>
              {" · "}
              <a
                href="sms:800-944-4773"
                className="text-[var(--primary)] underline underline-offset-2"
              >
                Text 800-944-4773
              </a>
              {" · "}
              <a
                href="https://www.postpartum.net/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--primary)] underline underline-offset-2"
              >
                postpartum.net
              </a>
            </dd>
          </div>

          <div>
            <dt className="font-serif text-lg text-[var(--primary)]">
              Pregnancy &amp; Infant Loss Support
            </dt>
            <dd className="text-sm text-[var(--text-secondary)] mt-1">
              For miscarriage, stillbirth, and the loss of an imagined future.
              Share Pregnancy &amp; Infant Loss Support:{" "}
              <a
                href="tel:18008212142"
                className="text-[var(--primary)] underline underline-offset-2"
              >
                1-800-821-6819
              </a>
              {" · "}
              <a
                href="https://nationalshare.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--primary)] underline underline-offset-2"
              >
                nationalshare.org
              </a>
            </dd>
          </div>

          <div>
            <dt className="font-serif text-lg text-[var(--primary)]">
              National Sexual Assault Hotline (RAINN)
            </dt>
            <dd className="text-sm text-[var(--text-secondary)] mt-1">
              For survivors of sexual assault, recent or long past.{" "}
              <a
                href="tel:18006564673"
                className="text-[var(--primary)] underline underline-offset-2"
              >
                Call 1-800-656-4673
              </a>
              {" · "}
              <a
                href="https://www.rainn.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--primary)] underline underline-offset-2"
              >
                rainn.org
              </a>
            </dd>
          </div>

          <div>
            <dt className="font-serif text-lg text-[var(--primary)]">
              SAMHSA National Helpline
            </dt>
            <dd className="text-sm text-[var(--text-secondary)] mt-1">
              For mental health and substance use &mdash; treatment referrals,
              information, support.{" "}
              <a
                href="tel:18006624357"
                className="text-[var(--primary)] underline underline-offset-2"
              >
                Call 1-800-662-4357
              </a>
              . 24/7, free and confidential, in English and Spanish.
            </dd>
          </div>

          <div>
            <dt className="font-serif text-lg text-[var(--primary)]">
              Veterans Crisis Line
            </dt>
            <dd className="text-sm text-[var(--text-secondary)] mt-1">
              For veterans, service members, and the people who love them.{" "}
              <a
                href="tel:988"
                className="text-[var(--primary)] underline underline-offset-2"
              >
                Call 988, then press 1
              </a>
              {" · "}
              <a
                href="sms:838255"
                className="text-[var(--primary)] underline underline-offset-2"
              >
                Text 838255
              </a>
            </dd>
          </div>

          <div>
            <dt className="font-serif text-lg text-[var(--primary)]">
              The Trevor Project
            </dt>
            <dd className="text-sm text-[var(--text-secondary)] mt-1">
              For LGBTQ+ young people in crisis, or anyone holding questions of
              identity in a hard moment.{" "}
              <a
                href="tel:18664887386"
                className="text-[var(--primary)] underline underline-offset-2"
              >
                Call 1-866-488-7386
              </a>
              {" · "}
              <a
                href="sms:678678?body=START"
                className="text-[var(--primary)] underline underline-offset-2"
              >
                Text START to 678-678
              </a>
            </dd>
          </div>
        </dl>
      </section>

      {/* En español */}
      <section aria-labelledby="en-espanol" className="mb-14">
        <h2
          id="en-espanol"
          className="font-serif text-2xl text-[var(--primary)] mb-6"
        >
          En español
        </h2>
        <dl className="space-y-6 font-sans text-[var(--text-primary)]">
          <div>
            <dt className="font-serif text-lg text-[var(--primary)]">
              Línea 988 &mdash; Prevención del Suicidio
            </dt>
            <dd className="text-sm text-[var(--text-secondary)] mt-1">
              Para cualquier persona en angustia emocional.{" "}
              <a href="tel:988" className="text-[var(--primary)] underline underline-offset-2">
                Llama al 988
              </a>
              {" · "}
              <a
                href="sms:988?body=AYUDA"
                className="text-[var(--primary)] underline underline-offset-2"
              >
                Escribe AYUDA al 988
              </a>
              . 24/7, gratuito y confidencial.
            </dd>
          </div>
          <div>
            <dt className="font-serif text-lg text-[var(--primary)]">
              Línea Nacional de Violencia Doméstica
            </dt>
            <dd className="text-sm text-[var(--text-secondary)] mt-1">
              <a
                href="tel:18007997233"
                className="text-[var(--primary)] underline underline-offset-2"
              >
                Llama al 1-800-799-7233
              </a>
              . 24/7, en más de 200 idiomas.
            </dd>
          </div>
        </dl>
      </section>

      {/* International */}
      <section aria-labelledby="international" className="mb-14">
        <h2
          id="international"
          className="font-serif text-2xl text-[var(--primary)] mb-6"
        >
          Outside the United States
        </h2>
        <ul className="space-y-2 font-sans text-sm text-[var(--text-secondary)]">
          <li>
            <strong className="text-[var(--text-primary)]">Canada:</strong> Talk
            Suicide Canada &mdash;{" "}
            <a href="tel:18334564566" className="text-[var(--primary)] underline underline-offset-2">
              1-833-456-4566
            </a>
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">UK &amp; Ireland:</strong>{" "}
            Samaritans &mdash;{" "}
            <a href="tel:116123" className="text-[var(--primary)] underline underline-offset-2">
              116 123
            </a>
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">Australia:</strong>{" "}
            Lifeline &mdash;{" "}
            <a href="tel:131114" className="text-[var(--primary)] underline underline-offset-2">
              13 11 14
            </a>
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">Mexico:</strong> SAPTEL
            &mdash;{" "}
            <a href="tel:5552598121" className="text-[var(--primary)] underline underline-offset-2">
              55 5259 8121
            </a>
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">Worldwide:</strong>{" "}
            <a
              href="https://findahelpline.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary)] underline underline-offset-2"
            >
              findahelpline.com
            </a>
          </li>
        </ul>
      </section>

      {/* Closing note */}
      <section className="border-t border-[var(--background-recessed)] pt-8">
        <p className="font-serif text-lg text-[var(--text-primary)] leading-relaxed">
          If none of these is the right one for what you&rsquo;re carrying,
          that&rsquo;s all right. Finding the right help can take more than one
          call. Keep going. You are worth the effort it takes.
        </p>
        <p className="font-serif text-lg text-[var(--text-secondary)] leading-relaxed mt-4">
          The light is patient. It will be here.
        </p>
      </section>
    </main>
  );
}
