'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  remember: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const PRIMARY = "#046a38";

const FEATURES = [
  { title: "Gestão de Usuários", color: "#1d6ff2", desc: "Alunos, professores, responsáveis e coordenadores." },
  { title: "Acadêmico", color: "#12a150", desc: "Turmas, disciplinas, horários, anos letivos e calendário escolar." },
  { title: "Indicadores", color: "#7c3aed", desc: "Relatórios, estatísticas e acompanhamento de desempenho." },
  { title: "Administração", color: "#f97316", desc: "Cursos, comunicados, eventos e configurações da instituição." },
];

const PERKS = [
  { title: "100% Online", desc: "Acesse de qualquer lugar e dispositivo." },
  { title: "Seguro", desc: "Seus dados protegidos com tecnologia avançada." },
  { title: "Multi dispositivos", desc: "Funciona no computador, tablet e celular." },
  { title: "Interface moderna", desc: "Navegação simples, rápida e intuitiva." },
];

const STUDENTS = [
  { name: "Ana", color: "#e8879a", light: "#ffc2d1", dark: "#c15a72" },
  { name: "Bruno", color: "#f4c14e", light: "#ffe29a", dark: "#c98f1e" },
  { name: "Carla", color: "#7fb8e8", light: "#c3e2ff", dark: "#4a86bd" },
];

const DIARY_ROWS = [
  { name: "Ana Souza", color: "#e8879a", light: "#ffc2d1", dark: "#c15a72" },
  { name: "Bruno Lima", color: "#f4c14e", light: "#ffe29a", dark: "#c98f1e" },
  { name: "Carla Dias", color: "#7fb8e8", light: "#c3e2ff", dark: "#4a86bd" },
];

function Avatar3D({ color, light, dark, size = 34 }: { color: string; light: string; dark: string; size?: number }) {
  return (
    <div
      className="relative rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 32% 28%, ${light}, ${color} 60%, ${dark} 100%)`,
        boxShadow: "0 3px 6px rgba(0,0,0,.25), inset 0 -3px 4px rgba(0,0,0,.15)",
      }}
    >
      <div
        className="absolute rounded-full bg-white/55"
        style={{ top: size * 0.15, left: size * 0.2, width: size * 0.26, height: size * 0.18 }}
      />
      <svg width={size} height={size} viewBox="0 0 24 24" className="absolute top-0 left-0">
        <circle cx="12" cy="9.5" r="3.6" fill="rgba(255,255,255,.92)" />
        <path d="M4.5 21c0-4.2 3.4-6.8 7.5-6.8s7.5 2.6 7.5 6.8" fill="rgba(255,255,255,.92)" />
      </svg>
    </div>
  );
}

export default function AdminLoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [focused, setFocused] = useState<"email" | "pw" | "">("");

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
      await login({ email: data.email, password: data.password });
    } catch (err: any) {
      setError(err?.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  const fieldBorder = (hasError: boolean, isFocused: boolean) =>
    hasError ? "border-red-500" : isFocused ? "border-[#0e7a3e] ring-[3px] ring-[#0e7a3e]/15" : "border-[#d7ddd9]";

  return (
    <div className="flex w-full min-w-[1280px] h-screen overflow-hidden font-sans text-[#1a1f1c] bg-white">
      {/* LEFT: login panel */}
      <div className="flex-none w-[30%] min-w-[380px] bg-white flex flex-col justify-center gap-5 px-14 py-8 box-border relative overflow-y-auto">
        <Link
          href="/"
          className="absolute top-8 left-14 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0e7a3e] transition-colors group"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Voltar para página inicial
        </Link>
        <div className="mt-8 flex items-center gap-3.5">
          <Image src="/login-logo.png" alt="Grafos" width={60} height={66} className="object-contain" />
          <div className="flex flex-col gap-0.5">
            <div className="text-[27px] font-extrabold text-[#0e7a3e] leading-none">Grafos</div>
            <div className="text-base text-[#5b6560]">Gestão Escolar</div>
          </div>
        </div>

        <div className="flex items-start gap-3.5 mt-2">
          <svg width="34" height="38" viewBox="0 0 24 26" fill="none" stroke="#0e7a3e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1 L22 5 V12 C22 19 17 23.5 12 25 C7 23.5 2 19 2 12 V5 Z" />
            <path d="M8 12.5 L11 15.5 L16 9.5" />
          </svg>
          <div className="flex flex-col gap-1">
            <div className="text-xl font-bold">Acesso Administrativo</div>
            <div className="text-[13.5px] text-[#6a736e]">Área restrita para gestores e administradores.</div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}
          
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold">Email Institucional</span>
            <span
              className={`flex items-center gap-2.5 border-[1.5px] rounded-lg px-3.5 h-12 bg-white transition-colors ${fieldBorder(
                !!errors.email,
                focused === "email"
              )}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a938e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 7 L12 13 L22 7" />
              </svg>
              <input
                {...register('email')}
                type="email"
                placeholder="seu@email.com"
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused("")}
                className="border-none outline-none flex-1 text-[15px] bg-transparent font-sans"
              />
            </span>
            {errors.email && <span className="text-[12.5px] font-semibold text-red-600">{errors.email.message}</span>}
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold">Senha</span>
            <span
              className={`flex items-center gap-2.5 border-[1.5px] rounded-lg px-3.5 h-12 bg-white transition-colors ${fieldBorder(
                !!errors.password,
                focused === "pw"
              )}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a938e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10 V7 a4 4 0 0 1 8 0 v3" />
              </svg>
              <input
                {...register('password')}
                type={showPw ? "text" : "password"}
                placeholder="••••••••••"
                onFocus={() => setFocused("pw")}
                onBlur={() => setFocused("")}
                className="border-none outline-none flex-1 text-[15px] bg-transparent font-sans tracking-wide"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="border-none bg-transparent cursor-pointer p-0.5 flex" title="Mostrar senha">
                {showPw ? (
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
            {errors.password && <span className="text-[12.5px] font-semibold text-red-600">{errors.password.message}</span>}
          </label>

          <div className="flex items-center justify-between -mt-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-[13.5px] text-[#3d4642]">
              <input type="checkbox" {...register('remember')} className="w-4 h-4 accent-[#0e7a3e]" />
              Lembrar-me
            </label>
            <Link href="/forgot-password" className="text-[13.5px] font-bold text-[#0e7a3e] underline">
              Esqueceu sua senha?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{ backgroundColor: PRIMARY }}
            className="mt-2.5 flex items-center justify-center gap-2.5 h-[54px] rounded-lg text-white text-base font-bold font-sans transition hover:brightness-[1.12] active:brightness-95 disabled:opacity-75"
          >
            {isLoading ? (
              <span className="w-[18px] h-[18px] rounded-full border-[2.5px] border-white/35 border-t-white animate-spin" />
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10 V7 a4 4 0 0 1 8 0 v3" />
              </svg>
            )}
            {isLoading ? "Autenticando…" : "Acessar Painel Administrativo"}
          </button>
        </form>

        <div className="flex gap-4 bg-[#eef6f0] border border-[#d9ebdf] rounded-[10px] px-[22px] py-5 mt-1.5">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0e7a3e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none mt-0.5">
            <path d="M4 13 a8 8 0 0 1 16 0" />
            <rect x="2.5" y="13" width="4" height="6.5" rx="2" />
            <rect x="17.5" y="13" width="4" height="6.5" rx="2" />
            <path d="M20 19.5 c0 2 -2 3 -5 3" />
          </svg>
          <div className="flex flex-col gap-1">
            <div className="text-[14.5px] font-bold">Precisa de ajuda para acessar?</div>
            <div className="text-[13px] text-[#6a736e]">Nossa equipe está pronta para ajudar você.</div>
            <Link href="/support" className="text-[13px] font-bold text-[#0e7a3e] underline mt-0.5">Entrar em contato com o suporte</Link>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[12.5px] text-[#6a736e] mt-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0e7a3e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10 V7 a4 4 0 0 1 8 0 v3" />
          </svg>
          Seus dados estão protegidos com criptografia avançada.
        </div>
      </div>

      {/* RIGHT: brand panel */}
      <div className="flex-1 bg-[#01603c] flex flex-col px-14 pt-6 box-border text-white relative overflow-hidden hidden lg:flex">
        <div className="flex items-start gap-[26px]">
          <svg width="72" height="80" viewBox="0 0 24 26" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
            <path d="M12 1 L22 5 V12 C22 19 17 23.5 12 25 C7 23.5 2 19 2 12 V5 Z" />
            <path d="M12 8 L17.5 10.2 L12 12.4 L6.5 10.2 Z" fill="#fff" stroke="none" />
            <path d="M8.5 11.2 v2.6 c0 1.1 1.6 2 3.5 2 s3.5 -.9 3.5 -2 v-2.6" fill="none" />
          </svg>
          <div className="flex flex-col gap-1.5">
            <div className="text-[38px] 2xl:text-[42px] font-extrabold leading-[1.05] tracking-tight">Gestão Escolar Inteligente</div>
            <div className="text-xl leading-[1.4] text-white/90">
              Gerencie alunos, professores, turmas, disciplinas
              <br />
              e toda a rotina escolar em uma <span className="text-[#5fd98a] font-semibold">única plataforma</span>.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white/[.08] border border-white/[.12] rounded-[14px] p-[18px] flex flex-col gap-2.5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: f.color }} />
              <div className="text-lg font-bold">{f.title}</div>
              <div className="text-[14.5px] leading-[1.45] text-white/85 -mt-1.5">{f.desc}</div>
            </div>
          ))}
        </div>

        <div className="flex mt-4 border-t border-white/[.18] pt-4">
          {PERKS.map((p, i) => (
            <div key={p.title} className={`flex-1 flex gap-3 items-start px-[18px] ${i > 0 ? "border-l border-white/[.18]" : ""}`}>
              <div className="flex flex-col gap-0.5">
                <div className="text-[15.5px] font-bold">{p.title}</div>
                <div className="text-[13px] leading-[1.4] text-white/85">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 min-h-0 w-[calc(100%+112px)] -mx-14 mt-4 flex items-end justify-center relative">
          <div className="relative inline-flex max-w-full max-h-full">
            <Image src="/login-illustration.png" alt="Ilustração da escola" width={1000} height={500} className="max-w-full max-h-full w-auto h-auto block" priority />
            <div className="absolute inset-0">

          {/* Calendário Letivo */}
          <div className="absolute left-[3.7%] top-[8%] w-[20.5%] bg-white rounded-xl shadow-[0_10px_22px_rgba(0,0,0,.28)] p-3 flex flex-col gap-1.5 box-border">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#0e9a4e] flex items-center justify-center flex-none">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M16 3v4M8 3v4M3 10h18" />
                </svg>
              </div>
              <div className="text-[12.5px] font-bold whitespace-nowrap text-gray-900">Calendário Letivo</div>
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {["D", "S", "T", "Q", "Q", "S", "S"].map((w, i) => (
                <div key={i} className="text-[7.5px] font-bold text-center text-[#9aa39d]">{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5 mt-0.5">
              {Array.from({ length: 21 }, (_, i) => i + 1).map((n) => (
                <div
                  key={n}
                  className="h-3 flex items-center justify-center text-[7.5px] font-semibold rounded-full"
                  style={n === 14 ? { color: "#fff", background: "#0e9a4e" } : { color: "#5b6560" }}
                >
                  {n}
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-0.5">
              <div className="w-5 h-5 rounded-full bg-[#0e9a4e] flex items-center justify-center">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12l5 5L20 6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Alunos */}
          <div className="absolute left-[4.1%] top-[52%] w-[18%] bg-white rounded-xl shadow-[0_10px_22px_rgba(0,0,0,.28)] p-3.5 flex flex-col gap-[11px] box-border">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#1d6ff2] flex items-center justify-center flex-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="8" r="3" />
                  <path d="M2 20c0-3 3-5 7-5s7 2 7 5" />
                  <path d="M17 9a3 3 0 1 0 0-6" />
                  <path d="M22 20c0-2.5-2-4.2-5-4.8" />
                </svg>
              </div>
              <div className="text-[13.5px] font-bold text-gray-900">Alunos</div>
            </div>
            <div className="flex gap-3.5">
              {STUDENTS.map((s) => (
                <div key={s.name} className="flex flex-col items-center gap-1.5">
                  <Avatar3D {...s} />
                  <div className="text-[9px] font-semibold text-[#7b847e]">{s.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Diário de Classe */}
          <div className="absolute left-[73.6%] top-[5%] w-[20.5%] bg-white rounded-xl shadow-[0_10px_22px_rgba(0,0,0,.28)] p-3 flex flex-col gap-[7px] box-border">
            <div className="flex items-center gap-2">
              <div className="w-[26px] h-[26px] rounded-md bg-[#7c3aed] flex items-center justify-center flex-none">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="8" r="3" />
                  <path d="M2 20c0-3 3-5 7-5s7 2 7 5" />
                  <path d="M17 9a3 3 0 1 0 0-6" />
                  <path d="M22 20c0-2.5-2-4.2-5-4.8" />
                </svg>
              </div>
              <div className="text-[13.5px] font-bold whitespace-nowrap text-gray-900">Diário de Classe</div>
            </div>
            {DIARY_ROWS.map((r) => (
              <div key={r.name} className="flex items-center gap-2">
                <Avatar3D {...r} size={20} />
                <div className="text-[11.5px] text-[#3d4642] flex-1">{r.name}</div>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0e9a4e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
                  <path d="M4 12l5 5L20 6" />
                </svg>
              </div>
            ))}
          </div>

          {/* Comunicados */}
          <div className="absolute left-[73.6%] top-[47%] w-[20.5%] bg-white rounded-xl shadow-[0_10px_22px_rgba(0,0,0,.28)] p-4 flex flex-col gap-2.5 box-border">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#f97316] flex items-center justify-center flex-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11v2a2 2 0 0 0 2 2h1l4 4v-6" />
                  <path d="M6 15h4l7-4v9l-7-4" />
                  <path d="M17 8s2 1 2 4-2 4-2 4" />
                </svg>
              </div>
              <div className="text-[13.5px] font-bold text-gray-900">Comunicados</div>
            </div>
            <div className="flex flex-col gap-1.5">
              {["Reunião de pais — dia 15", "Novo comunicado da direção"].map((txt) => (
                <div key={txt} className="flex items-center gap-1.5">
                  <div className="w-[5px] h-[5px] rounded-full bg-[#f97316] flex-none" />
                  <div className="text-[11.5px] text-[#3d4642]">{txt}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Relatórios */}
          <div className="absolute left-[73.6%] top-[76%] w-[15%] bg-white rounded-xl shadow-[0_10px_22px_rgba(0,0,0,.28)] p-4 flex flex-col gap-[11px] box-border">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#0e9a4e] flex items-center justify-center flex-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
                </svg>
              </div>
              <div className="text-[13.5px] font-bold text-gray-900">Relatórios</div>
            </div>
            <div className="flex items-center gap-3.5">
              <div
                className="w-9 h-9 rounded-full flex-none"
                style={{ background: "conic-gradient(#1d6ff2 0deg 130deg, #f97316 130deg 220deg, #0e9a4e 220deg 360deg)" }}
              />
              <div className="flex items-end gap-1">
                <div className="w-1.5 h-3.5 bg-[#0e9a4e] rounded-sm" />
                <div className="w-1.5 h-[22px] bg-[#0e9a4e] rounded-sm" />
                <div className="w-1.5 h-2.5 bg-[#0e9a4e] rounded-sm" />
              </div>
            </div>
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
