'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function PaisLoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
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
    }
  };

  return (
    <div className="w-screen h-screen flex font-[system-ui] bg-white overflow-hidden">
      
      {/* COLUNA ESQUERDA - LOGIN */}
      <div className="flex-none w-full lg:w-[30%] lg:min-w-[380px] bg-white flex flex-col justify-center gap-5 px-8 lg:px-14 py-8 box-border relative overflow-y-auto z-20">
        <Link
          href="/"
          className="absolute top-8 left-8 lg:left-14 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#ea580c] transition-colors group"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Voltar para seleção de perfil
        </Link>
        <div className="mt-8 flex items-center gap-3.5">
          <img src="/assets/familia_logo.png" alt="Grafos Logo" width={56} height={54} className="object-contain" />
          <div className="flex flex-col gap-0.5">
            <div className="text-[27px] font-extrabold text-[#ea580c] leading-none">Grafos</div>
            <div className="text-base text-[#5b6560]">Gestão Escolar</div>
          </div>
        </div>

        <div className="flex items-start gap-3.5 mt-2">
          <div className="w-[34px] h-[34px] rounded-lg bg-[#ea580c] flex items-center justify-center flex-none">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 21a6 6 0 00-12 0"></path><circle cx="12" cy="9" r="4"></circle><path d="M22 21a4 4 0 00-3-3.87M2 21a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75"></path></svg>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-xl font-bold">Grafos Família</div>
            <div className="text-[13.5px] text-[#6a736e]">Portal dos Responsáveis</div>
          </div>
        </div>

        <form className="flex flex-col gap-4 mt-2" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-[10px] bg-[#fef2f2] border border-[#fecaca] p-3 mb-2">
              <p className="text-[13px] text-[#991b1b] m-0">{error}</p>
            </div>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold">Email Institucional</span>
            <span
              className={`flex items-center gap-2.5 border-[1.5px] rounded-lg px-3.5 h-12 bg-white transition-colors border-[#d7ddd9] focus-within:border-[#ea580c] focus-within:ring-[3px] focus-within:ring-[#ea580c]/15`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a938e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 7 L12 13 L22 7" />
              </svg>
              <input
                {...register('email')} disabled={isLoading}
                type="email"
                placeholder="responsavel@email.com"
                className="border-none outline-none flex-1 text-[15px] bg-transparent font-sans"
              />
            </span>
            {errors.email && <p className="mt-1 text-[12px] text-[#ef4444]">{errors.email.message}</p>}
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold">Senha</span>
            <span
              className={`flex items-center gap-2.5 border-[1.5px] rounded-lg px-3.5 h-12 bg-white transition-colors border-[#d7ddd9] focus-within:border-[#ea580c] focus-within:ring-[3px] focus-within:ring-[#ea580c]/15`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a938e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10 V7 a4 4 0 0 1 8 0 v3" />
              </svg>
              <input
                {...register('password')} disabled={isLoading}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="border-none outline-none flex-1 text-[15px] bg-transparent font-sans tracking-wide"
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
            {errors.password && <p className="mt-1 text-[12px] text-[#ef4444]">{errors.password.message}</p>}
          </label>

          <div className="flex items-center justify-between -mt-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-[13.5px] text-[#3d4642]">
              <input type="checkbox" className="w-4 h-4 accent-[#ea580c]" />
              Lembrar-me
            </label>
            <Link href="#" className="text-[13.5px] font-bold text-[#ea580c] underline">
              Esqueceu sua senha?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2.5 flex items-center justify-center gap-2.5 h-[54px] rounded-lg text-white text-base font-bold font-sans transition hover:brightness-[1.12] active:brightness-95 bg-[#ea580c] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10 V7 a4 4 0 0 1 8 0 v3" />
              </svg>
            )}
            {isLoading ? 'Entrando...' : 'Acessar Portal'}
          </button>
        </form>

        <div className="flex gap-4 bg-[#fdf1e9] border border-[#f9dcc8] rounded-[10px] px-[22px] py-5 mt-1.5">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none mt-0.5">
            <path d="M4 13 a8 8 0 0 1 16 0" />
            <rect x="2.5" y="13" width="4" height="6.5" rx="2" />
            <rect x="17.5" y="13" width="4" height="6.5" rx="2" />
            <path d="M20 19.5 c0 2 -2 3 -5 3" />
          </svg>
          <div className="flex flex-col gap-1">
            <div className="text-[14.5px] font-bold">Precisa de ajuda para acessar?</div>
            <div className="text-[13px] text-[#6a736e]">Nossa equipe está pronta para ajudar você.</div>
            <Link href="#" className="text-[13px] font-bold text-[#ea580c] underline mt-0.5">Entrar em contato com o suporte</Link>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[12.5px] text-[#6a736e] mt-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10 V7 a4 4 0 0 1 8 0 v3" />
          </svg>
          Seus dados estão protegidos com criptografia avançada.
        </div>
      </div>

      {/* COLUNA DIREITA - VITRINE (Oculto em telas menores que lg) */}
      <main className="hidden lg:flex flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#f97316 0%,#ea580c 45%,#c2410c 100%)' }}>
        
        <svg width="30" height="30" viewBox="0 0 24 24" fill="rgba(255,255,255,.15)" style={{ position: 'absolute', top: '56px', right: '260px' }}><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z"></path></svg>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.13)" strokeWidth="1.5" style={{ position: 'absolute', top: '52px', right: '190px' }}><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path></svg>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.13)" strokeWidth="1.5" style={{ position: 'absolute', top: '110px', right: '60px' }}><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"></path></svg>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.13)" strokeWidth="1.5" style={{ position: 'absolute', top: '190px', right: '150px' }}><path d="M3 3v18h18"></path><path d="M7 15v3M12 10v8M17 6v12"></path></svg>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.13)" strokeWidth="1.5" style={{ position: 'absolute', top: '230px', right: '40px' }}><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0110 0v4"></path></svg>

          <div style={{ position: 'absolute', top: '52px', left: '52px', width: '660px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 21a6 6 0 00-12 0"></path><circle cx="12" cy="9" r="4"></circle><path d="M22 21a4 4 0 00-3-3.87M2 21a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75"></path></svg>
              </div>
              <div>
                <h1 style={{ fontSize: '38px', fontWeight: 800, color: '#fff', lineHeight: 1.1, margin: '0 0 12px' }}>Acompanhe cada<br />conquista do seu filho</h1>
                <p style={{ fontSize: '16px', color: '#fde6d4', margin: 0, lineHeight: 1.35, maxWidth: '520px' }}>Tenha acesso às notas, frequência, agenda escolar, comunicados e desenvolvimento acadêmico em um único lugar.</p>
              </div>
            </div>
          </div>

          <div style={{ position: 'absolute', top: '196px', left: '44px', width: '660px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
            <div style={{ background: '#fff', borderRadius: '13px', padding: '14px 12px', boxShadow: '0 12px 24px -10px rgba(60,20,0,.30)', minHeight: '112px', boxSizing: 'border-box' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: '9px' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M7 15v3M12 10v8M17 6v12"></path></svg></div>
              <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Desempenho Escolar</h3>
              <p style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.3, margin: 0 }}>Acompanhe notas, médias e evolução.</p>
            </div>
            <div style={{ background: '#fff', borderRadius: '13px', padding: '14px 12px', boxShadow: '0 12px 24px -10px rgba(60,20,0,.30)', minHeight: '112px', boxSizing: 'border-box' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: '9px' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path></svg></div>
              <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Frequência</h3>
              <p style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.3, margin: 0 }}>Visualize presenças e faltas do seu filho.</p>
            </div>
            <div style={{ background: '#fff', borderRadius: '13px', padding: '14px 12px', boxShadow: '0 12px 24px -10px rgba(60,20,0,.30)', minHeight: '112px', boxSizing: 'border-box' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: '9px' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"></path></svg></div>
              <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Comunicados</h3>
              <p style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.3, margin: 0 }}>Receba avisos importantes da escola.</p>
            </div>
            <div style={{ background: '#fff', borderRadius: '13px', padding: '14px 12px', boxShadow: '0 12px 24px -10px rgba(60,20,0,.30)', minHeight: '112px', boxSizing: 'border-box' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: '9px' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1"></rect><path d="M9 12h6M9 16h6"></path></svg></div>
              <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Atividades</h3>
              <p style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.3, margin: 0 }}>Consulte tarefas, trabalhos e datas de entrega.</p>
            </div>
            <div style={{ background: '#fff', borderRadius: '13px', padding: '14px 12px', boxShadow: '0 12px 24px -10px rgba(60,20,0,.30)', minHeight: '112px', boxSizing: 'border-box' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: '9px' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path><path d="M8 15h2m4 0h2"></path></svg></div>
              <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Agenda Escolar</h3>
              <p style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.3, margin: 0 }}>Confira eventos, reuniões e calendário de provas.</p>
            </div>
          </div>

          <img src="/assets/familia_cena.png" alt="Família acompanhando o portal escolar" style={{ position: 'absolute', left: '295px', bottom: '104px', width: '660px', height: 'auto', display: 'block', zIndex: 5, WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, #000 40px, #000 calc(100% - 8px), transparent 100%), linear-gradient(to right, transparent 0px, #000 90px, #000 calc(100% - 60px), transparent 100%)', WebkitMaskComposite: 'source-in', maskImage: 'linear-gradient(to bottom, transparent 0px, #000 40px, #000 calc(100% - 8px), transparent 100%), linear-gradient(to right, transparent 0px, #000 90px, #000 calc(100% - 60px), transparent 100%)', maskComposite: 'intersect' }} />

          <div style={{ position: 'absolute', top: '474px', left: '44px', width: '250px', display: 'flex', flexDirection: 'column', gap: '14px', zIndex: 6 }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px 18px', boxShadow: '0 14px 30px -12px rgba(60,20,0,.35)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M7 15v3M12 10v8M17 6v12"></path></svg>
                <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Boletim do Aluno</h3>
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 10px' }}>Médias do 2º Bimestre</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}><span style={{ color: '#475569' }}>Matemática</span><span style={{ fontWeight: 700, color: '#16a34a' }}>9,4</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}><span style={{ color: '#475569' }}>Português</span><span style={{ fontWeight: 700, color: '#16a34a' }}>8,9</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}><span style={{ color: '#475569' }}>História</span><span style={{ fontWeight: 700, color: '#16a34a' }}>9,1</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}><span style={{ color: '#475569' }}>Ciências</span><span style={{ fontWeight: 700, color: '#16a34a' }}>9,0</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}><span style={{ color: '#475569' }}>Inglês</span><span style={{ fontWeight: 700, color: '#16a34a' }}>8,7</span></div>
              </div>
              <div style={{ background: '#fdf1e9', color: '#ea580c', fontSize: '12px', fontWeight: 700, textAlign: 'center', padding: '9px', borderRadius: '8px' }}>Ver boletim completo</div>
            </div>

          </div>

          <div style={{ position: 'absolute', top: '474px', right: '36px', width: '264px', display: 'flex', flexDirection: 'column', gap: '14px', zIndex: 6 }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px 18px', boxShadow: '0 14px 30px -12px rgba(60,20,0,.35)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path></svg>
                <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Próximos Eventos</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ background: '#fdf1e9', color: '#ea580c', fontSize: '10px', fontWeight: 800, textAlign: 'center', borderRadius: '7px', padding: '4px 7px', lineHeight: 1.15, flexShrink: 0 }}>15<br /><span style={{ fontSize: '8px', fontWeight: 600 }}>AGO</span></div>
                  <div><div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b' }}>Reunião de Pais</div><div style={{ fontSize: '11px', color: '#94a3b8' }}>19h00 • Auditório</div></div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ background: '#fdf1e9', color: '#ea580c', fontSize: '10px', fontWeight: 800, textAlign: 'center', borderRadius: '7px', padding: '4px 7px', lineHeight: 1.15, flexShrink: 0 }}>22<br /><span style={{ fontSize: '8px', fontWeight: 600 }}>AGO</span></div>
                  <div><div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b' }}>Feira Cultural</div><div style={{ fontSize: '11px', color: '#94a3b8' }}>8h00 • Escola</div></div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ background: '#fdf1e9', color: '#ea580c', fontSize: '10px', fontWeight: 800, textAlign: 'center', borderRadius: '7px', padding: '4px 7px', lineHeight: 1.15, flexShrink: 0 }}>28<br /><span style={{ fontSize: '8px', fontWeight: 600 }}>AGO</span></div>
                  <div><div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b' }}>Conselho Escolar</div><div style={{ fontSize: '11px', color: '#94a3b8' }}>14h00 • Sala 03</div></div>
                </div>
              </div>
              <div style={{ background: '#fdf1e9', color: '#ea580c', fontSize: '12px', fontWeight: 700, textAlign: 'center', padding: '9px', borderRadius: '8px' }}>Ver calendário completo</div>
            </div>

          </div>

          <div style={{ position: 'absolute', left: '40px', right: '40px', bottom: '20px', height: '88px', boxSizing: 'border-box', borderRadius: '12px', background: 'rgba(90,30,0,.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', padding: '0 8px', zIndex: 7 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '11px', padding: '0 14px', borderRight: '1px solid rgba(255,255,255,.16)' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z"></path></svg></div>
              <div><h4 style={{ fontSize: '12px', fontWeight: 700, color: '#fff', margin: '1px 0 3px' }}>Participação Familiar</h4><p style={{ fontSize: '10.5px', color: '#fde6d4', margin: 0, lineHeight: 1.3 }}>Fortaleça o vínculo entre família e escola.</p></div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '11px', padding: '0 14px', borderRight: '1px solid rgba(255,255,255,.16)' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13 1 .36 1.94.68 2.85a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.23-1.25a2 2 0 012.11-.45c.91.32 1.85.55 2.85.68A2 2 0 0122 16.92z"></path></svg></div>
              <div><h4 style={{ fontSize: '12px', fontWeight: 700, color: '#fff', margin: '1px 0 3px' }}>Acesso Online</h4><p style={{ fontSize: '10.5px', color: '#fde6d4', margin: 0, lineHeight: 1.3 }}>Acompanhe de qualquer lugar e dispositivo.</p></div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '11px', padding: '0 14px', borderRight: '1px solid rgba(255,255,255,.16)' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"></path></svg></div>
              <div><h4 style={{ fontSize: '12px', fontWeight: 700, color: '#fff', margin: '1px 0 3px' }}>Comunicação Direta</h4><p style={{ fontSize: '10.5px', color: '#fde6d4', margin: 0, lineHeight: 1.3 }}>Fale com professores e coordenação.</p></div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '11px', padding: '0 14px', borderRight: '1px solid rgba(255,255,255,.16)' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4"></path></svg></div>
              <div><h4 style={{ fontSize: '12px', fontWeight: 700, color: '#fff', margin: '1px 0 3px' }}>Segurança</h4><p style={{ fontSize: '10.5px', color: '#fde6d4', margin: 0, lineHeight: 1.3 }}>Seus dados protegidos com criptografia.</p></div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '11px', padding: '0 14px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M7 15v3M12 10v8M17 6v12"></path></svg></div>
              <div><h4 style={{ fontSize: '12px', fontWeight: 700, color: '#fff', margin: '1px 0 3px' }}>Informações em Tempo Real</h4><p style={{ fontSize: '10.5px', color: '#fde6d4', margin: 0, lineHeight: 1.3 }}>Dados sempre atualizados para você acompanhar.</p></div>
            </div>
          </div>
        </main>
    </div>
  );
}
