# Checklist de validação — catálogo com oito obras

## Automatizado pelo repositório

- [ ] Verificar os oito cards, cada um com capa SVG local, URL própria, sinopse e progresso individual.
- [ ] Conferir que os oito slugs da index correspondem exatamente a oito páginas em `livros/`.
- [ ] Verificar ausência de referências às três obras excluídas na index, páginas e testes ativos.
- [ ] Conferir sumários lateral e móvel, IDs únicos, seções narráveis, referências e síntese de cada livro.
- [ ] Executar `python -m unittest discover -s scripts -p 'test_*.py' -v` com dependências de áudio instaladas.
- [ ] Verificar os módulos JS por `node --input-type=module --check` em CI.

## Inspeção manual antes e depois de publicar

- [ ] Testar as oito URLs diretamente e via index, inclusive sob subcaminho de publicação, sem erros 404.
- [ ] Verificar cards responsivos em larguras de 320 px, 375 px, 768 px e desktop; uma obra por linha.
- [ ] Alternar temas, fonte de 16 a 26 px e navegação por teclado.
- [ ] Avançar duas obras a posições diferentes, recarregar e confirmar retomada individual; reiniciar só um progresso.
- [ ] Confirmar que não aparece o campo “Minhas reflexões” e que perguntas editoriais continuam presentes.
- [ ] Verificar narração: seção atual, sequência, pausa, retomada, navegação, voz pt-BR, velocidade e volume.
- [ ] Validar fallback de síntese nativa nas cinco novas obras enquanto seus manifestos neurais ainda não existirem.
- [ ] Conferir geração e publicação dos novos MP3s, sem 404, quando o workflow terminar.
- [ ] Testar áudio de música em loop, mute e volume independente da narração, inclusive com autoplay bloqueado.
- [ ] Confirmar acessibilidade, foco visível e preferência de movimento reduzido.
- [ ] Verificar o ambiente público final depois do merge, especialmente o estado do deploy Cloudflare/Pages.

Observação: validação estática não substitui navegação real em dispositivos nem audição dos MP3s. Há registros históricos de testes de versões anteriores neste repositório; eles não validam automaticamente a nova composição do catálogo.
