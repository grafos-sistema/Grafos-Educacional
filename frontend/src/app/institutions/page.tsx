'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import {
  AcademicCapIcon,
  MagnifyingGlassIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';

interface Institution {
  id: string;
  name: string;
  slug: string;
  city?: string;
  state?: string;
  logo?: string;
  description?: string;
}

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select('id, name, slug, city, state, logo, description')
        .eq('isActive', true)
        .order('name', { ascending: true })
        .range(0, 99);

      if (error) {
        throw error;
      }

      setInstitutions((data ?? []) as Institution[]);
    } catch (error) {
      console.error('Erro ao buscar instituições:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInstitutions = institutions.filter((inst) =>
    inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image
                src="/logo-grafos.png"
                alt="Grafos - Plataforma Educacional"
                width={50}
                height={50}
                className="transition-transform duration-300"
                priority
              />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-grafos-green to-grafos-teal bg-clip-text text-transparent">
                  Grafos
                </h1>
                <p className="text-xs text-gray-600">
                  Sistema de Gestão Escolar
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <BuildingLibraryIcon className="h-16 w-16 text-grafos-green mx-auto mb-4" />
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Selecione sua Instituição
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Escolha a escola ou instituição de ensino para acessar o portal
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, cidade ou estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-300 focus:border-grafos-green focus:ring-2 focus:ring-grafos-green/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-grafos-green"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredInstitutions.length === 0 && (
          <div className="text-center py-12">
            <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Nenhuma instituição encontrada' : 'Nenhuma instituição cadastrada'}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'Tente buscar por outro termo' : 'Entre em contato com o suporte'}
            </p>
          </div>
        )}

        {/* Institutions Grid */}
        {!loading && filteredInstitutions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInstitutions.map((institution) => (
              <Link
                key={institution.id}
                href={`/login/${institution.slug}`}
                className="group"
              >
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  {/* Institution Logo */}
                  {institution.logo ? (
                    <div className="flex justify-center mb-4">
                      <img
                        src={institution.logo}
                        alt={institution.name}
                        className="h-16 w-16 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center mb-4">
                      <div className="h-16 w-16 bg-gradient-to-br from-grafos-green to-grafos-teal rounded-xl flex items-center justify-center">
                        <AcademicCapIcon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Institution Name */}
                  <h3 className="text-lg font-bold text-gray-900 text-center mb-2 line-clamp-2">
                    {institution.name}
                  </h3>

                  {/* Location */}
                  {(institution.city || institution.state) && (
                    <p className="text-sm text-gray-600 text-center mb-3">
                      {institution.city}
                      {institution.city && institution.state && ' - '}
                      {institution.state}
                    </p>
                  )}

                  {/* Description */}
                  {institution.description && (
                    <p className="text-xs text-gray-500 text-center mb-4 line-clamp-2">
                      {institution.description}
                    </p>
                  )}

                  {/* Access Button */}
                  <div className="flex items-center justify-center text-sm font-semibold text-grafos-green group-hover:text-grafos-green-dark transition-colors">
                    Acessar Portal
                    <svg
                      className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Sistema de Gestão Escolar. Powered by{' '}
              <span className="text-grafos-green font-semibold">Grafos Educação</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
