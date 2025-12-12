import { create } from 'zustand';

interface ViewerStore {
    isInitialized: boolean;
    isLoading: boolean;
    setInitialized: (status: boolean) => void;
    setLoading: (status: boolean) => void;
}

export const useViewerStore = create<ViewerStore>((set) => ({
    isInitialized: false,
    isLoading: false,
    setInitialized: (status: boolean) => set({ isInitialized: status }),
    setLoading: (status: boolean) => set({ isLoading: status }),
}))
