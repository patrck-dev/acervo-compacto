# Acervo Compacto

Site editorial inteiramente estático, em português brasileiro, com seis ensaios originais sobre filosofia, existência, psicologia e história. Funciona diretamente no GitHub Pages **sem build, Node.js, npm, banco de dados, autenticação ou backend**.

## Conteúdo e recursos

- Seis obras em HTML independente. As cinco primeiras obras agora apresentam entre 24 e 31 seções e cerca de 5.500 a 5.700 palavras cada, com percursos aprofundados por capítulos, partes, argumentos, contexto e contrapontos; Confissões, de Santo Agostinho, apresenta os treze livros da obra e análises complementares em 21 seções, com mais de 6.000 palavras. Cada leitura inclui oito perguntas profundas e síntese final em cinco ideias.
- Capas editoriais originais em SVG, locais; nenhuma imagem precisa de CDN.
- Tema claro, escuro ou automático; controle de fonte entre 16 e 26 px.
- Progresso calculado pela posição efetiva na página, persistido individualmente, retomada automática e atalho na biblioteca para a última leitura.
- Notas privadas por obra com salvamento automático e função de apagar.
- Narração por Web Speech API: preferência para vozes brasileiras, seleção de voz, velocidade de 0,8 a 1,5×, reprodução da seção atual ou das seções em sequência, pausa, retomada, parada, navegação e destaque do parágrafo.
- Sumário lateral em desktop, sumário recolhível em telas menores, navegação por teclado e interface responsiva.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie os **arquivos deste diretório para a raiz da branch `main`**, mantendo `index.html`, `.nojekyll`, `assets/` e `livros/` em suas posições.
3. Abra **Settings > Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione a branch **`main`** e a pasta **`/ (root)`**; clique em **Save**.
6. Acesse a URL publicada pelo Pages: `https://usuario.github.io/nome-do-repositorio/` ou `https://usuario.github.io/`, dependendo do repositório.
7. Teste a navegação, preferências, anotações, retomada e voz no navegador final.

Todos os links para CSS, JavaScript, imagens e páginas são relativos, permitindo publicação em subdiretórios. Os textos já estão embutidos nos cinco HTMLs.

## Estrutura

```text
index.html
.nojekyll
README.md
TESTES.md
assets/
  css/styles.css
  js/main.js
  js/reader.js
  js/speech.js
  js/storage.js
  js/navigation.js
  images/ (5 capas SVG e favicon SVG)
livros/
  em-busca-de-sentido/index.html
  sapiens/index.html
  meditacoes/index.html
  sidarta/index.html
  o-mito-de-sisifo/index.html
  confissoes/index.html
```

## Teste local (opcional)

Módulos ES podem ser bloqueados ao abrir HTML diretamente pelo protocolo `file://`. Para testar em HTTP, use um servidor de arquivos estáticos da sua preferência; se já houver Python na máquina, por exemplo:

```sh
python3 -m http.server 8000
```

Abra `http://localhost:8000/`. Isso serve apenas para teste local: **não é um backend da aplicação nem requisito de implantação**.

## Limitações reais da voz e do armazenamento

A narração utiliza as vozes disponíveis **no navegador/sistema operacional**, sem API paga. O site prioriza `pt-BR` e informa quando essa voz não existir. Em alguns aparelhos, a lista de vozes surge depois do carregamento. Pausar/retomar, executar com outro aplicativo aberto ou continuar com a tela bloqueada dependem do navegador e **não são garantidos**. A fala começa somente após ação explícita. Os textos são divididos em segmentos curtos; não há MP3, duração fictícia ou barra temporal especulativa.

Preferências, progresso e notas são armazenados apenas no `localStorage` **da origem atual e do perfil do navegador**. Eles não sincronizam entre dispositivos. Limpar os dados do site pode apagá-los. Se o armazenamento local estiver bloqueado, o site permite leitura e avisa que os dados não persistirão.

## Autoria dos materiais

Os ensaios são análises editoriais originais; não reproduzem os livros nem traduções extensas. As cinco capas são representações tipográficas vetoriais originais. Os textos incluem contrapontos e distinguem interpretações próprias de teses dos autores. Para estudo acadêmico aprofundado, devem ser confrontados com as obras e pesquisas especializadas.

## Narração neural automática (em desenvolvimento)

A branch `feat/narracao-neural` inclui um gerador de MP3s com Kokoro pt-BR em GitHub Actions e um novo player que usa os áudios quando presentes. **A `main` não foi alterada.** Consulte [docs/NARRACAO_NEURAL.md](docs/NARRACAO_NEURAL.md) antes de habilitar a publicação: no modo `Deploy from a branch`, commits feitos com `GITHUB_TOKEN` não iniciam sozinhos um build do GitHub Pages. A narração por Web Speech API permanece disponível enquanto o áudio neural não existir.

## Nova obra: Confissões (Santo Agostinho)

Na branch de desenvolvimento `feat/narracao-neural`, a biblioteca inclui `livros/confissoes/index.html`, com estudo original dos treze livros, leituras críticas e ferramentas de reflexão. A narração é gerada automaticamente pelo workflow ao detectar mudanças nesse HTML. Cada seção é um MP3; enquanto a geração não termina, o player utiliza a voz nativa do navegador. A voz neural e os manifestos são publicados na mesma branch, e o Cloudflare Workers mantém uma URL de preview independente da produção.

## Identidade editorial e endereços

A marca do site é **Acervo Compacto**, com identificador desejado `acervo-compacto`. A alteração de nome no conteúdo não renomeia automaticamente o repositório GitHub nem o Worker conectado ao Cloudflare; essas operações devem ser coordenadas separadamente para preservar as implantações e os links existentes.

O prefixo original de `localStorage` (`biblioteca.existencia.v1.`) foi preservado intencionalmente para manter anotações, preferências e progresso já registrados nos navegadores dos leitores.

## Resumos aprofundados e narração

Os cinco estudos ampliados estão em `livros/em-busca-de-sentido`, `livros/sapiens`, `livros/meditacoes`, `livros/sidarta` e `livros/o-mito-de-sisifo`. Cada página mantém o resumo interpretativo original e acrescenta um roteiro detalhado que percorre estrutura e argumentos da obra, além de fontes complementares. `livros/confissoes/` permanece inalterado.

O workflow neural compara hashes de cada seção e gera novos arquivos para passagens alteradas ou acrescentadas. Durante a geração, o player pode utilizar a síntese nativa do navegador como alternativa. Como cada uma das cinco páginas cresceu, a atualização de suas faixas requer uma execução de síntese substancial.

## Música ambiente e amplificação de voz

O arquivo `assets/music-background.mp3` é reproduzido em loop por um miniplayer presente no cabeçalho (flutuante no celular), com mute e volume separados da narração. O volume e o mute são salvos nas preferências locais; a posição da música é retomada ao navegar na mesma aba, quando permitido.

Navegadores podem impedir a reprodução automática com som antes de uma interação. A música tenta começar automaticamente e, caso seja bloqueada, inicia após um clique, toque ou comando de teclado no site. Como as páginas são HTMLs independentes, a troca de livro pode causar breve interrupção na música; a posição é preservada na mesma aba.

Nos livros com MP3 neural, o controle **Volume da voz** vai de 0% a 200%, usando Web Audio API (ganho mais compressor limitador). Valores acima de 100% podem distorcer conforme o volume do arquivo, o dispositivo e o navegador. No fallback Web Speech, o controle vai até 100%, pois o navegador não expõe o fluxo de áudio para amplificação.
