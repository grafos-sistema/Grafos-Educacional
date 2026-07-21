function gerarCodigoHex(comprimento: number = 6): string {
  const caracteres = 'abcdefghijklmnopqrstuvwxyz';
  let resultado = '';

  for (let i = 0; i < comprimento; i++) {
    const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
    resultado += caracteres[indiceAleatorio];
  }

  return resultado;
}
export { gerarCodigoHex };
