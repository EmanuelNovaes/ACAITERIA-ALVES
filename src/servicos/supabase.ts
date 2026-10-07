import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// Variáveis de ambiente para integração com o Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Verifica se credenciais reais do Supabase foram configuradas
export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.trim().length > 0 &&
    !supabaseUrl.includes('your-project') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.trim().length > 0 &&
    !supabaseAnonKey.includes('your-anon-key')
  );
};

// Cria a instância do cliente Supabase (ou uma instância provisória se ainda não estiver configurado)
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// Funções auxiliares de autenticação
export const signInWithEmail = async (email: string, password: string): Promise<{ user: User | null; session: Session | null; error: string | null }> => {
  if (!isSupabaseConfigured()) {
    // Quando as credenciais do Supabase não estiverem configuradas, fornece uma orientação clara
    // permitindo acesso para testar a interface administrativa, se desejado
    return {
      user: null,
      session: null,
      error: 'Supabase ainda não configurado. Por favor, adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env para autenticação real.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error: error.message };
    }

    return { user: data.user, session: data.session, error: null };
  } catch (err: any) {
    return { user: null, session: null, error: err.message || 'Erro inesperado ao realizar login.' };
  }
};

export const signOut = async (): Promise<void> => {
  if (isSupabaseConfigured()) {
    await supabase.auth.signOut();
  }
};

export const getCurrentSession = async (): Promise<Session | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
};
