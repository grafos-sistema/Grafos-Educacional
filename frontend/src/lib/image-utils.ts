/**
 * Utilitários para trabalhar com imagens do backend
 */

import { getApiBaseUrl } from './api-url';

/**
 * Converte um caminho de imagem relativo em URL completa
 * Se já for uma URL completa (http/https), retorna sem modificar
 *
 * @param imagePath - Caminho da imagem (ex: "/public/question-images/file.jpg")
 * @returns URL completa da imagem
 *
 * @example
 * getImageUrl('/public/question-images/file.jpg')
 * // => 'http://localhost:3333/public/question-images/file.jpg'
 *
 * getImageUrl('https://example.com/image.jpg')
 * // => 'https://example.com/image.jpg'
 */
export function getImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) {
    return '';
  }

  // Se já é uma URL completa, retorna sem modificar
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Se é um caminho relativo, adiciona o base URL da API
  const apiBaseUrl = getApiBaseUrl();
  return apiBaseUrl ? `${apiBaseUrl}${imagePath}` : imagePath;
}

/**
 * Converte um array de caminhos de imagem em URLs completas
 *
 * @param imagePaths - Array de caminhos de imagens
 * @returns Array de URLs completas
 */
export function getImageUrls(imagePaths: (string | null | undefined)[]): string[] {
  return imagePaths
    .filter((path): path is string => Boolean(path))
    .map(getImageUrl);
}
