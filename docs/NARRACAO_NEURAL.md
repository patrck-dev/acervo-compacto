# Narração neural automática (protótipo na branch de desenvolvimento)

A página de cada obra continua sendo um HTML estático e independente. Ao publicar
novos livros em `livros/<slug>/index.html`, o workflow
`.github/workflows/generate-audio.yml` identifica as seções marcadas com
`class="reading-section" data-chapter` e os trechos `data-readable`,
sintetiza a voz brasileira e cria `assets/audio/<slug>/manifest.json` e
`<id-da-secao>.mp3`. Nenhum backend, chave de API paga ou geração manual.

## Como funciona

1. Adicione um HTML em `livros/<slug>/index.html` com IDs de seção únicos e
   texto marcado com `data-readable`.
2. Faça push para qualquer branch do próprio repositório. A execução usa runners hospedados pelo GitHub.
3. O workflow roda testes e só regrava arquivos cujo hash da seção (incluindo
   voz e versão do gerador) mudou. A versão da locução está no manifesto.
4. A execução registra os MP3s e manifestos na mesma branch; revise os áudios
   antes de fazer merge para `main`.
5. O site usa MP3 se o manifesto válido existir; caso contrário, mantém o
   sintetizador atual do navegador como fallback.

## Configuração e limitações

- Voz padrão `pf_dora` com Kokoro-82M v1.0, fonemização `pt-br` por eSpeak,
  `kokoro-onnx`, licença do modelo Apache-2.0 e biblioteca MIT.
- É necessário habilitar GitHub Actions e permitir escrita de `GITHUB_TOKEN`.
  Todos os processos são externos ao site: visitante só baixa HTML, JS, CSS e MP3.
- O runner público padrão pode levar tempo para gerar as seções novas. Primeiro
  download do modelo é grande; há cache entre execuções quando disponível.
- A qualidade em português, os nomes próprios, pausas e intensidade emocional
  precisam ser avaliados ouvindo os arquivos reais, antes do merge.
- Até os MP3s serem gerados e versionados, a branch ainda usa voz do dispositivo.
- Arquivos MP3 **não são gerados instantaneamente** ao salvar um HTML: surgem
  após o workflow concluir e registrar seu commit.
- Não guarde livros integrais sob direitos autorais sem autorização.

### Particularidade importante: GitHub Pages

No modo GitHub Pages **Deploy from a branch**, um commit criado pelo workflow
com `GITHUB_TOKEN` **não dispara sozinho uma nova publicação** do Pages.
O workflow **já inclui** um job de publicação que roda apenas em `main`,
 após terminar a geração. **Antes do merge**, configure uma única vez
`Settings > Pages > Source` para **GitHub Actions**. Na branch de desenvolvimento,
o workflow só gera os MP3s e registra os arquivos; não publica no site principal.
Isso não transforma o site em SPA nem exige build do frontend.
Se o modo `Deploy from a branch` for mantido, o job de publicação falhará
e commits automáticos não dispararão a publicação do áudio.

## Teste sem baixar o modelo

No ambiente com Python e dependência `beautifulsoup4`:

```sh
python -m unittest discover -s scripts -p 'test_*.py' -v
python scripts/generate_audio.py --dry-run
```

Para gerar localmente, apenas como alternativa para diagnóstico, instale
`scripts/requirements-audio.txt`, eSpeak NG e ffmpeg e execute:

```sh
python scripts/generate_audio.py --book cosmos
```

O áudio de cada seção fica em `assets/audio/<slug>/<id>.mp3` e o player
usa caminhos relativos válidos também em projetos `/nome-do-repositorio/`.
