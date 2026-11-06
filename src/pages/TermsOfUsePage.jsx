import React from "react";
import { Link } from "react-router-dom";

const TermsOfUsePage = () => {
  const sections = [
    { id: "acceptance", title: "01. Acceptance of Terms" },
    { id: "platform-purpose", title: "02. Platform Purpose" },
    { id: "account-responsibilities", title: "03. Account Responsibilities" },
    { id: "employer-responsibilities", title: "04. Employer Responsibilities" },
    { id: "prohibited-activities", title: "05. Prohibited Activities" },
    { id: "content-ownership", title: "06. Content Ownership" },
    { id: "disclaimer", title: "07. Job Application Disclaimer" },
    { id: "liability", title: "08. Limitation of Liability" },
    { id: "termination", title: "09. Termination" },
    { id: "updates", title: "10. Updates to Terms" },
    { id: "contact", title: "11. Contact Information" },
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
          <h1 className="text-xl font-bold text-brand-ink">Terms of Use</h1>
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
            <span className="text-brand-ink">Terms of Use</span>
          </nav>
        </div>
      </div>

      <div className="app-container pt-8 md:pt-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-12">
          <article className="panel min-w-0 p-6 md:p-10">
            <div className="mb-10">
              <h1 className="text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl">
                Terms of Use
              </h1>
              <p className="mt-2 text-sm text-ink-subtle">
                Last Updated: January 2025
              </p>
            </div>

            <div className="space-y-10">
              {/* Acceptance */}
              <section id="acceptance">
                <h2 className="section-title mb-3">
                  1. Acceptance of Terms
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  By accessing or using our platform, you agree to be bound by
                  these Terms of Use. These terms apply to all users, including
                  job seekers, professionals, and employers across diverse industries.
                  If you do not agree with any part of these terms, you must
                  discontinue use of the platform immediately.
                </p>
              </section>

              {/* Platform Purpose */}
              <section id="platform-purpose">
                <h2 className="section-title mb-3">
                  2. Platform Purpose
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  Our platform is created to connect healthcare professionals
                  with verified job opportunities and to help employers
                  efficiently find qualified candidates. Users are required to
                  provide accurate, truthful, and up-to-date information so that
                  job matching and communication remain effective and
                  trustworthy.
                </p>
              </section>

              {/* Account Responsibilities */}
              <section id="account-responsibilities">
                <h2 className="section-title mb-3">
                  3. Account Responsibilities
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  You are responsible for maintaining the confidentiality of
                  your login credentials and ensuring that all information
                  associated with your account remains accurate and current. Any
                  actions performed under your account are considered your
                  responsibility. If you suspect unauthorized access, you must
                  notify us immediately to prevent misuse or security risks.
                </p>
              </section>

              {/* Employer Responsibilities */}
              <section id="employer-responsibilities">
                <h2 className="section-title mb-3">
                  4. Employer Responsibilities
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  Employers agree to post genuine, lawful, and
                  non-discriminatory job listings. All job-related details such
                  as salary, schedule, experience requirements, and job location
                  must be accurate. Employers must use candidate information
                  only for hiring purposes and must refrain from sharing,
                  selling, or misusing personal data in any manner.
                </p>
              </section>

              {/* Prohibited Activities */}
              <section id="prohibited-activities">
                <h2 className="section-title mb-3">
                  5. Prohibited Activities
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  You must not engage in any actions that may harm the platform
                  or other users. This includes uploading harmful content,
                  posting fraudulent job listings, impersonating individuals or
                  organizations, attempting to hack or disrupt the system, or
                  using automation tools or bots to manipulate data. Violations
                  may result in account suspension or legal action.
                </p>
              </section>

              {/* Content Ownership */}
              <section id="content-ownership">
                <h2 className="section-title mb-3">
                  6. Content Ownership
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  All content on the platform—including text, logos, images,
                  graphics, layouts, and software—is owned by the platform or
                  its licensors. Users are not permitted to copy, modify,
                  reproduce, or redistribute any platform content without prior
                  written permission.
                </p>
              </section>

              {/* Disclaimer */}
              <section id="disclaimer">
                <h2 className="section-title mb-3">
                  7. Job Application Disclaimer
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  The platform acts as a connecting system and does not
                  guarantee employment, interview opportunities, or hiring
                  outcomes. We do not verify or guarantee the accuracy of all
                  employer claims, job postings, or candidate information. Both
                  candidates and employers should independently verify job
                  details before proceeding.
                </p>
              </section>

              {/* Limitation of Liability */}
              <section id="liability">
                <h2 className="section-title mb-3">
                  8. Limitation of Liability
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  We are not liable for any direct, indirect, or incidental
                  damages resulting from your use of the platform. This includes
                  data loss, job disputes, technical interruptions, third-party
                  actions, or unauthorized access. You use the platform and its
                  services at your own risk.
                </p>
              </section>

              {/* Termination */}
              <section id="termination">
                <h2 className="section-title mb-3">
                  9. Termination
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  We reserve the right to suspend, restrict, or terminate
                  accounts that violate these Terms of Use, engage in fraudulent
                  behavior, misuse platform features, or create security risks.
                  Termination may occur without prior notice, depending on the
                  severity of the violation.
                </p>
              </section>

              {/* Updates to Terms */}
              <section id="updates">
                <h2 className="section-title mb-3">
                  10. Updates to Terms
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  We may revise or update these Terms of Use at any time to
                  reflect operational changes, legal requirements, or
                  improvements in service. The "Last Updated" date will reflect
                  any modifications. Continued use of the platform after changes
                  indicates acceptance of the updated terms.
                </p>
              </section>

              {/* Contact Information */}
              <section id="contact">
                <h2 className="section-title mb-3">
                  11. Contact Information
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  If you have questions regarding these Terms, or need more
                  information about your rights and responsibilities, you may
                  contact us at:
                  <br />
                  Email : support@example.com
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

export default TermsOfUsePage;
