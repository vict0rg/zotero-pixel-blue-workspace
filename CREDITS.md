# Referências e atribuições

Esta extensão não é uma cópia da interface do Obsidian. Ela traduz uma linguagem visual para os componentes nativos do Zotero. O código foi escrito para este projeto, com adaptação de padrões de ciclo de vida do plugin Warm Theme e valores semânticos inspirados nos temas citados.

1. **Rin / Rinrinsu — pixel-blue Workspace (Obsidian)**  
   https://github.com/Rinrinsu/pixel-blue-workspace  
   Licença MIT, Copyright (c) 2026 Rin. **Referência visual principal**: cores da variante Pixel Sky, superfícies de papel azul, grade fina de 20 px, contornos e contraste entre superfícies. Os tokens de cor foram analisados do código `styles.css`, seção `src/themes/pixel-sky.css`.

2. **Yufei Xia — Warm Theme for Zotero**  
   https://github.com/YufeiXIA/zotero-warm-theme  
   Licença MIT, Copyright (c) 2026 Yufei Xia. **Referência técnica principal**: empacotamento, `bootstrap.js`, registro de folhas CSS com escopo, observação de preferências e decoração de leitor; mapeamento das variáveis de cor usadas pelo Zotero 7+.

3. **Cupertino for Zotero contributors / shenghuang-123 — Cupertino for Zotero**  
   https://github.com/shenghuang-123/cupertino-for-zotero  
   Licença MIT, Copyright (c) 2026 Cupertino for Zotero contributors. **Referência de UX**: cuidado com apresentação de painéis e integração a menus nativos. O código do Cupertino **não** foi copiado. Diferentemente dele, esta extensão deixa inteiramente ao Zotero o layout de menubar, painéis e abas.

4. **Zotero Team — Make It Red / Zotero 7 for Developers**  
   https://github.com/zotero/make-it-red  
   https://www.zotero.org/support/dev/zotero_7_for_developers  
   **Referência oficial de API**: `manifest.json`, inicialização de plugins e handlers de abertura/fechamento de janela.

A identidade de `Pixel-Blue Workspace` e os nomes dos projetos acima pertencem aos respectivos autores. Não há imagens ou fontes de terceiros incorporadas ao XPI.
