# Checklist de Segurança para Nova Feature

Antes de aprovar qualquer nova feature, confirmar:

- [ ] Autenticação validada no back-end
- [ ] tenantId vem da sessão, não do client
- [ ] Role/permissão validada no back-end
- [ ] Inputs validados com schema
- [ ] Nenhuma query sensível busca apenas por ID sem tenantId
- [ ] Update/delete filtram por id + tenantId
- [ ] Viewer não altera dados
- [ ] Billing não confia em preço/status vindo do client
- [ ] Webhooks/endpoints internos validam assinatura/token antes de executar ação
- [ ] Logs não expõem PII, secrets ou payload completo
- [ ] Analytics/Clarity/Ads/GTM não rodam em área autenticada ou sensível
- [ ] Secrets não estão em NEXT_PUBLIC nem no código
- [ ] Inputs livres protegidos contra XSS
- [ ] Testes de regressão adicionados quando houver risco de IDOR, billing, permissão ou dados sensíveis

“Sem vulnerabilidades conhecidas após os testes executados.”
