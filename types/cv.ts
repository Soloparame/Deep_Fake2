export interface CVContact {
  location: string;
  phone: string;
  email: string;
}

export interface CVSkill {
  name: string;
  proficiency: number; // 0-100
}

export interface CVEducation {
  startDate: string;
  endDate: string;
  institution: string;
  description: string;
}

export interface CVExperience {
  startDate: string;
  endDate: string;
  employer: string;
  role: string;
  description: string;
}

export interface CVClient {
  name: string;
  logoUrl?: string;
}

export interface CVTestimonial {
  quote: string;
  author: string;
  role?: string;
}

export interface CVData {
  fullName: string;
  roles: string[]; // e.g. ["UI/UX designer", "Full stack developer"]
  profileImageUrl?: string;
  contact: CVContact;
  skills: CVSkill[]; // LANGUAGE / KNOWLEDGE with proficiency bars
  aboutMe: string;
  education: CVEducation[];
  experience: CVExperience[];
  skillsList: string[]; // plain skills for SKILLS section
  socialLinks: {
    email?: string;
    linkedin?: string;
    instagram?: string;
    twitter?: string;
  };
  topClients: CVClient[];
  testimonials: CVTestimonial[];
}

export const defaultCVData: CVData = {
  fullName: "",
  roles: [],
  contact: { location: "", phone: "", email: "" },
  skills: [],
  aboutMe: "",
  education: [],
  experience: [],
  skillsList: [],
  socialLinks: {},
  topClients: [],
  testimonials: [],
};
