import React, { useState } from 'react';
import { Lock, Mail, ArrowLeft, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { signInWithEmail, isSupabaseConfigured } from '../services/supabase';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onNavigateToCardapio: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onNavigateToCardapio,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const supabaseConfigured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);

    try {
      const { user, error } = await signInWithEmail(email, password);

      if (error) {
        if (!supabaseConfigured) {
          // If Supabase keys are not set yet, inform user
          setErrorMessage(
            'Supabase não configurado no .env. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env para login de produção com Supabase Auth.'
          );
        } else {
          setErrorMessage(error);
        }
      } else if (user) {
        onLoginSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao tentar autenticar.');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo bypass helper if Supabase keys haven't been provided yet
  const handleTestModeAccess = () => {
    sessionStorage.setItem('acaiteria_admin_session_test', 'true');
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-[#240332] text-slate-800 flex flex-col justify-between p-4 sm:p-6 selection:bg-[#b6f625] selection:text-[#1e032b]">
      {/* Top Bar with Return Link */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <button
          onClick={onNavigateToCardapio}
          className="flex items-center gap-1.5 text-xs font-bold text-purple-200 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Cardápio</span>
        </button>

        <span className="text-[11px] font-semibold text-purple-300/70 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
          Acesso Restrito
        </span>
      </div>

      {/* Login Card */}
      <div className="max-w-md w-full mx-auto my-8 bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-purple-100">
        <div className="text-center mb-6">
          <div className="inline-flex justify-center mb-3">
            <BrandLogo size="lg" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            Painel Administrativo
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Entre com suas credenciais do <strong>Supabase Auth</strong> para gerenciar produtos, preços e opções.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-2xl flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span className="flex-1 leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Info Alert */}
        {infoMessage && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-2xl flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span className="flex-1 leading-snug">{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              E-mail do Administrador
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@acaiteriaalves.com.br"
                required
                className="w-full text-xs sm:text-sm p-3 pl-9 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-700"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full text-xs sm:text-sm p-3 pl-9 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-700"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-[#35074a] hover:bg-[#470963] active:scale-98 text-white font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            <ShieldCheck className="w-4 h-4 text-[#8ac627]" />
            <span>{isLoading ? 'Autenticando...' : 'Acessar Painel ADM'}</span>
          </button>
        </form>

        {/* Supabase Status Indicator */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-500">
            <span
              className={`w-2 h-2 rounded-full ${supabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
            />

            <span>
              {supabaseConfigured
                ? 'Supabase Conectado'
                : 'Supabase em modo de configuração'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-purple-200/60 pb-2">
        Açaiteria Alves • Painel de Gestão Seguro
      </div>
    </div>
  );
};
