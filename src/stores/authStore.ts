import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../services/supabase";
import type { Profile, Workspace } from "../types";

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  workspace: Workspace | null;
  loading: boolean;
  isOfflineMode: boolean;

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

let authSubscription: { unsubscribe: () => void } | null = null;
let initialized = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  workspace: null,
  loading: true,
  isOfflineMode: !isSupabaseConfigured,

  isAuthenticated: false,
  isOnboarded: false,

  initialize: async () => {
    if (!isSupabaseConfigured || !supabase) {
      set({ loading: false, isOfflineMode: true });
      return;
    }

    if (initialized) {
      set({ loading: false });
      return;
    }
    initialized = true;

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

    // Clean up previous listener if any
    if (authSubscription) {
      authSubscription.unsubscribe();
      authSubscription = null;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      set({ session, user, isAuthenticated: !!user });
      if (user) {
        void get().fetchProfile();
      } else {
        set({ profile: null, workspace: null, isOnboarded: false });
      }
    });
    authSubscription = subscription;
  },

  login: async (email, password) => {
    if (!supabase) return { error: "Supabase er ikke konfigurert" };
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return {};
    } catch {
      return { error: "Kunne ikke logge inn. Sjekk nettverkstilkoblingen." };
    }
  },

  register: async (email, password) => {
    if (!supabase) return { error: "Supabase er ikke konfigurert" };
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: error.message };
      return {};
    } catch {
      return { error: "Kunne ikke registrere. Sjekk nettverkstilkoblingen." };
    }
  },

  logout: async () => {
    try {
      await supabase?.auth.signOut();
    } catch {
      // Ignore sign-out errors
    }
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
    if (!supabase) return { error: "Supabase er ikke konfigurert" };
    const user = get().user;
    if (!user) return { error: "Ikke innlogget" };

    try {
      const inviteCode = generateInviteCode();

      const { data: ws, error: wsError } = await supabase
        .from("workspaces")
        .insert({ name, invite_code: inviteCode })
        .select()
        .single();

      if (wsError) return { error: wsError.message };

      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        workspace_id: ws.id,
        display_name: "",
        role: "admin",
      });

      if (profileError) return { error: profileError.message };

      set({ workspace: ws as Workspace });
      return { inviteCode };
    } catch {
      return { error: "Kunne ikke opprette workspace. Prøv igjen." };
    }
  },

  joinWorkspace: async (inviteCode) => {
    if (!supabase) return { error: "Supabase er ikke konfigurert" };
    const user = get().user;
    if (!user) return { error: "Ikke innlogget" };

    try {
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
    } catch {
      return { error: "Kunne ikke bli med i workspace. Prøv igjen." };
    }
  },

  setupProfile: async (displayName) => {
    if (!supabase) return { error: "Supabase er ikke konfigurert" };
    const user = get().user;
    if (!user) return { error: "Ikke innlogget" };

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", user.id);

      if (error) return { error: error.message };

      await get().fetchProfile();
      return {};
    } catch {
      return { error: "Kunne ikke oppdatere profil. Prøv igjen." };
    }
  },

  fetchProfile: async () => {
    if (!supabase) return;
    const user = get().user;
    if (!user) return;

    try {
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
    } catch {
      // Network error — keep current state
    }
  },
}));
