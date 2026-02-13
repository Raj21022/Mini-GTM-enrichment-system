import { create } from "zustand";

export const useEnrichmentStore = create((set) => ({
  orgId: "demo-org",
  selectedFile: null,
  jobId: null,
  message: "",
  setOrgId: (orgId) => set({ orgId }),
  setSelectedFile: (selectedFile) => set({ selectedFile }),
  setJobId: (jobId) => set({ jobId }),
  setMessage: (message) => set({ message }),
  resetAfterUpload: () => set({ message: "" }),
}));
