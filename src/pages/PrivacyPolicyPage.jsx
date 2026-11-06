import React from "react";
import { Link } from "react-router-dom";

const PrivacyPolicyPage = () => {
  const sections = [
    { id: "introduction", title: "01. Introduction" },
    { id: "information-we-collect", title: "02. Information We Collect" },
    { id: "how-we-use", title: "03. How We Use Your Information" },
    { id: "sharing-info", title: "04. Sharing Your Information" },
    { id: "data-security", title: "05. Data Security" },
    { id: "cookies", title: "06. Cookies and Tracking Technologies" },
    { id: "your-rights", title: "07. Your Rights" },
    { id: "childrens-privacy", title: "08. Children's Privacy" },
    { id: "changes", title: "09. Changes to This Policy" },
    { id: "contact", title: "10. Contact Us" },
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
          <h1 className="text-xl font-bold text-brand-ink">Privacy Policy</h1>
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
            <span className="text-brand-ink">Privacy Policy</span>
          </nav>
        </div>
      </div>

      <div className="app-container pt-8 md:pt-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-12">
          <article className="panel min-w-0 p-6 md:p-10">
            <div className="space-y-10">
              {/* Introduction */}
              <section id="introduction">
                <h2 className="section-title mb-3">
                  1. Introduction
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  This Privacy Policy explains how we collect, use, store, and
                  protect your information when you use our platform. By
                  accessing our website or services, you agree to the collection
                  and use of your data as described in this policy.
                </p>
              </section>

              {/* Information We Collect */}
              <section id="information-we-collect">
                <h2 className="section-title mb-3">
                  2. Information We Collect
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  We may collect the following types of information:
                </p>
                <ul className="list-disc pl-5 text-ink-muted text-[16px] leading-6 font-normal -tracking-[2%] ">
                  <li>Personal details (name, email, phone, address)</li>
                  <li>
                    Professional details (experience, license information, job
                    preferences)
                  </li>
                  <li>Uploaded documents (resume, certifications)</li>
                  <li>
                    Usage data (device info, IP, browser type, activity logs)
                  </li>
                  <li>
                    Employer-related information (company and business details)
                  </li>
                </ul>
              </section>

              {/* How We Use Your Information */}
              <section id="how-we-use">
                <h2 className="section-title mb-3">
                  3. How We Use Your Information
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  Your information is used for:
                </p>
                <ul className="list-disc pl-5 text-ink-muted text-[16px] leading-6 font-normal -tracking-[2%] ">
                  <li>Creating and managing your account</li>
                  <li>Matching job seekers with suitable career opportunities</li>
                  <li>Allowing employers to view candidate profiles</li>
                  <li>Sending notifications and service updates</li>
                  <li>Improving platform performance and user experience</li>
                  <li>Ensuring compliance and fraud prevention</li>
                </ul>
              </section>

              {/* Sharing Your Information */}
              <section id="sharing-info">
                <h2 className="section-title mb-3">
                  4. Sharing Your Information
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  We may share your data with:
                </p>
                <ul className="list-disc pl-5 text-ink-muted text-[16px] leading-6 font-normal -tracking-[2%] ">
                  <li>Verified employers when you apply for a job</li>
                  <li>Service providers (analytics, cloud hosting)</li>
                  <li>Legal authorities when required by law</li>
                </ul>
                <p className="text-[15px] leading-7 text-ink-muted">
                  We never sell your personal information.
                </p>
              </section>

              {/* Data Security */}
              <section id="data-security">
                <h2 className="section-title mb-3">
                  5. Data Security
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  We use encryption, secure servers, access control, and
                  industry-standard practices to protect your data. However, no
                  online system is 100% secure.
                </p>
              </section>

              {/* Cookies */}
              <section id="cookies">
                <h2 className="section-title mb-3">
                  6. Cookies and Tracking Technologies
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  We use cookies to improve user experience, analyze usage, and
                  personalize content.
                </p>
              </section>

              {/* Your Rights */}
              <section id="your-rights">
                <h2 className="section-title mb-3">
                  7. Your Rights
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  You may:
                </p>
                <ul className="list-disc pl-5 text-ink-muted text-[16px] leading-6 font-normal -tracking-[2%] ">
                  <li>Access, update, or delete your information</li>
                  <li>Change privacy settings</li>
                  <li>Opt-out of emails or notifications</li>
                  <li>Request account deletion</li>
                </ul>
              </section>

              {/* Children's Privacy */}
              <section id="childrens-privacy">
                <h2 className="section-title mb-3">
                  8. Children’s Privacy
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  Our platform is not intended for users under 18.
                </p>
              </section>

              {/* Changes to This Policy */}
              <section id="changes">
                <h2 className="section-title mb-3">
                  9. Changes to This Policy
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  We may update this Privacy Policy from time to time. Continued
                  use means you accept the revised policy.
                </p>
              </section>

              {/* Contact Us */}
              <section id="contact">
                <h2 className="section-title mb-3">
                  10. Contact Us
                </h2>
                <p className="text-[15px] leading-7 text-ink-muted">
                  If you have any privacy questions:<br></br>
                  <span className="font-semibold">
                    {" "}
                    Email : support@example.com
                  </span>
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

export default PrivacyPolicyPage;
