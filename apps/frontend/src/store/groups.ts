import { create } from 'zustand';
import { Group, GroupMember } from '@/lib/api';

interface GroupsState {
  groups: Group[];
  currentGroup: Group | null;
  groupMembers: GroupMember[];
  isLoading: boolean;
  setGroups: (groups: Group[]) => void;
  setCurrentGroup: (group: Group | null) => void;
  setGroupMembers: (members: GroupMember[]) => void;
  addGroup: (group: Group) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  removeGroup: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useGroupsStore = create<GroupsState>()((set) => ({
  groups: [],
  currentGroup: null,
  groupMembers: [],
  isLoading: false,
  
  setGroups: (groups: Group[]) =>
    set(() => ({ groups })),
  
  setCurrentGroup: (group: Group | null) =>
    set(() => ({ currentGroup: group })),
  
  setGroupMembers: (members: GroupMember[]) =>
    set(() => ({ groupMembers: members })),
  
  addGroup: (group: Group) =>
    set((state) => ({ groups: [...state.groups, group] })),
  
  updateGroup: (id: string, updates: Partial<Group>) =>
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === id ? { ...group, ...updates } : group
      ),
      currentGroup:
        state.currentGroup?.id === id
          ? { ...state.currentGroup, ...updates }
          : state.currentGroup,
    })),
  
  removeGroup: (id: string) =>
    set((state) => ({
      groups: state.groups.filter((group) => group.id !== id),
      currentGroup: state.currentGroup?.id === id ? null : state.currentGroup,
    })),
  
  setLoading: (loading: boolean) =>
    set(() => ({ isLoading: loading })),
})); 