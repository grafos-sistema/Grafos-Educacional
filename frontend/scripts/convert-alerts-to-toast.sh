#!/bin/bash

# Script para converter alert() para toast em todos os arquivos
echo "🔄 Convertendo alert() para toast()..."

count=0

# Encontrar todos os arquivos com alert(
find src -name "*.tsx" -o -name "*.ts" | while read -r file; do
  if grep -q "alert(" "$file"; then
    echo "📝 Processando: $file"

    # Adicionar import do toast se não existir
    if ! grep -q "react-hot-toast" "$file"; then
      # Encontrar a última linha de import e adicionar depois
      awk '/^import/ { last = NR } { print } END { if (last > 0) print "import { toast } from '\''react-hot-toast'\'';" }' "$file" > "$file.tmp"

      # Se não funcionou, adicionar no início
      if [ -f "$file.tmp" ]; then
        mv "$file.tmp" "$file"
      else
        sed -i.bak "1i\\
import { toast } from 'react-hot-toast';\\
" "$file"
        rm -f "$file.bak"
      fi
    fi

    # Substituir alert por toast (sucesso)
    sed -i.bak -e "s/alert('\([^']*\)sucesso\([^']*\)')/toast.success('\1sucesso\2')/gI" "$file"
    sed -i.bak -e 's/alert("\([^"]*\)sucesso\([^"]*\)")/toast.success("\1sucesso\2")/gI' "$file"

    # Substituir alert por toast (criado, atualizado, deletado - são sucessos)
    sed -i.bak -e "s/alert('\([^']*\)criado\([^']*\)')/toast.success('\1criado\2')/gI" "$file"
    sed -i.bak -e "s/alert('\([^']*\)atualizado\([^']*\)')/toast.success('\1atualizado\2')/gI" "$file"
    sed -i.bak -e "s/alert('\([^']*\)deletado\([^']*\)')/toast.success('\1deletado\2')/gI" "$file"

    # Substituir alert por toast (erro)
    sed -i.bak -e "s/alert('\([^']*\)[Ee]rro\([^']*\)')/toast.error('\1Erro\2')/g" "$file"
    sed -i.bak -e 's/alert("\([^"]*\)[Ee]rro\([^"]*\)")/toast.error("\1Erro\2")/g' "$file"

    # Limpar arquivos de backup
    rm -f "$file.bak"

    count=$((count + 1))
  fi
done

echo "✅ Conversão concluída! $count arquivos processados."
