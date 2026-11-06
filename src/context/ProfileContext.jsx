import { useState } from "react";
import ProfileContext from "./profileContextValue";

export const ProfileProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState({
    firstName: "",
    lastName: "",
    title: "",
    experience: "",
    avatar: "",
    email: "",
    phoneNumber: "",
    streetAddress: "",
    city: "",
    area: "",
    pincode: "",
    country: "",
    resume: null,
  });

  const updateProfile = (newData) => {
    setUserProfile((prev) => ({
      ...prev,
      ...newData,
    }));
  };

  return (
    <ProfileContext.Provider value={{ userProfile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};
