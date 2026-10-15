# Checklist de testes

## Publicação e URLs

- [ ] Abrir o índice via HTTP e acessar diretamente as seis páginas por suas URLs.
- [ ] Recarregar cada URL de livro sem precisar navegar primeiro pela biblioteca.
- [ ] Publicar numa subrota como `/nome-do-repositorio/` e testar todos os links.
- [ ] Confirmar ausência de erros 404 para HTML, CSS, JS e SVG.
- [ ] Confirmar que `.nojekyll` está presente e não há etapa de compilação nem backend.

## Leitura e persistência

- [ ] Testar temas claro, escuro e automático em todas as páginas, antes e após reload.
- [ ] Diminuir/aumentar fonte entre 16 e 26 px, conferindo alteração efetiva na coluna de texto.
- [ ] Rolar duas obras a posições diferentes, reabrir e confirmar progresso independente.
- [ ] Reabrir a página sem âncora e confirmar retomada no último bloco salvo.
- [ ] Abrir página com `#conceitos` e confirmar precedência da âncora explícita.
- [ ] Voltar ao índice e usar “Continuar leitura”.
- [ ] Reiniciar o progresso sem apagar as anotações.
- [ ] Salvar, editar e apagar anotações; verificar independência por obra e persistência após reload.
- [ ] Usar sumário lateral em desktop e recolhível em dispositivo móvel.

## Narração e acessibilidade

- [ ] Verificar voz `pt-BR` preferida quando disponível, ou aviso caso não haja.
- [ ] Iniciar por clique, ouvir seção, ouvir em sequência, pausar, continuar, parar, avançar e retroceder.
- [ ] Testar seleção de voz, velocidades, destaque do trecho e interrupção ao mudar de página.
- [ ] Testar em 360 px, tablet e desktop, sem rolagem horizontal involuntária.
- [ ] Verificar foco visível, navegação por teclado, nomes acessíveis e respeito a `prefers-reduced-motion`.
- [ ] Testar comportamento do áudio em segundo plano/tela bloqueada no **dispositivo alvo**: não há garantia de continuidade.

Observação: validações estáticas e via HTTP não substituem testes manuais do sintetizador de voz no navegador e sistema operacional de destino.

## Verificações já executadas nesta entrega — 13/10/2026

- [x] Os seis HTMLs foram solicitados por HTTP e responderam com sucesso; as 45 referências internas de CSS, JavaScript, SVG e navegação foram verificadas também sob `/nome-do-repositorio/`, sem 404.
- [x] As cinco primeiras obras têm agora 24 a 31 seções e cerca de 5.500 a 5.700 palavras; Confissões conserva 21 seções e sua cobertura dos treze livros. Todos os textos mantêm perguntas, síntese, IDs e dados narráveis.
- [x] Os cinco módulos JavaScript passaram pela verificação sintática do Node usado **apenas no ambiente de teste** (não é dependência do produto).
- [x] Foram renderizados os HTMLs com estilos e scripts em Chromium no ambiente de teste, inclusive layouts móveis e desktop. Não houve rolagem horizontal não intencional nos tamanhos de 320 a 1440 px inspecionados.
- [x] Foram exercitados em Chromium: temas, controles reais de fonte, notas, progresso, 100% ao fim, retomada após recarregamento simulado, atalho da última leitura e reinicialização sem apagar notas.
- [x] Foram exercitados com **simulação da Web Speech API**: voz `pt-BR` preferida, reprodução, pausa, retomada, avançar, parar, velocidade alterada e destaque do trecho, sem erros JavaScript observados.
- [ ] **Pendente de teste manual:** saída acústica real, vozes efetivamente instaladas e particularidades de pausa/retomada no Chrome, Safari e Firefox, especialmente em dispositivos móveis.

O Chromium disponível neste ambiente impede a navegação HTTP por uma política administrativa. Assim, o carregamento dos recursos por HTTP e o funcionamento do DOM/JavaScript foram validados separadamente; não se afirma ter executado uma sessão integrada de navegação HTTP em navegador real. A etapa pendente deve ser conferida após publicar no GitHub Pages.

## Ampliação do acervo e novo livro

- [ ] Abrir `livros/confissoes/index.html` diretamente no preview, verificar as 21 seções e seus 13 livros.
- [ ] Confirmar a capa e o card de Confissões na biblioteca; contador com seis obras.
- [ ] Conferir que o GitHub Actions gerou `assets/audio/confissoes/manifest.json` com 21 faixas e seus MP3s.
- [ ] Testar narração neural de Confissões, pausa, avanço de seções, retomada e ausência de 404 de MP3.
- [ ] Confirmar que os demais cinco livros não tiveram áudios regenerados se seus textos não mudaram.

## Expansão de cinco livros (sem alterar Confissões)

- [ ] Conferir sumários desktop/mobile, âncoras e navegação entre seções em todos os cinco livros ampliados.
- [ ] Confirmar contagem de palavras e tempo de leitura atualizados nas páginas e no catálogo.
- [ ] Verificar 24 faixas de Em Busca de Sentido; 31 de Sapiens; 25 de Meditações; 24 de Sidarta; 28 de O Mito de Sísifo.
- [ ] Conferir áudio neural e fallback temporário de cada obra depois da geração; Confissões continua com 21 faixas inalteradas.
- [ ] Validar a nova publicação no Cloudflare após o merge.
