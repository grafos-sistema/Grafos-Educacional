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
          headers: {
            'Content-Type': 'multipart/form-data',
          },
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
