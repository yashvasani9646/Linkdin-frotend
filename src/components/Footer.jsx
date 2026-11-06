import { Link } from "react-router-dom";
import Logo from "./common/Logo";
import { BRAND } from "../config/brand";

const FooterLink = ({ to, children }) => (
  <Link
    to={to}
    className="text-sm leading-6 text-ink-muted transition-colors hover:text-brand-action"
  >
    {children}
  </Link>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-line-weak bg-white">
      <div className="app-container py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo to="/" />
            <p className="mt-4 text-sm leading-6 text-ink-muted">
              A focused place to discover roles, compare opportunities, and
              move your career forward.
            </p>
            <p className="mt-4 text-xs leading-5 text-ink-subtle">
              {BRAND.tagline}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-brand-ink">
              Job seekers
            </h2>
            <nav className="mt-4 flex flex-col gap-2" aria-label="Job seeker links">
              <FooterLink to="/dashboard">Find jobs</FooterLink>
              <FooterLink to="/dashboard/my-saved-job">Saved jobs</FooterLink>
              <FooterLink to="/dashboard/my-saved-job?tab=applied">
                Applications
              </FooterLink>
              <FooterLink to="/auth/signup">Create an account</FooterLink>
            </nav>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-brand-ink">
              Employers
            </h2>
            <nav className="mt-4 flex flex-col gap-2" aria-label="Employer links">
              <FooterLink to="/auth/signup">Create an account</FooterLink>
              <FooterLink to="/auth/signin">Sign in</FooterLink>
              <FooterLink to="/#how-it-works">How it works</FooterLink>
              <FooterLink to="/#employers">Hiring with us</FooterLink>
            </nav>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-brand-ink">
              Company
            </h2>
            <nav className="mt-4 flex flex-col gap-2" aria-label="Company links">
              <FooterLink to="/privacy">Privacy policy</FooterLink>
              <FooterLink to="/terms">Terms of use</FooterLink>
              <FooterLink to="/accessibility">Accessibility</FooterLink>
            </nav>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line-weak pt-6 text-xs text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} {BRAND.name}. All rights reserved.
          </p>
          <p>Built to make the next step clearer.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
