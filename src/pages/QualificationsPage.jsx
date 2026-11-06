import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import BackButton from "../components/common/BackButton";
import AddWorkExperienceModal from "../components/AddWorkExperienceModal";
import AddEducationModal from "../components/AddEducationModal";
import AddSkillModal from "../components/AddSkillModal";
import AddLanguageModal from "../components/AddLanguageModal";
import AddCertificationModal from "../components/AddCertificationModal";
import { userService } from "../services/userService";
import { toast } from "react-toastify";

const TrashIcon = () => (
  <svg
    className="w-[18px] h-[18px]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const QualificationsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isCertificationModalOpen, setIsCertificationModalOpen] =
    useState(false);

  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State for qualifications data (no licenses)
  const [workExperiences, setWorkExperiences] = useState([]);
  const [educations, setEducations] = useState([]);
  const [skills, setSkills] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [languages, setLanguages] = useState([]);

  // Fetch qualifications from API
  const fetchQualifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await userService.getProfileDetails();
      if (response.success && response.data?.profileDetails?.qualifications) {
        const quals = response.data.profileDetails.qualifications;

        setWorkExperiences(
          (quals.workExperiences || []).map((item, index) => ({
            ...item,
            jobTitle: item.jobTitle || item.title || "",
            companyName: item.companyName || item.company || "",
            id: item._id || `work_${index}`,
          }))
        );

        setEducations(
          (quals.education || []).map((item, index) => ({
            ...item,
            levelOfEducation: item.levelOfEducation || item.degree || "",
            fieldOfStudy: item.fieldOfStudy || item.institution || "",
            id: item._id || `edu_${index}`,
          }))
        );

        setSkills(
          (quals.skills || []).map((item, index) => ({
            ...item,
            id: item._id || `skill_${index}`,
          }))
        );

        setCertifications(
          (quals.certifications || []).map((item, index) => ({
            ...item,
            certificationName: item.certificationName || item.name || "",
            id: item._id || `cert_${index}`,
            expiryMonth: item.expirationDate?.month,
            expiryYear: item.expirationDate?.year,
          }))
        );

        setLanguages(
          (quals.languages || []).map((item, index) => ({
            ...item,
            id: item._id || `lang_${index}`,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching qualifications:", error);
      toast.error("Failed to load qualifications");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQualifications();
  }, [fetchQualifications]);

  // Save qualifications to API (new payload shape, no licenses)
  const saveQualifications = useCallback(
    async (updatedData) => {
      setIsSaving(true);
      try {
        const payload = {
          workExperiences: (updatedData.workExperiences || workExperiences).map(
            (item) => ({
              jobTitle: item.jobTitle,
              companyName: item.companyName,
            })
          ),
          education: (updatedData.education || educations).map((item) => ({
            levelOfEducation: item.levelOfEducation,
            fieldOfStudy: item.fieldOfStudy,
          })),
          skills: (updatedData.skills || skills).map((item) => ({
            skill: item.skill,
            yearsOfExperience: item.yearsOfExperience,
          })),
          certifications: (updatedData.certifications || certifications).map(
            (item) => ({
              certificationName: item.certificationName,
              expirationDate: item.doesNotExpire
                ? null
                : {
                    month:
                      parseInt(item.expiryMonth) || item.expirationDate?.month,
                    year:
                      parseInt(item.expiryYear) || item.expirationDate?.year,
                  },
              doesNotExpire: item.doesNotExpire || false,
            })
          ),
          languages: (updatedData.languages || languages).map((item) => ({
            language: item.language,
            proficiency: item.proficiency,
          })),
        };

        const response = await userService.updateQualifications(payload);
        if (response.success) {
          toast.success("Qualifications updated successfully");
          fetchQualifications();
          return { success: true };
        }
        return { success: false, error: response };
      } catch (error) {
        console.error("Error saving qualifications:", error);
        const errorObj = error.response?.data?.error || error.response?.data;
        const errorMessage =
          errorObj?.errors?.[0]?.message ||
          errorObj?.message ||
          "Failed to save qualifications";
        toast.error(errorMessage);
        return { success: false, error: errorObj };
      } finally {
        setIsSaving(false);
      }
    },
    [
      workExperiences,
      educations,
      skills,
      certifications,
      languages,
      fetchQualifications,
    ]
  );

  // Add / Edit Handlers
  const handleSaveWorkExperience = async (data) => {
    let updated;
    if (data.id) {
      updated = workExperiences.map((item) =>
        item.id === data.id ? data : item
      );
    } else {
      updated = [...workExperiences, { ...data, id: `work_${Date.now()}` }];
    }
    const result = await saveQualifications({ workExperiences: updated });
    if (result.success) setWorkExperiences(updated);
    return result;
  };

  const handleSaveEducation = async (data) => {
    let updated;
    if (data.id) {
      updated = educations.map((item) => (item.id === data.id ? data : item));
    } else {
      updated = [...educations, { ...data, id: `edu_${Date.now()}` }];
    }
    const result = await saveQualifications({ education: updated });
    if (result.success) setEducations(updated);
    return result;
  };

  const handleSaveSkill = async (data) => {
    let updated;
    if (data.id) {
      updated = skills.map((item) => (item.id === data.id ? data : item));
    } else {
      updated = [...skills, { ...data, id: `skill_${Date.now()}` }];
    }
    const result = await saveQualifications({ skills: updated });
    if (result.success) setSkills(updated);
    return result;
  };

  const handleSaveCertification = async (data) => {
    let updated;
    if (data.id) {
      updated = certifications.map((item) =>
        item.id === data.id ? data : item
      );
    } else {
      updated = [...certifications, { ...data, id: `cert_${Date.now()}` }];
    }
    const result = await saveQualifications({ certifications: updated });
    if (result.success) setCertifications(updated);
    return result;
  };

  const handleSaveLanguage = async (data) => {
    let updated;
    if (data.id) {
      updated = languages.map((item) => (item.id === data.id ? data : item));
    } else {
      updated = [...languages, { ...data, id: `lang_${Date.now()}` }];
    }
    const result = await saveQualifications({ languages: updated });
    if (result.success) setLanguages(updated);
    return result;
  };

  // Remove Handlers
  const handleDeleteWorkExperience = async (id) => {
    const updated = workExperiences.filter((item) => item.id !== id);
    const result = await saveQualifications({ workExperiences: updated });
    if (result.success) {
      setWorkExperiences(updated);
      toast.success("Work experience removed");
    }
  };

  const handleDeleteEducation = async (id) => {
    const updated = educations.filter((item) => item.id !== id);
    const result = await saveQualifications({ education: updated });
    if (result.success) {
      setEducations(updated);
      toast.success("Education removed");
    }
  };

  const handleDeleteSkill = async (id) => {
    const updated = skills.filter((item) => item.id !== id);
    const result = await saveQualifications({ skills: updated });
    if (result.success) {
      setSkills(updated);
      toast.success("Skill removed");
    }
  };

  const handleDeleteCertification = async (id) => {
    const updated = certifications.filter((item) => item.id !== id);
    const result = await saveQualifications({ certifications: updated });
    if (result.success) {
      setCertifications(updated);
      toast.success("Certification removed");
    }
  };

  const handleDeleteLanguage = async (id) => {
    const updated = languages.filter((item) => item.id !== id);
    const result = await saveQualifications({ languages: updated });
    if (result.success) {
      setLanguages(updated);
      toast.success("Language removed");
    }
  };

  const qualificationSections = [
    {
      id: "work",
      icon: "/IdentificationCard.svg",
      title: "Add most recent work experience",
      filledTitle: "Work Experience",
      description:
        "Include your latest work or company role to strengthen your profile.",
      items: workExperiences,
      canAddWhenFilled: true,
      renderItem: (item) => (
        <div key={item.id} className="flex justify-between items-center py-1">
          <div>
            <h4 className="text-sm font-normal leading-5 -tracking-[2%] text-ink-muted">
              <span className="font-semibold text-secondary">{item.jobTitle}</span>
              {item.companyName && ` • ${item.companyName}`}
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingItem(item);
                setIsModalOpen(true);
              }}
              className="text-brand-action hover:text-brand-action-hover p-1 cursor-pointer transition-colors"
              title="Edit"
            >
              <img
                src="/PencilLine.svg"
                alt="Edit"
                className="w-[18px] h-[18px]"
              />
            </button>
            <button
              onClick={() => handleDeleteWorkExperience(item.id)}
              className="text-ink-subtle hover:text-danger p-1 cursor-pointer transition-colors"
              title="Remove"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      ),
      onAdd: () => {
        setEditingItem(null);
        setIsModalOpen(true);
      },
    },
    {
      id: "education",
      icon: "/GraduationCap.svg",
      title: "Add education",
      filledTitle: "Education",
      description:
        "List your degrees, institutions, and areas of study.",
      items: educations,
      canAddWhenFilled: true,
      renderItem: (item) => (
        <div key={item.id} className="flex justify-between items-center py-1">
          <div>
            <h4 className="text-sm font-normal leading-5 -tracking-[2%] text-ink-muted">
              <span className="font-semibold text-secondary">{item.levelOfEducation}</span>
              {item.fieldOfStudy && ` • ${item.fieldOfStudy}`}
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingItem(item);
                setIsEducationModalOpen(true);
              }}
              className="text-brand-action hover:text-brand-action-hover p-1 cursor-pointer transition-colors"
              title="Edit"
            >
              <img
                src="/PencilLine.svg"
                alt="Edit"
                className="w-[18px] h-[18px]"
              />
            </button>
            <button
              onClick={() => handleDeleteEducation(item.id)}
              className="text-ink-subtle hover:text-danger p-1 cursor-pointer transition-colors"
              title="Remove"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      ),
      onAdd: () => {
        setEditingItem(null);
        setIsEducationModalOpen(true);
      },
    },
    {
      id: "skill",
      icon: "/addSkill.svg",
      title: "Add skill",
      filledTitle: "Skills",
      description:
        "Show your key skills and areas of expertise to stand out to employers and recruiters.",
      items: skills,
      canAddWhenFilled: true,
      renderItem: (item) => (
        <div key={item.id} className="flex justify-between items-center py-1">
          <div>
            <h4 className="text-sm font-normal leading-5 -tracking-[2%] text-ink-muted">
              <span className="font-semibold text-secondary">{item.skill}</span>
              {item.yearsOfExperience && ` (${item.yearsOfExperience} yrs)`}
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingItem(item);
                setIsSkillModalOpen(true);
              }}
              className="text-brand-action hover:text-brand-action-hover p-1 cursor-pointer transition-colors"
              title="Edit"
            >
              <img
                src="/PencilLine.svg"
                alt="Edit"
                className="w-[18px] h-[18px]"
              />
            </button>
            <button
              onClick={() => handleDeleteSkill(item.id)}
              className="text-ink-subtle hover:text-danger p-1 cursor-pointer transition-colors"
              title="Remove"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      ),
      onAdd: () => {
        setEditingItem(null);
        setIsSkillModalOpen(true);
      },
    },
    {
      id: "certification",
      icon: "/addSkill.svg",
      title: "Add certifications",
      filledTitle: "Certifications",
      description:
        "Add professional certifications or credentials to showcase your expertise.",
      items: certifications,
      canAddWhenFilled: true,
      renderItem: (item) => (
        <div key={item.id} className="flex justify-between items-center py-1">
          <div>
            <h4 className="text-sm font-normal leading-5 -tracking-[2%] text-ink-muted">
              <span className="font-semibold text-secondary">{item.certificationName}</span>
            </h4>
            <p className="text-xs text-ink-subtle">
              Expires:{" "}
              {item.doesNotExpire
                ? "Never"
                : `${item.expiryMonth || item.expirationDate?.month || ""}/${
                    item.expiryYear || item.expirationDate?.year || ""
                  }`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingItem(item);
                setIsCertificationModalOpen(true);
              }}
              className="text-brand-action hover:text-brand-action-hover p-1 cursor-pointer transition-colors"
              title="Edit"
            >
              <img
                src="/PencilLine.svg"
                alt="Edit"
                className="w-[18px] h-[18px]"
              />
            </button>
            <button
              onClick={() => handleDeleteCertification(item.id)}
              className="text-ink-subtle hover:text-danger p-1 cursor-pointer transition-colors"
              title="Remove"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      ),
      onAdd: () => {
        setEditingItem(null);
        setIsCertificationModalOpen(true);
      },
    },
    {
      id: "language",
      icon: "/GlobeHemisphereWest.svg",
      title: "Add languages",
      filledTitle: "Languages",
      description:
        "Highlight languages you speak to connect with global and multilingual employers.",
      items: languages,
      canAddWhenFilled: true,
      renderItem: (item) => (
        <div key={item.id} className="flex justify-between items-center py-1">
          <div>
            <h4 className="text-sm font-normal leading-5 -tracking-[2%] text-ink-muted">
              <span className="font-semibold text-secondary">{item.language}</span>
              {item.proficiency && ` • ${item.proficiency}`}
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingItem(item);
                setIsLanguageModalOpen(true);
              }}
              className="text-brand-action hover:text-brand-action-hover p-1 cursor-pointer transition-colors"
              title="Edit"
            >
              <img
                src="/PencilLine.svg"
                alt="Edit"
                className="w-[18px] h-[18px]"
              />
            </button>
            <button
              onClick={() => handleDeleteLanguage(item.id)}
              className="text-ink-subtle hover:text-danger p-1 cursor-pointer transition-colors"
              title="Remove"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      ),
      onAdd: () => {
        setEditingItem(null);
        setIsLanguageModalOpen(true);
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="loading-state py-24">
        <div className="loading-spinner"></div>
        <p>Loading qualifications...</p>
      </div>
    );
  }

  return (
    <div className="page-shell pb-16">
      {/* Saving overlay */}
      {isSaving && (
        <div className="modal-backdrop z-50">
          <div className="modal-card max-w-xs items-center p-6">
            <div className="loading-spinner"></div>
            <span className="text-sm font-medium text-ink-muted">Saving...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-line-weak bg-white">
        <div className="app-container flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-brand-ink">Qualifications</h1>
          <p className="text-sm text-ink-muted">
            <Link to="/dashboard" className="transition-colors hover:text-brand-action">
              Home
            </Link>{" "}
            /{" "}
            <Link
              to="/dashboard/profile"
              className="transition-colors hover:text-brand-action"
            >
              Profile
            </Link>{" "}
            / <span className="font-medium text-ink">Qualifications</span>
          </p>
        </div>
      </div>

      <div className="app-container">
        {/* Header with Back Button */}
        <div className="flex items-start gap-3 pt-6">
          <BackButton
            fallback="/dashboard/profile"
            label="Back to profile"
            className="mt-0.5 h-10 w-10"
          />
          <div>
            <h2 className="page-title">Qualifications</h2>
            <p className="page-subtitle">
              We use these details to show you jobs that match your unique skills and experience.
            </p>
          </div>
        </div>

        {/* Qualification Cards */}
        <div className="space-y-4 pt-6">
          {qualificationSections.map((section) => {
            const hasItems = section.items && section.items.length > 0;
            return (
              <div
                key={section.id}
                className="panel panel-hover p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-1 items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-tint">
                      <img
                        src={section.icon}
                        alt=""
                        className="h-5 w-5"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-brand-ink">
                        {hasItems ? section.filledTitle : section.title}
                      </h3>

                      {hasItems ? (
                        <div className="mt-3 divide-y divide-line-weak">
                          {section.items.map(section.renderItem)}
                        </div>
                      ) : (
                        <p className="mt-1 text-sm leading-6 text-ink-muted">
                          {section.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Add action — same plus pattern as Job preferences */}
                  <button
                    type="button"
                    onClick={section.onAdd}
                    aria-label={`Add ${section.filledTitle}`}
                    title={`Add ${section.filledTitle}`}
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface-raised text-ink-muted transition hover:bg-brand-tint hover:text-brand-action"
                  >
                    <img src="/plus.svg" alt="" className="h-[18px] w-[18px]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <AddWorkExperienceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveWorkExperience}
        initialData={editingItem}
      />

      <AddEducationModal
        isOpen={isEducationModalOpen}
        onClose={() => setIsEducationModalOpen(false)}
        onSave={handleSaveEducation}
        initialData={editingItem}
      />

      <AddSkillModal
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
        onSave={handleSaveSkill}
        initialData={editingItem}
      />

      <AddCertificationModal
        isOpen={isCertificationModalOpen}
        onClose={() => setIsCertificationModalOpen(false)}
        onSave={handleSaveCertification}
        initialData={editingItem}
      />

      <AddLanguageModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        onSave={handleSaveLanguage}
        initialData={editingItem}
      />
    </div>
  );
};

export default QualificationsPage;
