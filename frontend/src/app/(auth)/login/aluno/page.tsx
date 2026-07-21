'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Users, Mail, Lock, Eye, EyeOff, Headset, 
  ShieldCheck, Book, ClipboardList, CheckSquare, 
  Calendar, BarChart2, MessageCircle, Cloud, 
  RefreshCcw, Smile, Rocket, ArrowLeft, ArrowRight,
  GraduationCap, Sparkles
} from 'lucide-react';

export default function AlunoLogin() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-screen h-screen flex font-[system-ui] bg-white overflow-hidden">
      
      {/* COLUNA ESQUERDA - LOGIN */}
      <div className="flex-none w-full lg:w-[30%] lg:min-w-[380px] bg-white flex flex-col justify-center gap-5 px-8 lg:px-14 py-8 box-border relative overflow-y-auto z-20">
        <Link
          href="/"
          className="absolute top-8 left-8 lg:left-14 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#22a05f] transition-colors group"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Voltar para seleção de perfil
        </Link>
        <div className="mt-8 flex items-center gap-3.5">
          <Image src="/assets/aluno_logo.png" alt="Grafos Logo" width={56} height={54} className="object-contain" />
          <div className="flex flex-col gap-0.5">
            <div className="text-[27px] font-extrabold text-[#22a05f] leading-none">Grafos</div>
            <div className="text-base text-[#5b6560]">Gestão Escolar</div>
          </div>
        </div>

        <div className="flex items-start gap-3.5 mt-2">
          <div className="w-[34px] h-[34px] rounded-lg bg-[#22a05f] flex items-center justify-center flex-none">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-xl font-bold">Grafos Aluno</div>
            <div className="text-[13.5px] text-[#6a736e]">Portal do Estudante</div>
          </div>
        </div>

        <form className="flex flex-col gap-4 mt-2" onSubmit={(e) => e.preventDefault()}>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold">Email Institucional</span>
            <span
              className={`flex items-center gap-2.5 border-[1.5px] rounded-lg px-3.5 h-12 bg-white transition-colors border-[#d7ddd9] focus-within:border-[#22a05f] focus-within:ring-[3px] focus-within:ring-[#22a05f]/15`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a938e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 7 L12 13 L22 7" />
              </svg>
              <input
                type="email"
                placeholder="aluno@escola.edu.br"
                className="border-none outline-none flex-1 text-[15px] bg-transparent font-sans"
              />
            </span>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold">Senha</span>
            <span
              className={`flex items-center gap-2.5 border-[1.5px] rounded-lg px-3.5 h-12 bg-white transition-colors border-[#d7ddd9] focus-within:border-[#22a05f] focus-within:ring-[3px] focus-within:ring-[#22a05f]/15`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a938e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10 V7 a4 4 0 0 1 8 0 v3" />
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••"
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
          </label>

          <div className="flex items-center justify-between -mt-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-[13.5px] text-[#3d4642]">
              <input type="checkbox" className="w-4 h-4 accent-[#22a05f]" />
              Lembrar-me
            </label>
            <Link href="#" className="text-[13.5px] font-bold text-[#22a05f] underline">
              Esqueceu sua senha?
            </Link>
          </div>

          <button
            type="submit"
            className="mt-2.5 flex items-center justify-center gap-2.5 h-[54px] rounded-lg text-white text-base font-bold font-sans transition hover:brightness-[1.12] active:brightness-95 bg-[#22a05f]"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10 V7 a4 4 0 0 1 8 0 v3" />
            </svg>
            Acessar Portal do Estudante
          </button>
        </form>

        <div className="flex gap-4 bg-[#eaf7ef] border border-[#d2eedc] rounded-[10px] px-[22px] py-5 mt-1.5">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#22a05f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none mt-0.5">
            <path d="M4 13 a8 8 0 0 1 16 0" />
            <rect x="2.5" y="13" width="4" height="6.5" rx="2" />
            <rect x="17.5" y="13" width="4" height="6.5" rx="2" />
            <path d="M20 19.5 c0 2 -2 3 -5 3" />
          </svg>
          <div className="flex flex-col gap-1">
            <div className="text-[14.5px] font-bold">Precisa de ajuda para acessar?</div>
            <div className="text-[13px] text-[#6a736e]">Nossa equipe está pronta para ajudar você.</div>
            <Link href="#" className="text-[13px] font-bold text-[#22a05f] underline mt-0.5">Entrar em contato com o suporte</Link>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[12.5px] text-[#6a736e] mt-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22a05f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10 V7 a4 4 0 0 1 8 0 v3" />
          </svg>
          Seus dados estão protegidos com criptografia avançada.
        </div>
      </div>

      {/* COLUNA DIREITA - VITRINE (Oculto em telas menores que lg) */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-[#279255] via-[#2ba05e] to-[#4bb279] overflow-hidden">
        
        {/* Ícones fantasmas decorativos no topo direita */}
        <div className="absolute top-10 right-10 flex gap-8 xl:gap-12 text-white/10 pointer-events-none">
          <Book className="w-16 h-16 xl:w-24 xl:h-24 transform -rotate-12" />
          <GraduationCap className="w-20 h-20 xl:w-28 xl:h-28 transform rotate-12" />
          <Sparkles className="w-12 h-12 xl:w-20 xl:h-20 transform -rotate-6" />
        </div>

        {/* Imagem do estudante com fade mask */}
        <div 
          className="absolute bottom-[-10px] right-[-20px] 2xl:right-10 w-[70%] max-w-[850px] z-10 pointer-events-none"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%), linear-gradient(to left, transparent 0%, black 20%, black 80%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%), linear-gradient(to left, transparent 0%, black 20%, black 80%, transparent 100%)',
            WebkitMaskComposite: 'source-in',
            maskComposite: 'intersect'
          }}
        >
          <Image 
            src="/assets/aluno_cena2.png" 
            alt="Estudante em frente ao notebook" 
            width={850} 
            height={750}
            className="w-full h-auto object-contain object-bottom"
            priority
          />
        </div>

        {/* Conteúdo Principal da Vitrine */}
        <div className="relative z-20 w-full h-full flex flex-col p-8 xl:p-14 2xl:p-20 pb-32 xl:pb-32 2xl:pb-36 overflow-y-auto overflow-x-hidden">
          
          <div className="flex flex-col xl:flex-row w-full gap-8 xl:gap-12 mb-auto">
            {/* Bloco Central - Título + Grid */}
            <div className="flex flex-col flex-1 max-w-[900px]">
              
              {/* Hero Section */}
              <div className="mb-10 xl:mb-14">
                <h1 className="text-[36px] xl:text-[46px] font-bold text-white leading-[1.1] mb-4">
                  Seu Aprendizado,<br />
                  sua conquista!
                </h1>
                <p className="text-[#e6f6ec] text-[16px] xl:text-[18px] leading-relaxed max-w-lg">
                  Acompanhe suas notas, atividades e evolução em um só lugar.
                </p>
              </div>

              {/* Grid de 6 cards */}
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-6 w-full">
                {/* Disciplinas */}
                <div className="bg-white rounded-[14px] p-4 xl:p-5 shadow-xl flex flex-col hover:scale-105 transition-transform origin-left">
                  <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-[11px] bg-purple-100 flex items-center justify-center mb-3 xl:mb-4">
                    <Book className="w-5 h-5 xl:w-6 xl:h-6 text-[#7c3aed]" />
                  </div>
                  <h3 className="font-bold text-[15px] xl:text-[16px] text-slate-900 mb-1">Disciplinas</h3>
                  <p className="text-[12px] xl:text-[12.5px] text-slate-500 leading-snug">Acesse suas disciplinas e conteúdos.</p>
                </div>
                
                {/* Notas */}
                <div className="bg-white rounded-[14px] p-4 xl:p-5 shadow-xl flex flex-col hover:scale-105 transition-transform origin-center">
                  <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-[11px] bg-sky-100 flex items-center justify-center mb-3 xl:mb-4">
                    <ClipboardList className="w-5 h-5 xl:w-6 xl:h-6 text-[#0ea5e9]" />
                  </div>
                  <h3 className="font-bold text-[15px] xl:text-[16px] text-slate-900 mb-1">Notas</h3>
                  <p className="text-[12px] xl:text-[12.5px] text-slate-500 leading-snug">Acompanhe suas notas e desempenho.</p>
                </div>
                
                {/* Atividades */}
                <div className="bg-white rounded-[14px] p-4 xl:p-5 shadow-xl flex flex-col hover:scale-105 transition-transform origin-right">
                  <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-[11px] bg-amber-100 flex items-center justify-center mb-3 xl:mb-4">
                    <CheckSquare className="w-5 h-5 xl:w-6 xl:h-6 text-[#f59e0b]" />
                  </div>
                  <h3 className="font-bold text-[15px] xl:text-[16px] text-slate-900 mb-1">Atividades</h3>
                  <p className="text-[12px] xl:text-[12.5px] text-slate-500 leading-snug">Visualize tarefas e entregas pendentes.</p>
                </div>
                
                {/* Calendário */}
                <div className="bg-white rounded-[14px] p-4 xl:p-5 shadow-xl flex flex-col hover:scale-105 transition-transform origin-left">
                  <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-[11px] bg-rose-100 flex items-center justify-center mb-3 xl:mb-4">
                    <Calendar className="w-5 h-5 xl:w-6 xl:h-6 text-[#e11d48]" />
                  </div>
                  <h3 className="font-bold text-[15px] xl:text-[16px] text-slate-900 mb-1">Calendário</h3>
                  <p className="text-[12px] xl:text-[12.5px] text-slate-500 leading-snug">Fique por dentro das datas importantes.</p>
                </div>
                
                {/* Desempenho */}
                <div className="bg-white rounded-[14px] p-4 xl:p-5 shadow-xl flex flex-col hover:scale-105 transition-transform origin-center">
                  <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-[11px] bg-blue-100 flex items-center justify-center mb-3 xl:mb-4">
                    <BarChart2 className="w-5 h-5 xl:w-6 xl:h-6 text-[#2563eb]" />
                  </div>
                  <h3 className="font-bold text-[15px] xl:text-[16px] text-slate-900 mb-1">Desempenho</h3>
                  <p className="text-[12px] xl:text-[12.5px] text-slate-500 leading-snug">Veja sua evolução e progresso.</p>
                </div>
                
                {/* Comunicados */}
                <div className="bg-white rounded-[14px] p-4 xl:p-5 shadow-xl flex flex-col hover:scale-105 transition-transform origin-right">
                  <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-[11px] bg-pink-100 flex items-center justify-center mb-3 xl:mb-4">
                    <MessageCircle className="w-5 h-5 xl:w-6 xl:h-6 text-[#db2777]" />
                  </div>
                  <h3 className="font-bold text-[15px] xl:text-[16px] text-slate-900 mb-1">Comunicados</h3>
                  <p className="text-[12px] xl:text-[12.5px] text-slate-500 leading-snug">Leia avisos da escola e professores.</p>
                </div>
              </div>
            </div>

            {/* Cards Flutuantes (Direita) - Exibidos apenas em telas muito grandes */}
            <div className="hidden 2xl:flex flex-col gap-5 w-[300px] shrink-0 pt-20">
              {/* Card Média Geral */}
              <div className="bg-white rounded-[14px] p-5 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#22a05f]"></div>
                <h3 className="text-[14px] font-bold text-slate-800 mb-4">Média Geral</h3>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90 transition-transform group-hover:scale-110 duration-500">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#22a05f" strokeWidth="6" strokeDasharray="175.9" strokeDashoffset="17.5" strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                    </svg>
                    <span className="absolute font-bold text-[14px] text-slate-800">9,6</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-end gap-1 mb-2 h-8">
                      <div className="w-2 bg-[#22a05f]/20 rounded-t h-[30%]"></div>
                      <div className="w-2 bg-[#22a05f]/40 rounded-t h-[50%]"></div>
                      <div className="w-2 bg-[#22a05f]/60 rounded-t h-[70%]"></div>
                      <div className="w-2 bg-[#22a05f]/80 rounded-t h-[90%]"></div>
                      <div className="w-2 bg-[#22a05f] rounded-t h-[100%] animate-pulse"></div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">Sua média está acima da média da turma</p>
                  </div>
                </div>
              </div>

              {/* Card Frequência */}
              <div className="bg-white rounded-[14px] p-5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#22a05f]"></div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-[14px] font-bold text-slate-800">Frequência</h3>
                  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Presente</span>
                </div>
                <div className="flex items-end gap-4 mt-2">
                  <span className="text-[36px] font-bold text-[#22a05f] leading-none tracking-tight">98%</span>
                  <div className="flex-1 h-10 flex items-end opacity-80">
                    <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                      <path d="M0,25 C20,25 30,10 50,15 C70,20 80,5 100,10 L100,30 L0,30 Z" fill="#22a05f" fillOpacity="0.1" />
                      <path d="M0,25 C20,25 30,10 50,15 C70,20 80,5 100,10" fill="none" stroke="#22a05f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="100" cy="10" r="3" fill="#22a05f" className="animate-ping origin-center" />
                      <circle cx="100" cy="10" r="3" fill="#22a05f" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Faixa de benefícios na base */}
          <div className="absolute bottom-4 xl:bottom-6 2xl:bottom-6 left-8 right-8 xl:left-14 xl:right-14 2xl:left-20 2xl:right-20 bg-[#0c4628]/55 backdrop-blur-md rounded-[12px] flex flex-wrap xl:flex-nowrap items-center py-4 px-2 xl:px-4 gap-y-4 xl:divide-x divide-white/10 z-30 shadow-2xl shrink-0">
            <div className="w-1/2 xl:flex-1 px-4 flex gap-3 items-center">
              <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Cloud className="w-4 h-4 xl:w-5 xl:h-5 text-white" />
              </div>
              <div>
                <h4 className="text-white font-bold text-[12px] xl:text-[12.5px]">Acesso Online</h4>
                <p className="text-[#d9f0e2] text-[10px] xl:text-[11px] leading-tight mt-0.5">De qualquer lugar e dispositivo.</p>
              </div>
            </div>
            
            <div className="w-1/2 xl:flex-1 px-4 flex gap-3 items-center">
              <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <RefreshCcw className="w-4 h-4 xl:w-5 xl:h-5 text-white" />
              </div>
              <div>
                <h4 className="text-white font-bold text-[12px] xl:text-[12.5px]">Sinc. Automática</h4>
                <p className="text-[#d9f0e2] text-[10px] xl:text-[11px] leading-tight mt-0.5">Dados salvos automaticamente.</p>
              </div>
            </div>

            <div className="w-1/2 xl:flex-1 px-4 flex gap-3 items-center">
              <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 xl:w-5 xl:h-5 text-white" />
              </div>
              <div>
                <h4 className="text-white font-bold text-[12px] xl:text-[12.5px]">Segurança</h4>
                <p className="text-[#d9f0e2] text-[10px] xl:text-[11px] leading-tight mt-0.5">Ambiente seguro e protegido.</p>
              </div>
            </div>

            <div className="w-1/2 xl:flex-1 px-4 flex gap-3 items-center">
              <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Smile className="w-4 h-4 xl:w-5 xl:h-5 text-white" />
              </div>
              <div>
                <h4 className="text-white font-bold text-[12px] xl:text-[12.5px]">Intuitiva</h4>
                <p className="text-[#d9f0e2] text-[10px] xl:text-[11px] leading-tight mt-0.5">Design moderno e fácil de usar.</p>
              </div>
            </div>

            <div className="w-full xl:flex-1 px-4 flex gap-3 items-center pt-2 xl:pt-0 mt-2 xl:mt-0 border-t border-white/10 xl:border-t-0">
              <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Rocket className="w-4 h-4 xl:w-5 xl:h-5 text-white" />
              </div>
              <div>
                <h4 className="text-white font-bold text-[12px] xl:text-[12.5px]">Foco no Aprendizado</h4>
                <p className="text-[#d9f0e2] text-[10px] xl:text-[11px] leading-tight mt-0.5">Ferramentas para aprender melhor.</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
