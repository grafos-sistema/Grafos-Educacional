# Logos de Municípios

Esta pasta contém os logos personalizados para cada município.

## Como Adicionar um Logo

1. Obtenha o logo oficial do município
2. Formato recomendado: PNG com fundo transparente ou SVG
3. Tamanho recomendado: 200x200px ou maior
4. Nomeie o arquivo de forma descritiva: `nome-municipio.png`
5. Coloque o arquivo nesta pasta
6. Configure a variável de ambiente:
   ```env
   NEXT_PUBLIC_MUNICIPALITY_LOGO=/logos/nome-municipio.png
   ```

## Exemplo de Estrutura

```
logos/
├── santa-cruz.png
├── brasao-santa-cruz.png
├── nova-friburgo.png
├── petropolis.png
└── README.md
```

## Otimização

Para melhor performance, otimize os logos antes de adicionar:

- **PNG:** Use TinyPNG ou ImageOptim
- **SVG:** Use SVGO ou SVGOMG
- **Tamanho máximo recomendado:** 200KB

## Formatos Suportados

- ✅ PNG (recomendado)
- ✅ SVG (melhor qualidade)
- ✅ JPG (não recomendado - sem transparência)
- ✅ WEBP (boa performance)

## Next.js Image Optimization

O Next.js automaticamente otimiza as imagens nesta pasta quando usa o componente `<Image />`.
