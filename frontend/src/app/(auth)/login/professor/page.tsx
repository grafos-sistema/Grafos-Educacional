'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

/* ============================================================
   Portal do Professor — Grafos Gestão Escolar
   ============================================================ */

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
type LoginFormData = z.infer<typeof loginSchema>;

/* ---------- SVG Inline Icons ---------- */
const ArrowLeft = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>;
const GradCap = ({ size = 26 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>;
const Envelope = ({ color = '#94a3b8' }: { color?: string }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 6l-10 7L2 6" /></svg>;
const Lock = ({ size = 18, color = '#94a3b8' }: { size?: number; color?: string }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>;
const Eye = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer', flexShrink: 0 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
const EyeOff = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer', flexShrink: 0 }}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" /></svg>;
const LoginArrow = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" /><path d="M10 17l5-5-5-5M15 12H3" /></svg>;
const Headset = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1565d8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M3 18v-6a9 9 0 0118 0v6" /><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z" /></svg>;
const ChevronRight = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>;

/* ---------- Dados dos Cards com cores variadas ---------- */
const CARDS = [
  { title: 'Minhas Disciplinas', desc: 'Visualize e organize todas as suas disciplinas.', color: '#8b5cf6', icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg> },
  { title: 'Turmas', desc: 'Acesse suas turmas e acompanhe seus alunos.', color: '#10b981', icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
  { title: 'Notas', desc: 'Registre e acompanhe o desempenho dos alunos.', color: '#f59e0b', icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 12h6M9 16h6"/></svg> },
  { title: 'Frequência', desc: 'Controle de presença de forma prática.', color: '#ef4444', icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
  { title: 'Banco de Questões', desc: 'Crie avaliações com questões organizadas.', color: '#3b82f6', icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg> },
  { title: 'Planos de Ensino', desc: 'Cadastre e consulte seus planos de ensino.', color: '#ec4899', icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg> },
  { title: 'Atividades', desc: 'Crie tarefas, trabalhos e avaliações.', color: '#14b8a6', icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6"/><path d="M9 13l2 2 4-4"/></svg> },
];

/* ---------- Componente Principal ---------- */
export default function PortalProfessorLogin() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const vpRef = useRef<HTMLDivElement>(null);
  const scRef = useRef<HTMLDivElement>(null);

  /* Escala dinâmica idêntica ao HTML de referência */
  useEffect(() => {
    const fit = () => {
      if (window.innerWidth <= 768) {
        setIsMobile(true);
        if (scRef.current) {
          scRef.current.style.transform = 'none';
          scRef.current.style.width = '100%';
          scRef.current.style.height = 'auto';
        }
        return;
      }
      setIsMobile(false);
      const vp = vpRef.current;
      const sc = scRef.current;
      if (!vp || !sc) return;
      const vw = vp.clientWidth;
      const vh = vp.clientHeight;
      if (!vw || !vh) return;
      const s = Math.min(vw / 1536, vh / 1024);
      sc.style.width = (vw / s) + 'px';
      sc.style.height = (vh / s) + 'px';
      sc.style.transform = 'scale(' + s + ')';
    };
    fit();
    window.addEventListener('resize', fit);
    setTimeout(fit, 100);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      setIsLoading(true);
      await login(data);
    } catch (err: any) {
      setError(err?.message || 'Erro ao fazer login. Verifique suas credenciais.');
      setIsLoading(false);
      // Auto-hide toast error
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <>
      {/* 10. Preload imagens pesadas */}
      <link rel="preload" as="image" href="/assets/fundo_prof3.png" />
      <link rel="preload" as="image" href="/assets/professor_strip.png" />

      <div ref={vpRef} className="viewport" style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#0a2f66' }}>
        <div ref={scRef} className="scaler" style={{ transformOrigin: 'top left', width: 1536, height: 1024 }}>
          <div className="layout-container" style={{ display: 'flex', width: '100%', height: '100%', fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", background: '#fff' }}>

            {/* ================= PAINEL ESQUERDO (LOGIN) ================= */}
            <aside className="sidebar fade-in flex-none w-[30%] min-w-[380px] bg-white flex flex-col justify-center gap-5 px-14 py-8 box-border relative overflow-y-auto z-20" style={{}}>
              <Link
                href="/"
                className="absolute top-8 left-14 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1565d8] transition-colors group"
                style={{ textDecoration: 'none' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Voltar para seleção de perfil
              </Link>
              <div className="mt-8 flex items-center gap-3.5">
                <img src="/assets/logo_grafos2.png" alt="Logo Grafos" style={{ width: 54, height: 58, objectFit: 'contain' }} />
                <div className="flex flex-col gap-0.5">
                  <div className="text-[27px] font-extrabold text-[#1565d8] leading-none m-0">Grafos</div>
                  <div className="text-base text-[#5b6560] m-0">Gestão Escolar</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 mt-2">
                <div className="w-[34px] h-[34px] rounded-lg bg-[#1565d8] flex items-center justify-center flex-none">
                  <GradCap size={20} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-xl font-bold m-0 text-slate-900">Grafos Professor</div>
                  <div className="text-[13.5px] text-[#6a736e] m-0">Portal do Docente</div>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                    <p className="text-sm text-red-700 font-medium m-0">{error}</p>
                  </div>
                )}
                
                <label className="flex flex-col gap-2 m-0">
                  <span className="text-sm font-bold text-slate-900">Email Institucional</span>
                  <span
                    className={`flex items-center gap-2.5 border-[1.5px] rounded-lg px-3.5 h-12 bg-white transition-colors border-[#d7ddd9] focus-within:border-[#1565d8] focus-within:ring-[3px] focus-within:ring-[#1565d8]/15`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a938e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M2 7 L12 13 L22 7" />
                    </svg>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="carlos.santos@colegio.edu.br"
                      disabled={isLoading}
                      className="border-none outline-none flex-1 text-[15px] bg-transparent font-sans m-0 p-0"
                    />
                  </span>
                  {errors.email && <span className="text-[12.5px] font-semibold text-red-600 m-0">{errors.email.message}</span>}
                </label>

                <label className="flex flex-col gap-2 m-0">
                  <span className="text-sm font-bold text-slate-900">Senha</span>
                  <span
                    className={`flex items-center gap-2.5 border-[1.5px] rounded-lg px-3.5 h-12 bg-white transition-colors border-[#d7ddd9] focus-within:border-[#1565d8] focus-within:ring-[3px] focus-within:ring-[#1565d8]/15`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a938e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="10" width="16" height="11" rx="2" />
                      <path d="M8 10 V7 a4 4 0 0 1 8 0 v3" />
                    </svg>
                    <input
                      {...register('password')}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••"
                      disabled={isLoading}
                      className="border-none outline-none flex-1 text-[15px] bg-transparent font-sans tracking-wide m-0 p-0"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="border-none bg-transparent cursor-pointer p-0.5 flex" title="Mostrar senha">
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8a938e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19.5c-4.97 0-9.27-3.61-11-8.5a10.08 10.08 0 0 1 3.06-4.94M9.9 9.9a3 3 0 0 0 4.2 4.2M1 1l22 22M23 11a10.05 10.05 0 0 0-5.06-4.94M15 7.5A10.08 10.08 0 0 0 12 7c-1.32 0-2.58.26-3.72.72"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8a938e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12 C4.5 7 8 4.5 12 4.5 C16 4.5 19.5 7 22 12 C19.5 17 16 19.5 12 19.5 C8 19.5 4.5 17 2 12 Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </span>
                  {errors.password && <span className="text-[12.5px] font-semibold text-red-600 m-0">{errors.password.message}</span>}
                </label>

                <div className="flex items-center justify-between -mt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer text-[13.5px] text-[#3d4642] m-0">
                    <input type="checkbox" className="w-4 h-4 accent-[#1565d8]" />
                    Lembrar-me
                  </label>
                  <Link href="/forgot-password" className="text-[13.5px] font-bold text-[#1565d8] underline m-0" style={{ textDecoration: 'underline' }}>
                    Esqueceu sua senha?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2.5 flex items-center justify-center gap-2.5 h-[54px] rounded-lg text-white text-base font-bold font-sans transition hover:brightness-[1.12] active:brightness-95 bg-[#1565d8] disabled:opacity-75"
                  style={{ border: 'none', cursor: isLoading ? 'wait' : 'pointer' }}
                >
                  {isLoading ? (
                    <span className="w-[18px] h-[18px] rounded-full border-[2.5px] border-white/35 border-t-white animate-spin" />
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="10" width="16" height="11" rx="2" />
                      <path d="M8 10 V7 a4 4 0 0 1 8 0 v3" />
                    </svg>
                  )}
                  {isLoading ? "Autenticando…" : "Acessar Portal do Docente"}
                </button>
              </form>

              <div className="flex gap-4 bg-[#eff4fb] border border-[#d2dfef] rounded-[10px] px-[22px] py-5 mt-1.5">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1565d8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none mt-0.5">
                  <path d="M4 13 a8 8 0 0 1 16 0" />
                  <rect x="2.5" y="13" width="4" height="6.5" rx="2" />
                  <rect x="17.5" y="13" width="4" height="6.5" rx="2" />
                  <path d="M20 19.5 c0 2 -2 3 -5 3" />
                </svg>
                <div className="flex flex-col gap-1">
                  <div className="text-[14.5px] font-bold m-0 text-slate-900">Precisa de ajuda para acessar?</div>
                  <div className="text-[13px] text-[#6a736e] m-0">Nossa equipe está pronta para ajudar você.</div>
                  <Link href="/support" className="text-[13px] font-bold text-[#1565d8] underline mt-0.5" style={{ textDecoration: 'underline' }}>Entrar em contato com o suporte</Link>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[12.5px] text-[#6a736e] mt-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1565d8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10 V7 a4 4 0 0 1 8 0 v3" />
                </svg>
                Seus dados estão protegidos com criptografia avançada.
              </div>
            </aside>

            {/* ================= PAINEL DIREITO (AZUL) ================= */}
            <main className="main-panel fade-in-delayed" style={{ position: 'relative', flex: 1, minWidth: 920, height: '100%', background: 'linear-gradient(100deg, #0464de 0%, #0562d5 45%, #0180bb 100%)', overflow: 'hidden' }}>

              {/* 7. Toast animado de erro (Aparece no canto superior direito) */}
              <div className={`toast-error ${error ? 'show' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                {error}
              </div>

              {/* Ícones fantasma decorativos */}
              <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', top: 80, right: 330 }}><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
              <svg width="76" height="76" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', top: 70, right: 170 }}><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.13)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', top: 130, right: 60 }}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>

              {/* Fundo inferior e Professor */}
              {!isMobile && (
                <>
                  <div style={{ position: 'absolute', right: 0, bottom: 0, WebkitMaskImage: 'linear-gradient(to right, transparent 0px, #000 110px)', maskImage: 'linear-gradient(to right, transparent 0px, #000 110px)' }}>
                    <img src="/assets/fundo_prof3.png" alt="" style={{ width: 1096, height: 'auto', display: 'block', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 70px)', maskImage: 'linear-gradient(to bottom, transparent 0%, #000 70px)' }} />
                  </div>
                  <img src="/assets/professor_strip.png" alt="" aria-hidden="true" style={{ position: 'absolute', right: 0, bottom: 0, width: 416, height: 'auto', display: 'block', WebkitMaskImage: 'linear-gradient(to right, transparent 0px, #000 130px), linear-gradient(to bottom, transparent 0px, #000 90px)', WebkitMaskComposite: 'source-in', maskImage: 'linear-gradient(to right, transparent 0px, #000 130px), linear-gradient(to bottom, transparent 0px, #000 90px)', maskComposite: 'intersect' }} />
                </>
              )}

              {/* Faixa de benefícios */}
              <div className="benefits-strip fade-in-up" style={{ position: 'absolute', left: 40, right: 40, bottom: 20, height: 108, boxSizing: 'border-box', borderRadius: 12, background: 'rgba(8,45,110,.62)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                {[
                  { title: 'Acesso Online', desc: 'Acesse de qualquer lugar e dispositivo.', icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" /></svg> },
                  { title: 'Sincronização', desc: 'Seus dados são salvos automaticamente.', icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg> },
                  { title: 'Segurança', desc: 'Ambiente seguro e dados protegidos.', icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg> },
                  { title: 'Interface Intuitiva', desc: 'Design moderno, simples e fácil de usar.', icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M9 9h.01M15 9h.01" /></svg> },
                  { title: 'Produtividade', desc: 'Mais organização e tempo para o que importa.', icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 15v3M12 10v8M17 6v12" /></svg> },
                ].map((b, i, arr) => (
                  <div className="benefit-item" key={i} style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 12, padding: '0 18px', borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,.16)' : 'none' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{b.icon}</div>
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '2px 0 4px' }}>{b.title}</h4>
                      <p style={{ fontSize: 12, color: '#cfe3ff', margin: 0, lineHeight: 1.4 }}>{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Hero */}
              <div className="hero fade-in-down" style={{ position: 'absolute', top: 60, left: 52, display: 'flex', alignItems: 'flex-start', gap: 32, width: 960 }}>
                <svg width="96" height="86" viewBox="0 0 48 40" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M24 2L2 12l22 10 22-10L24 2z" stroke="rgba(255,255,255,.85)" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M12 17v10c0 3 5.4 6 12 6s12-3 12-6V17" stroke="rgba(255,255,255,.85)" strokeWidth="2" strokeLinecap="round" />
                  <path d="M44 13v12" stroke="rgba(255,255,255,.85)" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="44" cy="28" r="2.4" fill="rgba(255,255,255,.85)" />
                </svg>
                <div>
                  <h1 style={{ fontSize: 42, fontWeight: 800, color: '#fff', lineHeight: 1.1, margin: '0 0 12px' }}>Ensinar ficou mais simples</h1>
                  <p style={{ fontSize: 19, color: '#e0edff', margin: 0, lineHeight: 1.5 }}>
                    Organize suas aulas, registre notas, acompanhe frequência<br />e mantenha a comunicação com seus alunos.
                  </p>
                </div>
              </div>

              {/* Grid 4×2 (7 cards) */}
              <div className="cards-grid" style={{ position: 'absolute', top: 210, left: 43, width: 905, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {CARDS.map((card, i) => (
                  <div className="feature-card fade-in-up" key={i} style={{ animationDelay: `${i * 0.05}s`, background: '#fff', borderRadius: 14, padding: '22px 20px', minHeight: 124, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 11, background: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: 14 }}>
                      {card.icon}
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>{card.title}</h3>
                    <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.45, margin: 0 }}>{card.desc}</p>
                  </div>
                ))}
              </div>

            </main>
          </div>
        </div>

        {/* CSS INJETADO (Animations, Hovers, Focus e Responsividade Mobile) */}
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          
          /* 1. Animações de Fade */
          .fade-in { animation: fadeIn 0.6s ease-out forwards; opacity: 0; }
          .fade-in-delayed { animation: fadeIn 0.8s ease-out 0.2s forwards; opacity: 0; }
          .fade-in-up { animation: fadeInUp 0.6s ease-out forwards; opacity: 0; transform: translateY(20px); }
          .fade-in-down { animation: fadeInDown 0.6s ease-out forwards; opacity: 0; transform: translateY(-20px); }
          
          @keyframes fadeIn { to { opacity: 1; } }
          @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
          @keyframes fadeInDown { to { opacity: 1; transform: translateY(0); } }

          /* 2 & 4. Hover nos Cards e Sombra mais forte */
          .feature-card { transition: transform 0.2s ease, box-shadow 0.2s ease; box-shadow: 0 12px 24px -8px rgba(0,20,60,.15); }
          .feature-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0,20,60,.2), 0 10px 10px -5px rgba(0,20,60,.1); border-color: rgba(0,0,0,0.1) !important; }

          /* 5. Focus State nos inputs */
          .input-focus-ring:focus-within { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.2); }

          /* 6. Hover no Botão Entrar */
          .btn-hover { transition: all 0.2s ease; }
          .btn-hover:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(21,101,216,.6) !important; filter: brightness(1.1); }

          /* 7. Toast animado para Erro */
          .toast-error { position: absolute; top: 20px; right: -300px; background: #ef4444; color: white; padding: 16px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 10px; box-shadow: 0 10px 25px -5px rgba(239,68,68,0.5); transition: right 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: 50; }
          .toast-error.show { right: 30px; }

          /* 8. Responsividade Mobile */
          @media (max-width: 768px) {
            .viewport { height: auto !important; overflow-y: auto !important; background: #fff !important; }
            .scaler { width: 100% !important; height: auto !important; transform: none !important; }
            .layout-container { flex-direction: column !important; height: auto !important; }
            .sidebar { width: 100% !important; padding: 30px 24px !important; min-height: 100vh; }
            .footer-secure { position: relative !important; left: 0 !important; bottom: 0 !important; margin-top: 40px !important; }
            
            .main-panel { min-width: 0 !important; width: 100% !important; height: auto !important; padding: 40px 24px !important; display: flex !important; flex-direction: column !important; }
            .hero { position: relative !important; top: 0 !important; left: 0 !important; width: 100% !important; flex-direction: column; text-align: center; align-items: center !important; gap: 20px !important; }
            .hero svg { display: none; }
            .hero br { display: none; }
            
            .cards-grid { position: relative !important; top: 0 !important; left: 0 !important; width: 100% !important; grid-template-columns: 1fr !important; gap: 16px !important; margin-top: 30px; }
            
            .benefits-strip { position: relative !important; left: 0 !important; right: 0 !important; bottom: 0 !important; height: auto !important; flex-direction: column !important; align-items: stretch !important; margin-top: 30px; padding: 16px !important; }
            .benefit-item { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,.16); padding: 16px 0 !important; }
            .benefit-item:last-child { border-bottom: none !important; }
            
            .toast-error { top: 20px; left: 50%; transform: translateX(-50%); right: auto; transition: top 0.3s; }
            .toast-error:not(.show) { top: -100px; right: auto; }
          }
        `}</style>
      </div>
    </>
  );
}
