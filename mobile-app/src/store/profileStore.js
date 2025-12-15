import { create } from "zustand";

const initialProfile = {
  username: "",
  name: "",
  city: "",
  avatarUri: null,
  specialties: [],
  description: "",
  phone: "",
  instagram: "",
  telegram: "",
  role: null,
};

export const useProfileStore = create((set) => ({
  profile: initialProfile,

  setProfile: (data) =>
    set((state) => ({
      profile: {
        ...state.profile,
        ...data,
      },
    })),

  resetProfile: () => set({ profile: initialProfile }),
}));
