import { useState } from "react";
import { toast } from "react-toastify";

const AdminBrandingPage = () => {
  const [slogan, setSlogan] = useState("");
  const [logo, setLogo] = useState(null);
  const [favicon, setFavicon] = useState(null);

  const handleFileChange = (e, setFile) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size exceeds the 5 MB limit.");
        return;
      }
      const fileUrl = URL.createObjectURL(file);
      setFile(fileUrl);
    }
  };

  return (
    <div className="pb-8">
      <div className="mb-6">
        <h1 className="page-title">Branding settings</h1>
        <p className="page-subtitle">
          Preview how your platform logo, favicon, and slogan could look.
        </p>
      </div>

      <div className="mx-auto max-w-[860px] panel p-5 sm:p-6">
        <div className="alert alert-info mb-6" role="status">
          Preview only. Branding changes are not persisted because the current
          backend has no branding API.
        </div>
        {/* Upload Logo */}
        <div className="mb-6">
          <label className="field-label">
            Upload logo
          </label>
          <div
            className="relative mt-1.5 flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-line bg-surface-raised p-8 transition-colors hover:border-brand-action hover:bg-brand-tint/30"
            onClick={() => document.getElementById("logo-upload").click()}
          >
            {logo ? (
              <img
                src={logo}
                className="w-full h-32 object-contain"
                alt="Logo Preview"
              />
            ) : (
              <>
                <img src="/fi_upload-cloud.svg" className="w-10 h-10" alt="" />
                <p className="text-xs mt-2.5 font-normal leading-5 -tracking-[2%] text-secondary">
                  Browse photo or drop here
                </p>
                <p className="text-[10px] text-center font-normal leading-[14px] -tracking-[2%] text-ink-muted">
                  A photo larger than 400 pixels work best. Max photo size 5 MB.
                </p>
              </>
            )}
            <input
              id="logo-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFileChange(e, setLogo)}
            />
          </div>
        </div>

        {/* Upload Favicon Icon */}
        <div className="mb-6">
          <label className="field-label">
            Upload favicon
          </label>
          <div
            className="relative mt-1.5 flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-line bg-surface-raised p-8 transition-colors hover:border-brand-action hover:bg-brand-tint/30"
            onClick={() => document.getElementById("favicon-upload").click()}
          >
            {favicon ? (
              <img
                src={favicon}
                className="w-16 h-16 object-contain"
                alt="Favicon Preview"
              />
            ) : (
              <>
                <img src="/fi_upload-cloud.svg" className="w-10 h-10" alt="" />
                <p className="text-xs mt-2.5 font-normal leading-5 -tracking-[2%] text-secondary">
                  Browse photo or drop here
                </p>
                <p className="text-[10px] text-center font-normal leading-[14px] -tracking-[2%] text-ink-muted">
                  A photo larger than 400 pixels work best. Max photo size 5 MB.
                </p>
              </>
            )}
            <input
              id="favicon-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFileChange(e, setFavicon)}
            />
          </div>
        </div>

        {/* Edit Slogan */}
        <div className="mb-6">
          <label className="field-label">
            Edit slogan
          </label>
          <input
            type="text"
            value={slogan}
            onChange={(e) => setSlogan(e.target.value)}
            placeholder="Enter your brand slogan"
            className="field-input mt-1.5"
          />
          <p className="field-help">
            This slogan will appear on the login and marketing screens once
            branding persistence is implemented.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminBrandingPage;
