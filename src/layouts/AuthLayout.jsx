import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";

const AuthLayout = () => {
  return (
    <div className="page-shell hero-mesh flex flex-col">
      <main className="relative flex grow items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
        <div
          className="pointer-events-none absolute left-[8%] top-24 hidden h-40 w-40 rounded-full bg-brand-tint/70 blur-3xl lg:block"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-20 right-[10%] hidden h-32 w-32 rounded-full bg-success-soft blur-3xl lg:block"
          aria-hidden="true"
        />
        <div className="relative w-full">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AuthLayout;
