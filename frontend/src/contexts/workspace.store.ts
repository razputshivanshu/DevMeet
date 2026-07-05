import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WorkspaceState {
  currentOrgId: string | null;
  currentChannelId: string | null;
  setOrg: (id: string | null) => void;
  setChannel: (id: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentOrgId: null,
      currentChannelId: null,
      setOrg: (id) => set({ currentOrgId: id, currentChannelId: null }),
      setChannel: (id) => set({ currentChannelId: id }),
    }),
    { name: 'devmeet.workspace' },
  ),
);
