import React from "react";
import { Link } from "react-router-dom";

const AccessibilityPage = () => {
  const sections = [
    { id: "commitment", title: "01. Our Commitment" },
    { id: "features", title: "02. Accessibility Features" },
    { id: "ongoing", title: "03. Ongoing Improvements" },
    { id: "limitations", title: "04. Known Limitations" },
    { id: "feedback", title: "05. Feedback & Support" },
    { id: "third-party", title: "06. Third-Party Content" },
    { id: "enhancements", title: "07. Future Enhancements" },
  ];

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 180; // Adjust based on header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="page-shell pb-20">
      <div className="border-b border-line-weak bg-white">
        <div className="app-container flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-brand-ink">
            Accessibility Statement
          </h1>
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-sm text-ink-muted"
          >
            <Link
              to="/dashboard"
              className="transition-colors hover:text-brand-action"
            >
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-brand-ink">Accessibility Statement</span>
          </nav>
        </div>
      </div>

      <div className="app-container pt-8 md:pt-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-12">
          <article className="panel min-w-0 p-6 md:p-10">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl">
                Accessibility Statement
              </h1>
              <p className="mt-2 text-sm text-ink-subtle">
                Last Updated: January 2025
              </p>
            </div>

            <div className="space-y-[40px]">
              {/* Commitment */}
              <section id="commitment">
                <h2 className="section-title mb-3">
                  1. Our Commitment
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  We are committed to making our platform accessible and usable
                  for all individuals, including users with disabilities. Our
                  goal is to align with the Web Content Accessibility Guidelines
                  (WCAG) 2.1 Level AA and ensure that everyone can access our
                  services without barriers.
                </p>
              </section>

              {/* Accessibility Features */}
              <section id="features">
                <h2 className="section-title mb-3">
                  2. Accessibility Features
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  To support a wide range of accessibility needs, our platform
                  includes several built-in features. These include
                  keyboard-friendly navigation for users who cannot operate a
                  mouse, screen-reader compatibility for visually impaired
                  users, high-contrast text and color options, scalable font
                  sizes, accessible form labels with clear error messages, and
                  ARIA attributes to assist with assistive technologies. These
                  features aim to provide a more inclusive experience for all
                  users.
                </p>
              </section>

              {/* Ongoing Improvements */}
              <section id="ongoing">
                <h2 className="section-title mb-3">
                  3. Ongoing Improvements
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  Accessibility is an ongoing process. We frequently review and
                  audit our platform to identify any areas that may require
                  improvement. Our team is committed to updating and enhancing
                  accessibility features regularly to maintain compliance and
                  provide an equitable experience.
                </p>
              </section>

              {/* Known Limitations */}
              <section id="limitations">
                <h2 className="section-title mb-3">
                  4. Known Limitations
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  Despite our efforts, certain areas of the platform may not yet
                  be fully accessible. Some visual elements, interactive
                  components, or third-party tools may present challenges. We
                  acknowledge these limitations and are actively working to
                  resolve them in future updates.
                </p>
              </section>

              {/* Feedback & Support */}
              <section id="feedback">
                <h2 className="section-title mb-3">
                  5. Feedback & Support
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  We welcome feedback about accessibility issues or suggestions
                  for improvement. If you encounter difficulty accessing any
                  part of the platform, please contact us at:
                  <br />
                  Email : support@example.com
                  <br />
                  We aim to respond within 48 hours and will do our best to
                  assist you or resolve the issue promptly.
                </p>
              </section>

              {/* Third-Party Content */}
              <section id="third-party">
                <h2 className="section-title mb-3">
                  6. Third-Party Content
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  Some content or tools integrated into our platform may come
                  from third-party providers. As a result, certain accessibility
                  features may not be fully supported. We work with these
                  partners to encourage improvements and provide users with the
                  best possible experience.
                </p>
              </section>

              {/* Future Enhancements */}
              <section id="enhancements">
                <h2 className="section-title mb-3">
                  7. Future Enhancements
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  We are planning additional improvements to further enhance
                  accessibility. Upcoming features may include improved
                  text-to-speech support, more robust voice navigation options,
                  and an accessibility preferences panel that allows users to
                  customize their experience according to their needs.
                </p>
              </section>
            </div>
          </article>

          <aside className="hidden lg:block">
            <div className="panel sticky top-24 p-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                Table of Contents
              </h3>
              <ul className="space-y-3">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(section.id)}
                      className="text-left text-sm text-ink-muted transition-colors hover:text-brand-action"
                    >
                      {section.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityPage;
