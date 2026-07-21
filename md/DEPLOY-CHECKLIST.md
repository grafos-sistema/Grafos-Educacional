# ✅ Checklist de Deploy - Sistema de Gestão Escolar

## 📋 Pré-Deploy

- [ ] Servidor provisionado (mínimo: 2GB RAM, 2 CPUs, 20GB disco)
- [ ] Docker instalado (versão 20.10+)
- [ ] Docker Compose instalado (versão 2.0+)
- [ ] Acesso SSH ao servidor configurado
- [ ] Firewall configurado (UFW ou iptables)
- [ ] Domínio apontando para o servidor (opcional)

## 🔧 Configuração

- [ ] Repositório clonado no servidor
- [ ] Arquivo `.env.prod` copiado para `.env`
- [ ] **SENHA DO POSTGRES alterada** (POSTGRES_PASSWORD)
- [ ] **SENHA DO REDIS alterada** (REDIS_PASSWORD)
- [ ] **JWT_SECRET alterado** (use string longa e aleatória)
- [ ] **JWT_REFRESH_SECRET alterado** (diferente do JWT_SECRET)
- [ ] CORS_ORIGINS configurado com domínio correto
- [ ] NEXT_PUBLIC_API_URL configurado com URL correta
- [ ] Portas verificadas (3333, 3001, 5432, 6379)

## 🚀 Deploy

- [ ] Script de deploy executado: `./deploy.sh`
- [ ] Todos os serviços iniciaram com sucesso
- [ ] Migrations executadas sem erros
- [ ] Seed executado (se RUN_SEED=true)
- [ ] Health checks passando (postgres, redis, api, frontend)

## ✅ Verificação Pós-Deploy

### Serviços
- [ ] PostgreSQL respondendo: `docker-compose -f docker-compose.prod.yml exec postgres pg_isready`
- [ ] Redis respondendo: `docker-compose -f docker-compose.prod.yml exec redis redis-cli ping`
- [ ] API respondendo: `curl http://localhost:3333/api`
- [ ] Frontend respondendo: `curl http://localhost:3001`

### Funcionalidades
- [ ] Login funcionando
- [ ] Cadastro de usuário funcionando
- [ ] Upload de arquivos funcionando
- [ ] Dashboard carregando dados

### Dados
- [ ] Banco de dados criado corretamente
- [ ] Tabelas criadas (verificar com Prisma Studio ou psql)
- [ ] Dados seed carregados (se aplicável)
- [ ] Usuário admin criado

## 🔒 Segurança

- [ ] Senhas padrão alteradas
- [ ] Firewall configurado
- [ ] Apenas portas necessárias expostas
- [ ] SSH configurado com chave pública
- [ ] Senha de root desabilitada no SSH
- [ ] Fail2ban instalado (opcional mas recomendado)
- [ ] HTTPS configurado (se em produção pública)
- [ ] Certificado SSL válido (Let's Encrypt)

## 💾 Backup

- [ ] Script de backup testado: `./backup.sh`
- [ ] Backup criado com sucesso
- [ ] Diretório `backups/` criado
- [ ] Cron job de backup configurado (opcional)
- [ ] Script de restore testado: `./restore.sh`

## 📊 Monitoramento

- [ ] Logs acessíveis: `docker-compose -f docker-compose.prod.yml logs -f`
- [ ] Docker stats funcionando: `docker stats`
- [ ] Alertas configurados (opcional)
- [ ] Espaço em disco monitorado

## 🔄 Manutenção

- [ ] Processo de atualização documentado
- [ ] Equipe treinada nos comandos básicos
- [ ] Documentação de troubleshooting acessível
- [ ] Contatos de suporte definidos

## 📝 Documentação

- [ ] URLs de acesso documentadas
- [ ] Credenciais de admin salvas em local seguro
- [ ] Processo de backup documentado
- [ ] Processo de restore documentado
- [ ] Comandos úteis documentados

## 🎯 Performance

- [ ] Tempo de resposta da API aceitável (< 500ms)
- [ ] Frontend carregando rápido (< 2s)
- [ ] Consultas ao banco otimizadas
- [ ] Cache Redis funcionando

## 📱 Acesso

- [ ] Frontend acessível externamente
- [ ] API acessível pelo frontend
- [ ] CORS configurado corretamente
- [ ] SSL/TLS funcionando (se aplicável)

## 🐛 Troubleshooting Testado

- [ ] Restart de serviços funciona
- [ ] Logs são legíveis e úteis
- [ ] Backup e restore testados
- [ ] Rollback testado (se possível)

## ✨ Extras (Opcional)

- [ ] Domain name configurado
- [ ] SSL/TLS com Let's Encrypt
- [ ] CDN configurado (CloudFlare, etc)
- [ ] Email de notificações configurado
- [ ] Monitoramento avançado (Grafana)
- [ ] CI/CD configurado
- [ ] Testes automatizados rodando

---

## 📞 Contatos de Emergência

- **Admin Sistema**: _______________
- **DevOps**: _______________
- **Suporte**: _______________

## 📅 Informações do Deploy

- **Data do Deploy**: _______________
- **Versão**: _______________
- **Responsável**: _______________
- **Servidor**: _______________
- **IP**: _______________

---

**Status Final**: [ ] ✅ Deploy Aprovado | [ ] ⚠️ Com Pendências | [ ] ❌ Falhou
