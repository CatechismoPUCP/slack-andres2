import { create } from "zustand";

interface WorkspaceValues {
  name: string;
  imageUrl: string;
  currStep: number;
}

interface WorkspaceStore extends WorkspaceValues {
  updateValues: (values: Partial<WorkspaceValues>) => void;
  updateImageUrl: (url: string) => void;
  setCurrStep: (step: number) => void;
  reset: () => void;
}

const initialState: WorkspaceValues = {
  name: "",
  imageUrl: "",
  currStep: 1,
};

export const useWorkspaceValues = create<WorkspaceStore>((set) => ({
  ...initialState,
  updateValues: (values) => set((state) => ({ ...state, ...values })),
  updateImageUrl: (url) => set({ imageUrl: url }),
  setCurrStep: (step) => set({ currStep: step }),
  reset: () => set(initialState),
}));
