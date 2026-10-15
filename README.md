# Biblioteca da Existência

Site editorial inteiramente estático, em português brasileiro, com cinco ensaios originais sobre filosofia, existência, psicologia e história. Funciona diretamente no GitHub Pages **sem build, Node.js, npm, banco de dados, autenticação ou backend**.

## Conteúdo e recursos

- Cinco obras com páginas HTML independentes e dez seções cada. Cada texto tem cerca de 2.000 a 2.250 palavras, oito perguntas profundas e síntese final em cinco ideias.
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
