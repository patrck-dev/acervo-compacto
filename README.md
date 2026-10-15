# Acervo Compacto

Site editorial estático, em português brasileiro, com **oito estudos autorais de livros** sobre cosmologia, existência, história, filosofia e espiritualidade. Não exige build, Node.js, npm, autenticação, banco de dados nem backend.

## Catálogo atual

- **Até o Fim do Tempo** — Brian Greene (2020)
- **The Big Picture** — Sean Carroll (2016)
- **Cosmos** — Carl Sagan (1980)
- **Pálido Ponto Azul** — Carl Sagan (1994)
- **Uma Breve História do Tempo** — Stephen Hawking (1988)
- **Sapiens** — Yuval Noah Harari (2011)
- **O Mito de Sísifo** — Albert Camus (1942)
- **Confissões** — Santo Agostinho (século IV)

As obras *Meditações*, *Sidarta* e *Em Busca de Sentido* foram retiradas do catálogo, juntamente com suas páginas, capas e faixas de áudio associadas.

## Recursos de leitura

- Oito páginas independentes em `livros/<slug>/index.html`, com sumário lateral ou recolhível, âncoras, navegação entre seções, questões para reflexão e sínteses finais.
- Cinco novos estudos sobre cosmologia, com **17 a 18 seções** cada, textos analíticos condensados, referências editoriais e ressalvas sobre teorias controversas ou conhecimentos atualizados após a publicação original; os três estudos anteriores foram preservados.
- Capas editoriais originais em SVG, servidas localmente, sem uso de capas comerciais de terceiros.
- Página inicial com **uma obra por linha**, sinopses expandidas, barra de progresso por livro e botão individual de retomada.
- Preferências de tema claro/escuro/automático e tamanho de leitura entre 16 e 26 px, com fontes sem serifa.
- Progresso e preferências armazenados no navegador via `localStorage`. Não são sincronizados entre aparelhos e podem desaparecer se os dados locais forem limpos.
- Narração com síntese nativa do dispositivo como fallback; quando manifestos e faixas neurais estão publicados em `assets/audio/<slug>/`, o player pode utilizá-los.
- Música ambiente em `assets/music-background.mp3`, com controle de volume independente da narração. Navegadores podem bloquear reprodução automática com som antes da primeira interação.
- Sem campo de edição “Minhas reflexões”; perguntas editoriais permanecem nos estudos.

## Estrutura

```text
index.html
assets/
  css/styles.css
  js/ (main, reader, storage, audio, speech, navegação e música)
  images/ (oito capas SVG e favicon)
  music-background.mp3
  audio/ (faixas neurais disponíveis e manifests por obra)
livros/
  ate-o-fim-do-tempo/index.html
  the-big-picture/index.html
  cosmos/index.html
  palido-ponto-azul/index.html
  uma-breve-historia-do-tempo/index.html
  sapiens/index.html
  o-mito-de-sisifo/index.html
  confissoes/index.html
scripts/
  generate_audio.py
  test_generate_audio.py
.github/workflows/
  generate-audio.yml
  verify-audio-ui.yml
```

## Publicação e testes

O site pode ser servido de uma pasta, inclusive em subrota no GitHub Pages ou Cloudflare. Os caminhos de CSS, JS, SVG e navegação são relativos. Para testar localmente com servidor HTTP, execute `python3 -m http.server 8000` na raiz e acesse `http://localhost:8000/`. Abrir pelo protocolo `file://` pode bloquear módulos ES.

Testes de estrutura e conteúdo narrável: `python -m unittest discover -s scripts -p 'test_*.py' -v` (instale `scripts/requirements-audio.txt` para obter as dependências usadas pelos testes de geração). A rotina `.github/workflows/verify-audio-ui.yml` valida integridade básica do catálogo, tipografia, caminhos, scripts e controles. Checklist manual: [TESTES.md](TESTES.md).

A geração neural roda em GitHub Actions quando HTMLs mudam. O sistema precisa ser configurado com permissão de escrita e o ambiente de Pages adequado para publicar MP3s. Confira [docs/NARRACAO_NEURAL.md](docs/NARRACAO_NEURAL.md).

## Critério editorial

Cada estudo é uma **síntese analítica original**, não tradução, texto completo ou reprodução extensiva das obras. Os resumos são organizados por capítulos ou temas, com atenção a argumentos, conceitos, objeções e implicações. Para conferir nuances, consulte edições legítimas dos livros e fontes científicas atualizadas. O conteúdo tem caráter educativo e não substitui consulta à literatura técnica especializada.
