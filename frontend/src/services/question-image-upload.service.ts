import api from '@/lib/api';

export const questionImageUploadService = {
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    try {
      // O interceptor do axios já retorna response.data, então recebemos diretamente o objeto
      const data = await api.post<{ imageUrl: string }>(
        '/questions/upload-image',
        formData,
        {
          // Let the browser/Axios generate the multipart boundary. A manually
          // forced Content-Type can make Railway reject the request before
          // Multer receives the file.
          timeout: 120000,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      ) as any;

      if (!data?.imageUrl) {
        throw new Error('Upload falhou: URL da imagem não retornada');
      }

      return data.imageUrl;
    } catch (error: any) {
      console.error('Erro no upload:', error);
      throw new Error(
        error?.message ||
        'Erro ao fazer upload da imagem'
      );
    }
  },
};
