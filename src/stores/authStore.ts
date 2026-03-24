import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";
import type { Profile, Workspace } from "../types";

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  workspace: Workspace | null;
  loading: boolean;

  isAuthenticated: boolean;
  isOnboarded: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;

  createWorkspace: (name: string) => Promise<{ error?: string; inviteCode?: string }>;
  joinWorkspace: (inviteCode: string) => Promise<{ error?: string }>;
  setupProfile: (displayName: string) => Promise<{ error?: string }>;

  fetchProfile: () => Promise<void>;
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  workspace: null,
  loading: true,

  isAuthenticated: false,
  isOnboarded: false,

  initialize: async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      const user = session?.user ?? null;

      set({
        session,
        user,
        isAuthenticated: !!user,
      });

      if (user) {
        await get().fetchProfile();
      }
    } catch {
      // Offline or no session — stay logged out
    } finally {
      set({ loading: false });
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      set({ session, user, isAuthenticated: !!user });
      if (user) {
        void get().fetchProfile();
      } else {
        set({ profile: null, workspace: null, isOnboarded: false });
      }
    });
  },

  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  },

  register: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    return {};
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({
      user: null,
      session: null,
      profile: null,
      workspace: null,
      isAuthenticated: false,
      isOnboarded: false,
    });
  },

  createWorkspace: async (name) => {
    const user = get().user;
    if (!user) return { error: "Ikke innlogget" };

    const inviteCode = generateInviteCode();

    const { data: ws, error: wsError } = await supabase
      .from("workspaces")
      .insert({ name, invite_code: inviteCode })
      .select()
      .single();

    if (wsError) return { error: wsError.message };

    // Create profile as admin (first user in workspace)
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      workspace_id: ws.id,
      display_name: "",
      role: "admin",
    });

    if (profileError) return { error: profileError.message };

    set({ workspace: ws as Workspace });
    return { inviteCode };
  },

  joinWorkspace: async (inviteCode) => {
    const user = get().user;
    if (!user) return { error: "Ikke innlogget" };

    const { data: ws, error: wsError } = await supabase
      .from("workspaces")
      .select()
      .eq("invite_code", inviteCode.toUpperCase())
      .single();

    if (wsError || !ws) return { error: "Ugyldig invitasjonskode" };

    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      workspace_id: ws.id,
      display_name: "",
      role: "user",
    });

    if (profileError) return { error: profileError.message };

    set({ workspace: ws as Workspace });
    return {};
  },

  setupProfile: async (displayName) => {
    const user = get().user;
    if (!user) return { error: "Ikke innlogget" };

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", user.id);

    if (error) return { error: error.message };

    await get().fetchProfile();
    return {};
  },

  fetchProfile: async () => {
    const user = get().user;
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select()
      .eq("id", user.id)
      .single();

    if (!profile) {
      set({ profile: null, workspace: null, isOnboarded: false });
      return;
    }

    const { data: workspace } = await supabase
      .from("workspaces")
      .select()
      .eq("id", profile.workspace_id)
      .single();

    const typedProfile = profile as Profile;
    const typedWorkspace = workspace as Workspace | null;

    set({
      profile: typedProfile,
      workspace: typedWorkspace,
      isOnboarded: !!typedProfile.workspace_id && !!typedProfile.display_name,
    });
  },
}));
