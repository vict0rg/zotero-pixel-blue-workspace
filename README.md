# Zotero Pixel-Blue Workspace

Tema visual *não oficial* para Zotero 7–10 (Zotero 11 beta: uso experimental, ainda não homologado), inspirado na identidade **pixel-blue Workspace** para Obsidian. Comporta-se como um plugin (.xpi), sem editar o Zotero ou seu perfil manualmente.

> **Estado:** v0.1.2, pré-lançamento experimental e reversível. O pacote foi verificado estruturalmente e com testes de ciclo de vida simulados. Ainda precisa de teste visual/interativo dentro de uma instalação real do Zotero, preferencialmente com perfil de teste.

## Visual

- **Claro:** fundo papel `#fbfdff`, área de trabalho `#f3f8fe`, painéis `#e8f3fd`, destaque `#2f78ad`.
- **Escuro:** papel `#16283a`, painel `#1b3045`, destaque `#91d2ff`.
- Grade de papel azul suave (`20 × 20 px`) nas áreas de navegação; pode ser desligada.
- **Novo na 0.1.2:** grade na área central de itens, controlável separadamente; não interfere no conteúdo dos PDFs.
- **Novo na 0.1.2:** azul pastel `#D0E4FD` na seleção e marcador rosa `#E391BB`, extraídos da captura de tela do Obsidian fornecida pelo usuário. Fundo parecido quando há e quando não há foco, preservando as cores de cada campo.
- Recoloração de barras, abas, botões, divisórias e elementos do leitor; **o conteúdo original de PDFs/EPUBs não é recolorido por este plugin**.
- Respeita a distribuição de painéis e a densidade do Zotero, sem alterar tamanhos, margens ou a posição dos menus.

## Compatibilidade e mudança da v0.1.2

A versão v0.1.0 foi rejeitada pelo Zotero porque o manifesto omitia `applications.zotero.update_url`, exigido pelo carregador do Zotero. A v0.1.2 corrige o campo, define o limite oficial `10.0.*`, adapta as propriedades booleanas dos menus ao Zotero 11, valida o pacote antes de compilar e prepara atualizações futuras via GitHub Releases. Zotero 11 beta/dev ignora o limite máximo na instalação, mas o Zotero recomenda não declarar suporte oficial ao 11 antes de congelar suas APIs. Nenhuma versão 7–11 foi validada em execução real neste ambiente; a compatibilidade é um **alvo de projeto**, não uma certificação.

## Instalar

1. Recomenda-se criar um perfil de teste/backup do Zotero antes de experimentar temas.
2. **Desative outros plugins de tema**, especialmente Cupertino e Warm Theme, para evitar conflitos de CSS.
3. Baixe `zotero-pixel-blue-workspace-0.1.2.xpi`.
4. No Zotero, abra **Ferramentas → Plugins** (ou **Tools → Plugins**). Clique na engrenagem e escolha **Instalar plugin a partir de arquivo**. Selecione o `.xpi`.
5. Se necessário, reinicie o Zotero.
6. No menu **Ferramentas → Pixel-Blue Workspace**, use as opções **Ativar tema**, **Grade nos painéis**, **Grade na lista de arquivos** e **Seleção azul suave**.

### Como remover / restaurar o Zotero original

Desmarque **Grade na lista de arquivos** e **Seleção azul suave** para reverter somente as novidades, ou reinstale a [versão 0.1.1](https://github.com/vict0rg/zotero-pixel-blue-workspace/releases/tag/v0.1.1). Para restaurar o Zotero original, em **Ferramentas → Plugins**, desative ou remova **Zotero Pixel-Blue Workspace**. O plugin remove suas folhas de estilo ao ser desativado; reinicie o Zotero se outra extensão de tema tiver feito alterações próprias.

## Barra de menus

Este plugin **nunca oculta, substitui nem reposiciona** a barra nativa que contém **Arquivo, Editar, Exibir, Ferramentas, Ajuda**. Apenas acrescenta um submenu dentro do menu existente de Ferramentas; as regras CSS não usam `display`, `visibility`, `position` ou `height` no menubar. Isso evita reproduzir o tipo de falha percebido no Cupertino, mas só um teste no seu ambiente (Zotero + Linux + outros plugins) confirmará a ausência de regressões.

## Arquitetura e segurança

- `manifest.json`: registro, URL de atualização obrigatória e versões permitidas.
- `bootstrap.js`: inicialização, opções de Ferramentas, observadores e limpeza na desativação.
- `content/theme.css`: cores do Zotero e grade opcional.
- `content/reader.css`: cores da interface do leitor (nunca altera as páginas dos artigos).
- `content/icon.svg`: ícone original, sem fontes ou imagens de terceiros.
- Sem rede, rastreamento, modificação da biblioteca, tokens de API ou dependências externas.

## Testes

```bash
node --check bootstrap.js
node tests/smoke.cjs
node tests/manifest.cjs
bash scripts/build.sh
```

O teste usa uma simulação pequena do ciclo de vida do Zotero. Para teste efetivo, é indispensável instalar o `.xpi` em um Zotero real e verificar menus, painel de coleções, lista de itens, detalhe, abas e leitor em claro/escuro.

## Compilar

Na raiz do projeto, execute `bash scripts/build.sh`; será gerado `dist/zotero-pixel-blue-workspace-0.1.2.xpi` com os arquivos no nível correto do ZIP. O build cria também `dist/updates.json` para os Releases. **Não** compacte a pasta-pai: `manifest.json` e `bootstrap.js` precisam ficar na raiz do `.xpi`.

## Distribuição no GitHub

Existe um workflow de release acionado por tags `v*`; ele compila o XPI, cria `updates.json` com hash SHA-256 e publica ambos em um GitHub Release. Para usar, crie um repositório separado, por exemplo `vict0rg/zotero-pixel-blue-workspace`, faça commit do código e publique a tag `v0.1.2`. O manifesto inclui `update_url`, que o Zotero exige até para instalação manual. Ela aponta para um futuro Release no repositório `vict0rg/zotero-pixel-blue-workspace`; **a atualização automática só funcionará depois de criado o repositório e publicada uma release com `updates.json`**.

## Créditos e referências

Ver [CREDITS.md](CREDITS.md) e [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md). Este projeto não é uma distribuição oficial nem é afiliado aos criadores do Obsidian, Zotero ou dos temas citados.

## Licença

MIT. Uso de inspiração visual, padrões de extensão e bibliotecas sob licença MIT identificado em [CREDITS.md](CREDITS.md).

## Nota sobre a versão 0.1.2

Esta versão é publicada como **pre-release**, de instalação manual. Não é promovida automaticamente pela URL de atualização `releases/latest`, que continua oferecendo a versão 0.1.1 até uma nova versão estável ser publicada. A mudança foi validada por testes automatizados, mas ainda não visualmente dentro do Zotero da pessoa usuária.
