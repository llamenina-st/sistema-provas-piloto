# Relatório Prova de Piloto — Sistema de Gestão e Dashboard (v2.1)

Aplicação Web Responsiva completa para o departamento de criação e pilotagem de vestuário (**ila**).

---

## 🚀 Novidades da Versão 2.1 (Refatoração por Etapas)

1. **Etapa 1: Layout Geral, Navegação e Cabeçalho Oficial**
   - Sidebar com recolhimento e expansão dinâmica no Desktop (modo compacto 64px) e Mobile (drawer com overlay).
   - Cabeçalho oficial com **Logo ila posicionado à esquerda**, dimensionado verticalmente para acompanhar a altura do bloco de texto ao lado (`RELATÓRIO PROVA DE PILOTO`, `Período`, `Segmentos`, `Critério`, `Data/Hora`).
   - Títulos de seção rigorosamente alinhados à esquerda com detalhe em barra azul vertical.
   - Barra de filtros com botões **Aplicar** e **Limpar** redimensionados e alinhados na mesma linha.

2. **Etapa 2: KPIs Lado a Lado e Metas Configuráveis**
   - Grid horizontal de 6 cards lado a lado responsivos.
   - Sistema de Metas visíveis em tempo real nos cards:
     - Meta de Aprovação: **≥ 80%** (badge verde se atingida, vermelho se abaixo)
     - Meta de Repilotagem: **≤ 15%** (badge verde se dentro da meta, vermelho se acima)
     - Meta de Reprovação: **≤ 5%** (badge verde se dentro da meta, vermelho se acima)
   - Painel de edição de metas dinâmico na aba **Configurações**.

3. **Etapa 3: Gráficos com Headroom, Modelistas sem Lacunas e Filtro de Conversão**
   - Folga no Eixo Y (Headroom) de todos os gráficos (as barras nunca tocam o topo).
   - Agrupamento de barras de Modelistas sem lacunas vazias para situações zeradas.
   - Filtro individual por Modelista no bloco de **Taxa de Conversão de Repilotagens**.

4. **Etapa 4: Painel Avançado de Observações e Análise de Motivos**
   - Filtro por Motivo cadastrado com indicação da contagem de ocorrências.
   - Ordenação inteligente por **Volume/Frequência de Ocorrências** (identificação imediata de padrões repetitivos nas peças).
   - Busca textual instantânea por OP, Referência e texto da observação.

5. **Etapa 5: Sincronização Bidirecional e Ajuste de Formulário**
   - Termos inéditos digitados pelo Criador são registrados automaticamente com **"Exibir nos Gráficos" DESLIGADO (false)** por padrão.
   - Novos termos cadastrados pelo Admin na aba Configurações ficam **imediatamente disponíveis** nos selects e datalists do formulário.
   - Ajuste estético no campo de Motivos e Observações sem cortes ou sobreposições.

---

## 📁 Arquivos do Projeto

- **[`index.html`](file:///C:/Users/llame/.gemini/antigravity/scratch/prova-piloto/index.html)**: SPA semântica com 5 telas, cabeçalho institucional, grid de KPIs, gráficos e painel de observações.
- **[`style.css`](file:///C:/Users/llame/.gemini/antigravity/scratch/prova-piloto/style.css)**: Folha de estilos responsiva com tema Marsala/Bordô (`#722F37`), regras de layout e impressão A4 rigorosa.
- **[`app.js`](file:///C:/Users/llame/.gemini/antigravity/scratch/prova-piloto/app.js)**: Lógica completa ES6+ com Chart.js, cálculo de metas, gráficos dinâmicos e modo local/offline.
- **[`Code.gs`](file:///C:/Users/llame/.gemini/antigravity/scratch/prova-piloto/Code.gs)**: Script backend para Google Sheets como API Web App.

---

## 🧪 Como Testar no Navegador

Abra o arquivo [`index.html`](file:///C:/Users/llame/.gemini/antigravity/scratch/prova-piloto/index.html) diretamente no seu navegador:
- **Desenvolvedor (Admin):** Usuário: `admin` | Senha: `123`
- **Criador (Operador):** Usuário: `criador` | Senha: `123`
