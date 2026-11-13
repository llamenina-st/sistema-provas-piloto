/**
 * SISTEMA RELATÓRIO PROVA DE PILOTO — ILA
 * JavaScript Principal da SPA (Vanilla ES6+)
 * 
 * Versão 2.1 — Refatoração por Etapas:
 * - Etapa 1: Layout Geral, Toggle Sidebar Desktop/Mobile, Cabeçalho com Logo à Esquerda e Filtros
 * - Etapa 2: KPIs Lado a Lado (Grid) com Metas Configuráveis (Aprovação 80%, Repilotagem 15%, Reprovação 5%)
 * - Etapa 3: Headroom no Eixo Y, Agrupamento de Modelistas sem Lacunas Vazias, Filtro de Modelista na Conversão
 * - Etapa 4: Painel Avançado de Observações com Filtro de Motivo e Ordenação por Frequência de Ocorrência
 * - Etapa 5: Sincronização Bidirecional de Termos (Criador -> Indicador desligado / Admin -> Atualização imediata)
 */

'use strict';

// =============================================================================
// CONFIGURAÇÕES GLOBAIS
// =============================================================================
const CONFIG = {
  // Insira a URL do seu Google Apps Script Web App publicado aqui
  API_URL: 'https://script.google.com/macros/s/AKfycbw_Buw9tspb4ec0vrtbzXp-FV8TAlSMKmX23182Hbxj3Tw6PTczK9C2RK-sUJ58LcHsXw/exec',
  API_TOKEN: 'ila_prova_piloto_master_token_2026',
  CACHE_KEY_DASHBOARD: 'ila_dashboard_cache',
  CACHE_KEY_METAS: 'ila_kpi_metas'
};

// =============================================================================
// DADOS MOCK INICIAIS PARA TESTE E DEMONSTRAÇÃO IMEDIATA
// =============================================================================
const MOCK_DATA = {
  usuarios: [
    { usuario: 'admin', senha: '123', nome: 'Administrador (Gestor)', papel: 'DESENVOLVEDOR', ativo: true },
    { usuario: 'criador', senha: '123', nome: 'Criador Operador', papel: 'CRIADOR', ativo: true }
  ],
  metas: {
    aprovada: 80.0,
    repilotagem: 15.0,
    reprovada: 5.0
  },
  indicadores: [
    { termo_customizado: 'JEANS', categoria: 'SEGMENTO', exibir_nos_graficos: true },
    { termo_customizado: 'MODINHA', categoria: 'SEGMENTO', exibir_nos_graficos: true },
    { termo_customizado: 'PILOTO', categoria: 'ETAPA', exibir_nos_graficos: true },
    { termo_customizado: '1° REPILOTAGEM', categoria: 'ETAPA', exibir_nos_graficos: true },
    { termo_customizado: '2° REPILOTAGEM', categoria: 'ETAPA', exibir_nos_graficos: true },
    { termo_customizado: '3° REPILOTAGEM', categoria: 'ETAPA', exibir_nos_graficos: true },
    { termo_customizado: 'MODELAGEM', categoria: 'SERVICO', exibir_nos_graficos: true },
    { termo_customizado: 'COSTURA', categoria: 'SERVICO', exibir_nos_graficos: true },
    { termo_customizado: 'CORTE', categoria: 'SERVICO', exibir_nos_graficos: true },
    { termo_customizado: 'ACABAMENTO', categoria: 'SERVICO', exibir_nos_graficos: true },
    { termo_customizado: 'GRADUAÇÃO', categoria: 'SERVICO', exibir_nos_graficos: true },
    { termo_customizado: 'PILOTAGEM', categoria: 'SERVICO', exibir_nos_graficos: true },
    { termo_customizado: 'ESTAMPARIA', categoria: 'SERVICO', exibir_nos_graficos: true },
    { termo_customizado: 'Evair', categoria: 'MODELISTA', exibir_nos_graficos: true },
    { termo_customizado: 'Nilda Ferreira Brito', categoria: 'MODELISTA', exibir_nos_graficos: true },
    { termo_customizado: 'Elisangela', categoria: 'MODELISTA', exibir_nos_graficos: true },
    { termo_customizado: 'Cintia Lopes', categoria: 'MODELISTA', exibir_nos_graficos: true },
    { termo_customizado: 'Ana Paula', categoria: 'PILOTISTA', exibir_nos_graficos: true },
    { termo_customizado: 'Fernanda', categoria: 'PILOTISTA', exibir_nos_graficos: true },
    { termo_customizado: 'Juliana', categoria: 'PILOTISTA', exibir_nos_graficos: true },
    { termo_customizado: 'APROVADA', categoria: 'SITUACAO', exibir_nos_graficos: true },
    { termo_customizado: 'APROVADA COM AJUSTES', categoria: 'SITUACAO', exibir_nos_graficos: true },
    { termo_customizado: 'REPROVADA', categoria: 'SITUACAO', exibir_nos_graficos: true },
    { termo_customizado: 'REPILOTAGEM', categoria: 'SITUACAO', exibir_nos_graficos: true },
    { termo_customizado: 'STANDBY', categoria: 'SITUACAO', exibir_nos_graficos: true },
    { termo_customizado: 'AJUSTE DE MEDIDAS MODELISTA', categoria: 'MOTIVO', exibir_nos_graficos: true },
    { termo_customizado: 'AJUSTE DE GRADUAÇÃO DA PILOTO - PILOTO PP', categoria: 'MOTIVO', exibir_nos_graficos: true },
    { termo_customizado: 'ALTERAR MEDIDAS POR GOSTO PESSOAL', categoria: 'MOTIVO', exibir_nos_graficos: true },
    { termo_customizado: 'VISUAL NÃO AGRADOU A DIRETORIA', categoria: 'MOTIVO', exibir_nos_graficos: true },
    { termo_customizado: 'CAIMENTO DA MALHA NAO ENCAIXOU COM O ESTILO DO MODELO', categoria: 'MOTIVO', exibir_nos_graficos: true }
  ],
  ops_aprovadas: [
    { id: 'op1', data_prova: '02/11/2026', hora_cadastro: '10:00:00', usuario_cadastro: 'Criador Operador', op: '8880', referencia: 'J101', segmento: 'JEANS', etapa: 'PILOTO', servico: '', modelista: 'Evair', pilotista: 'Ana Paula', situacao: 'APROVADA', motivos: '', observacao: 'Peça aprovada conforme ficha técnica', aprovado_por: 'Administrador (Gestor)', data_aprovacao: '02/11/2026 11:00:00' },
    { id: 'op2', data_prova: '03/11/2026', hora_cadastro: '10:30:00', usuario_cadastro: 'Criador Operador', op: '8881', referencia: 'J102', segmento: 'JEANS', etapa: 'PILOTO', servico: '', modelista: 'Nilda Ferreira Brito', pilotista: 'Fernanda', situacao: 'APROVADA', motivos: '', observacao: '', aprovado_por: 'Administrador (Gestor)', data_aprovacao: '03/11/2026 11:30:00' },
    { id: 'op3', data_prova: '03/11/2026', hora_cadastro: '11:00:00', usuario_cadastro: 'Criador Operador', op: '8882', referencia: 'M201', segmento: 'MODINHA', etapa: 'PILOTO', servico: '', modelista: 'Elisangela', pilotista: 'Juliana', situacao: 'REPROVADA', motivos: 'VISUAL NÃO AGRADOU A DIRETORIA', observacao: 'Decote muito profundo segundo a diretoria de estilo', aprovado_por: 'Administrador (Gestor)', data_aprovacao: '03/11/2026 12:00:00' },
    { id: 'op4', data_prova: '04/11/2026', hora_cadastro: '09:15:00', usuario_cadastro: 'Criador Operador', op: '8883', referencia: 'M202', segmento: 'MODINHA', etapa: 'PILOTO', servico: '', modelista: 'Cintia Lopes', pilotista: 'Ana Paula', situacao: 'REPROVADA', motivos: 'CAIMENTO DA MALHA NAO ENCAIXOU COM O ESTILO DO MODELO', observacao: 'Malha muito pesada para o drapeado desejado', aprovado_por: 'Administrador (Gestor)', data_aprovacao: '04/11/2026 10:00:00' },
    { id: 'op5', data_prova: '04/11/2026', hora_cadastro: '14:20:00', usuario_cadastro: 'Criador Operador', op: '8884', referencia: 'J103', segmento: 'JEANS', etapa: '1° REPILOTAGEM', servico: 'MODELAGEM', modelista: 'Evair', pilotista: 'Fernanda', situacao: 'APROVADA COM AJUSTES', motivos: 'AJUSTE DE MEDIDAS MODELISTA', observacao: 'Ajustado cós 1cm e reduzido gancho frontal', aprovado_por: 'Administrador (Gestor)', data_aprovacao: '04/11/2026 15:00:00' },
    { id: 'op6', data_prova: '05/11/2026', hora_cadastro: '10:00:00', usuario_cadastro: 'Criador Operador', op: '8885', referencia: 'J104', segmento: 'JEANS', etapa: '1° REPILOTAGEM', servico: 'MODELAGEM', modelista: 'Nilda Ferreira Brito', pilotista: 'Ana Paula', situacao: 'APROVADA COM AJUSTES', motivos: 'AJUSTE DE MEDIDAS MODELISTA||ALTERAR MEDIDAS POR GOSTO PESSOAL', observacao: 'Ajustada lateral e comprimento da perna a pedido do estilo', aprovado_por: 'Administrador (Gestor)', data_aprovacao: '05/11/2026 11:00:00' },
    { id: 'op7', data_prova: '05/11/2026', hora_cadastro: '14:00:00', usuario_cadastro: 'Criador Operador', op: '8886', referencia: 'J105', segmento: 'JEANS', etapa: 'PILOTO', servico: '', modelista: 'Evair', pilotista: 'Juliana', situacao: 'REPILOTAGEM', motivos: 'AJUSTE DE MEDIDAS MODELISTA', observacao: 'Falta comprimento de gancho na parte traseira', aprovado_por: 'Administrador (Gestor)', data_aprovacao: '05/11/2026 15:00:00' },
    { id: 'op8', data_prova: '06/11/2026', hora_cadastro: '09:00:00', usuario_cadastro: 'Criador Operador', op: '8887', referencia: 'M203', segmento: 'MODINHA', etapa: 'PILOTO', servico: '', modelista: 'Elisangela', pilotista: 'Fernanda', situacao: 'REPILOTAGEM', motivos: 'AJUSTE DE GRADUAÇÃO DA PILOTO - PILOTO PP', observacao: 'Graduação do tamanho PP desregulada na largura do busto', aprovado_por: 'Administrador (Gestor)', data_aprovacao: '06/11/2026 10:00:00' },
    { id: 'op9', data_prova: '06/11/2026', hora_cadastro: '10:30:00', usuario_cadastro: 'Criador Operador', op: '8888', referencia: 'B936', segmento: 'MODINHA', etapa: '1° REPILOTAGEM', servico: 'MODELAGEM', modelista: 'Cintia Lopes', pilotista: 'Juliana', situacao: 'APROVADA', motivos: '', observacao: 'Peça aprovada perfeita após a 1ª repilotagem', aprovado_por: 'Administrador (Gestor)', data_aprovacao: '06/11/2026 11:00:00' },
    { id: 'op10', data_prova: '06/11/2026', hora_cadastro: '11:00:00', usuario_cadastro: 'Criador Operador', op: '8889', referencia: 'J106', segmento: 'JEANS', etapa: 'PILOTO', servico: '', modelista: 'Evair', pilotista: 'Ana Paula', situacao: 'APROVADA', motivos: '', observacao: '', aprovado_por: 'Administrador (Gestor)', data_aprovacao: '06/11/2026 11:30:00' },
    { id: 'op11', data_prova: '06/11/2026', hora_cadastro: '11:45:00', usuario_cadastro: 'Criador Operador', op: '8891', referencia: 'J107', segmento: 'JEANS', etapa: 'PILOTO', servico: '', modelista: 'Evair', pilotista: 'Fernanda', situacao: 'APROVADA COM AJUSTES', motivos: 'AJUSTE DE MEDIDAS MODELISTA', observacao: 'Leve folga no quadril ajustada', aprovado_por: 'Administrador (Gestor)', data_aprovacao: '06/11/2026 12:00:00' },
    { id: 'op12', data_prova: '06/11/2026', hora_cadastro: '13:30:00', usuario_cadastro: 'Criador Operador', op: '8892', referencia: 'M204', segmento: 'MODINHA', etapa: 'PILOTO', servico: '', modelista: 'Cintia Lopes', pilotista: 'Juliana', situacao: 'APROVADA COM AJUSTES', motivos: 'ALTERAR MEDIDAS POR GOSTO PESSOAL', observacao: 'Diminuir 0.5cm no punho', aprovado_por: 'Administrador (Gestor)', data_aprovacao: '06/11/2026 14:00:00' }
  ],
  ops_pendentes: [
    { id: 'pnd1', data_prova: '06/11/2026', hora_cadastro: '14:10:00', usuario_cadastro: 'Criador Operador', op: '8890', referencia: 'B937', segmento: 'MODINHA', etapa: '2° REPILOTAGEM', servico: 'MODELAGEM', modelista: 'Cintia Lopes', pilotista: 'Ana Paula', situacao: 'REPILOTAGEM', motivos: 'AJUSTE DE MEDIDAS MODELISTA', observacao: 'Necessita ajuste na curva da cava e ombro', data_criacao: '06/11/2026 14:10:00' }
  ]
};

// =============================================================================
// ESTADO GLOBAL DA APLICAÇÃO
// =============================================================================
const state = {
  currentUser: null,
  motivosTags: [],
  metas: {
    aprovada: 80.0,
    repilotagem: 15.0,
    reprovada: 5.0
  },
  charts: {
    paretoRepilotagem: null,
    paretoReprovacao: null,
    paretoAprovacaoAjustes: null,
    modelista: null,
    pilotista: null,
    repilotagemRosca: null
  },
  modelistaStacked: false,
  pilotistaStacked: false,
  pendingRejectId: null,
  rawOpsAprovadas: [],
  rawOpsPendentes: [],
  rawIndicadores: [],
  lastDashboardData: null,
  selectedRepilotagemModelista: 'Todos'
};

// =============================================================================
// UTILITÁRIOS (TOASTS, LOADING, FORMATADORES)
// =============================================================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');

  let iconName = 'check-circle-2';
  if (type === 'error') iconName = 'alert-circle';
  if (type === 'warning') iconName = 'alert-triangle';

  toast.innerHTML = `
    <i data-lucide="${iconName}" aria-hidden="true"></i>
    <span>${escapeHTML(message)}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons({ root: toast });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function showLoading(show = true) {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.hidden = !show;
    overlay.style.display = show ? 'flex' : 'none';
  }
}

function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDateBR(dateString) {
  if (!dateString) return '';
  if (dateString.includes('/')) return dateString;
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

function formatTimeNow() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatDateNowISO() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// =============================================================================
// COMUNICAÇÃO COM O BACKEND (GAS / MOCK LOCAL)
// =============================================================================
async function apiGet(action, params = {}) {
  if (!CONFIG.API_URL) {
    return handleLocalGet(action, params);
  }

  showLoading(true);
  try {
    const url = new URL(CONFIG.API_URL);
    url.searchParams.append('action', action);
    url.searchParams.append('x-api-token', CONFIG.API_TOKEN);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.append(k, v);
      }
    }

    const res = await fetch(url.toString(), { method: 'GET', mode: 'cors' });
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn(`Erro na chamada API GET (${action}), operando com dados locais:`, err);
    return handleLocalGet(action, params);
  } finally {
    showLoading(false);
  }
}

async function apiPost(action, body = {}) {
  if (!CONFIG.API_URL) {
    return handleLocalPost(action, body);
  }

  showLoading(true);
  try {
    const payload = {
      action: action,
      'x-api-token': CONFIG.API_TOKEN,
      usuario: state.currentUser ? state.currentUser.usuario : '',
      ...body
    };

    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn(`Erro na chamada API POST (${action}), executando fallback local:`, err);
    return handleLocalPost(action, body);
  } finally {
    showLoading(false);
  }
}

// Manipulador local quando API não estiver configurada
function handleLocalGet(action, params) {
  if (action === 'login') {
    const u = MOCK_DATA.usuarios.find(x => x.usuario === params.usuario && x.senha === params.senha && x.ativo);
    if (u) {
      return { success: true, data: { usuario: u.usuario, nome: u.nome, papel: u.papel } };
    }
    return { success: false, message: 'Usuário ou senha incorretos' };
  }

  if (action === 'get_indicadores') {
    let ind = MOCK_DATA.indicadores;
    if (params.categoria && params.categoria !== 'TODOS') {
      ind = ind.filter(x => x.categoria === params.categoria);
    }
    return { success: true, data: ind };
  }

  if (action === 'get_ops_pendentes') {
    return { success: true, data: MOCK_DATA.ops_pendentes };
  }

  if (action === 'get_ops_aprovadas') {
    return { success: true, data: MOCK_DATA.ops_aprovadas };
  }

  if (action === 'get_pending_count') {
    return { success: true, data: { count: MOCK_DATA.ops_pendentes.length } };
  }

  if (action === 'get_etapa_sugerida') {
    const op = params.op;
    const all = [...MOCK_DATA.ops_aprovadas, ...MOCK_DATA.ops_pendentes].filter(x => String(x.op).trim() === String(op).trim());
    if (all.length === 0) return { success: true, data: { etapa: 'PILOTO' } };

    let maxRep = 0;
    let hasPiloto = false;
    all.forEach(item => {
      const et = String(item.etapa || '').toUpperCase();
      if (et.includes('PILOTO') && !et.includes('REPILOTAGEM')) hasPiloto = true;
      const m = et.match(/(\d+)°?\s*REPILOTAGEM/);
      if (m) {
        const num = parseInt(m[1], 10);
        if (num > maxRep) maxRep = num;
      } else if (et.includes('REPILOTAGEM')) {
        if (maxRep === 0) maxRep = 1;
      }
    });

    if (maxRep > 0) return { success: true, data: { etapa: `${maxRep + 1}° REPILOTAGEM` } };
    if (hasPiloto) return { success: true, data: { etapa: '1° REPILOTAGEM' } };
    return { success: true, data: { etapa: 'PILOTO' } };
  }

  if (action === 'get_dashboard_data') {
    return { success: true, data: calculateDashboardLocally(params) };
  }

  return { success: false, message: 'Ação não reconhecida' };
}

function handleLocalPost(action, body) {
  if (action === 'cadastrar_op') {
    const newId = 'pnd_' + Date.now();
    const newOp = {
      id: newId,
      data_prova: body.data_prova || formatDateNowISO(),
      hora_cadastro: body.hora_cadastro || formatTimeNow(),
      usuario_cadastro: state.currentUser ? state.currentUser.nome : 'Usuário',
      op: body.op,
      referencia: body.referencia,
      segmento: body.segmento,
      etapa: body.etapa,
      servico: body.servico,
      modelista: body.modelista,
      pilotista: body.pilotista,
      situacao: body.situacao,
      motivos: body.motivos || '',
      observacao: body.observacao || '',
      data_criacao: new Date().toLocaleString('pt-BR')
    };
    MOCK_DATA.ops_pendentes.unshift(newOp);

    // ETAPA 5: Sincronização automática de termos inéditos do Criador (com exibir_nos_graficos: false)
    checkAndRegisterNewTermsFromCriador(newOp);

    return { success: true, message: 'OP cadastrada com sucesso! Aguardando aprovação.', data: newOp };
  }

  if (action === 'aprovar_op') {
    const idx = MOCK_DATA.ops_pendentes.findIndex(x => x.id === body.id);
    if (idx !== -1) {
      const op = MOCK_DATA.ops_pendentes.splice(idx, 1)[0];
      op.aprovado_por = state.currentUser ? state.currentUser.nome : 'Admin';
      op.data_aprovacao = new Date().toLocaleString('pt-BR');
      MOCK_DATA.ops_aprovadas.unshift(op);
      return { success: true, message: 'OP aprovada com sucesso!' };
    }
    return { success: false, message: 'OP não encontrada' };
  }

  if (action === 'aprovar_lote') {
    const ids = body.ids || [];
    let count = 0;
    ids.forEach(id => {
      const idx = MOCK_DATA.ops_pendentes.findIndex(x => x.id === id);
      if (idx !== -1) {
        const op = MOCK_DATA.ops_pendentes.splice(idx, 1)[0];
        op.aprovado_por = state.currentUser ? state.currentUser.nome : 'Admin';
        op.data_aprovacao = new Date().toLocaleString('pt-BR');
        MOCK_DATA.ops_aprovadas.unshift(op);
        count++;
      }
    });
    return { success: true, message: `${count} OPs aprovadas com sucesso!` };
  }

  if (action === 'rejeitar_op') {
    const idx = MOCK_DATA.ops_pendentes.findIndex(x => x.id === body.id);
    if (idx !== -1) {
      MOCK_DATA.ops_pendentes.splice(idx, 1);
      return { success: true, message: 'OP rejeitada e arquivada.' };
    }
    return { success: false, message: 'OP não encontrada' };
  }

  if (action === 'salvar_indicador') {
    const exists = MOCK_DATA.indicadores.find(
      x => x.termo_customizado.toUpperCase() === body.termo_customizado.toUpperCase() && x.categoria === body.categoria
    );
    if (!exists) {
      MOCK_DATA.indicadores.push({
        termo_customizado: body.termo_customizado,
        categoria: body.categoria,
        exibir_nos_graficos: body.exibir_nos_graficos !== undefined ? body.exibir_nos_graficos : true,
        cadastrado_por: state.currentUser ? state.currentUser.nome : 'Admin',
        data_cadastro: new Date().toLocaleDateString('pt-BR')
      });
    }
    return { success: true, message: 'Indicador salvo com sucesso!' };
  }

  if (action === 'toggle_indicador') {
    const item = MOCK_DATA.indicadores.find(
      x => x.termo_customizado === body.termo_customizado && x.categoria === body.categoria
    );
    if (item) {
      item.exibir_nos_graficos = !item.exibir_nos_graficos;
      return { success: true, message: 'Visibilidade atualizada!' };
    }
    return { success: false, message: 'Termo não encontrado' };
  }

  return { success: false, message: 'Ação não suportada' };
}

// Preenche o select de "pessoa" no filtro de eficiência de repilotagem conforme o tipo escolhido
function populateRepilotagemPessoaSelect(tipo, indicadores) {
  const selPessoa = document.getElementById('filter-repilotagem-pessoa');
  if (!selPessoa) return;

  if (!tipo || tipo === 'Todos') {
    selPessoa.style.display = 'none';
    selPessoa.innerHTML = '<option value="Todos">Todos(as)</option>';
    return;
  }

  const categoria = tipo === 'Modelista' ? 'MODELISTA' : 'PILOTISTA';
  const fonte = indicadores || state.rawIndicadores;
  const items = fonte.filter(x => x.categoria === categoria);

  selPessoa.innerHTML = `<option value="Todos">Todas as ${tipo === 'Modelista' ? 'Modelistas' : 'Pilotistas'}</option>`;
  items.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.termo_customizado;
    opt.textContent = item.termo_customizado;
    selPessoa.appendChild(opt);
  });
  selPessoa.value = 'Todos';
  selPessoa.style.display = '';
}

// ETAPA 5: Função que registra termos novos cadastrados pelo Criador com 'exibir_nos_graficos: false'
function checkAndRegisterNewTermsFromCriador(op) {
  const registerIfNew = (termo, categoria) => {
    if (!termo) return;
    const clean = String(termo).trim();
    if (!clean) return;

    const exists = MOCK_DATA.indicadores.some(
      x => x.termo_customizado.toUpperCase() === clean.toUpperCase() && x.categoria === categoria
    );

    if (!exists) {
      MOCK_DATA.indicadores.push({
        termo_customizado: clean,
        categoria: categoria,
        exibir_nos_graficos: false, // DESLIGADO por padrão conforme requisito ETAPA 5.2
        cadastrado_por: `${state.currentUser ? state.currentUser.nome : 'Criador'} (Auto)`,
        data_cadastro: new Date().toLocaleDateString('pt-BR')
      });
    }
  };

  registerIfNew(op.situacao, 'SITUACAO');
  registerIfNew(op.segmento, 'SEGMENTO');
  registerIfNew(op.servico, 'SERVICO');
  registerIfNew(op.modelista, 'MODELISTA');
  registerIfNew(op.pilotista, 'PILOTISTA');
  registerIfNew(op.etapa, 'ETAPA');

  if (op.motivos) {
    op.motivos.split('||').forEach(m => registerIfNew(m, 'MOTIVO'));
  }

  // Atualizar datalists do sistema
  state.rawIndicadores = MOCK_DATA.indicadores;
  populateDatalists(MOCK_DATA.indicadores);
}

// Cálculo do Dashboard Local
function calculateDashboardLocally(filters = {}) {
  let ops = [...MOCK_DATA.ops_aprovadas];

  // Filtros
  if (filters.segmento && filters.segmento !== 'Todos') {
    ops = ops.filter(x => (x.segmento || '').toUpperCase() === filters.segmento.toUpperCase());
  }
  if (filters.etapa && filters.etapa !== 'Todas') {
    if (filters.etapa === 'Somente Piloto') {
      ops = ops.filter(x => (x.etapa || '').toUpperCase().includes('PILOTO') && !(x.etapa || '').toUpperCase().includes('REPILOTAGEM'));
    } else if (filters.etapa === 'Somente Repilotagem') {
      ops = ops.filter(x => (x.etapa || '').toUpperCase().includes('REPILOTAGEM'));
    }
  }
  if (filters.servico && filters.servico !== 'Todos') {
    ops = ops.filter(x => (x.servico || '').toUpperCase() === filters.servico.toUpperCase());
  }
  if (filters.modelista && filters.modelista !== 'Todos') {
    ops = ops.filter(x => (x.modelista || '').toUpperCase() === filters.modelista.toUpperCase());
  }
  if (filters.pilotista && filters.pilotista !== 'Todos') {
    ops = ops.filter(x => (x.pilotista || '').toUpperCase() === filters.pilotista.toUpperCase());
  }

  // 1. KPIs
  const total = ops.length;
  const piloto = ops.filter(x => (x.etapa || '').toUpperCase().includes('PILOTO') && !(x.etapa || '').toUpperCase().includes('REPILOTAGEM')).length;
  const repilotagens = ops.filter(x => (x.etapa || '').toUpperCase().includes('REPILOTAGEM')).length;
  const aprovadas = ops.filter(x => {
    const s = (x.situacao || '').toUpperCase();
    return s === 'APROVADA' || s === 'APROVADA COM AJUSTES';
  }).length;
  const reprovadas = ops.filter(x => (x.situacao || '').toUpperCase() === 'REPROVADA').length;
  const standby = ops.filter(x => (x.situacao || '').toUpperCase() === 'STANDBY').length;

  // 2. Resumo por Segmento
  const segmentosUnicos = [...new Set(ops.map(x => x.segmento || 'OUTROS'))];
  const resumoSegmento = segmentosUnicos.map(seg => {
    const subset = ops.filter(x => (x.segmento || 'OUTROS') === seg);
    const segTotal = subset.length;
    const segPiloto = subset.filter(x => (x.etapa || '').toUpperCase().includes('PILOTO') && !(x.etapa || '').toUpperCase().includes('REPILOTAGEM')).length;
    const segAprov = subset.filter(x => {
      const s = (x.situacao || '').toUpperCase();
      return s === 'APROVADA' || s === 'APROVADA COM AJUSTES';
    }).length;
    const segRepil = subset.filter(x => (x.etapa || '').toUpperCase().includes('REPILOTAGEM')).length;
    const segReprov = subset.filter(x => (x.situacao || '').toUpperCase() === 'REPROVADA').length;
    const segStandby = subset.filter(x => (x.situacao || '').toUpperCase() === 'STANDBY').length;

    return {
      segmento: seg,
      total: segTotal,
      piloto: segPiloto,
      pct_piloto: segTotal ? ((segPiloto / segTotal) * 100).toFixed(1) : '0.0',
      aprovadas: segAprov,
      pct_aprovadas: segTotal ? ((segAprov / segTotal) * 100).toFixed(1) : '0.0',
      repilotagem: segRepil,
      pct_repilotagem: segTotal ? ((segRepil / segTotal) * 100).toFixed(1) : '0.0',
      reprovadas: segReprov,
      pct_reprovadas: segTotal ? ((segReprov / segTotal) * 100).toFixed(1) : '0.0',
      standby: segStandby,
      pct_standby: segTotal ? ((segStandby / segTotal) * 100).toFixed(1) : '0.0'
    };
  });

  // 3. Paretos
  const buildPareto = (situacaoFilter) => {
    const subset = ops.filter(x => {
      const s = (x.situacao || '').toUpperCase();
      if (Array.isArray(situacaoFilter)) return situacaoFilter.includes(s);
      return s === situacaoFilter.toUpperCase();
    });

    const motivoCounts = {};
    subset.forEach(item => {
      const motivosRaw = item.motivos || '';
      if (!motivosRaw.trim()) return;
      const arr = motivosRaw.split('||');
      arr.forEach(m => {
        const mt = m.trim();
        if (mt) {
          motivoCounts[mt] = (motivoCounts[mt] || 0) + 1;
        }
      });
    });

    const sorted = Object.entries(motivoCounts)
      .map(([motivo, quantidade]) => ({ motivo, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 8);

    const totalMotivos = sorted.reduce((acc, curr) => acc + curr.quantidade, 0);
    let cum = 0;
    return sorted.map((item, idx) => {
      cum += item.quantidade;
      const pctAcum = totalMotivos > 0 ? Math.round((cum / totalMotivos) * 100) : 0;
      const pctNum = totalMotivos > 0 ? (item.quantidade / totalMotivos) * 100 : 0;
      const pctIndiv = (pctNum % 1 === 0 ? pctNum.toFixed(0) : pctNum.toFixed(1)) + '%';
      return {
        codigo: `M${idx + 1}`,
        motivo: item.motivo,
        quantidade: item.quantidade,
        pctIndividual: pctIndiv,
        pctAcumulado: pctAcum
      };
    });
  };

  const paretoRepilotagem = buildPareto('REPILOTAGEM');
  const paretoReprovacao = buildPareto('REPROVADA');
  const paretoAprovacaoAjustes = buildPareto('APROVADA COM AJUSTES');

  // 4. Modelistas — apenas repilotagens de serviço MODELAGEM
  // Filtra OPs que são repilotagem (situacao = REPILOTAGEM) com serviço de MODELAGEM
  const opsRepModelista = ops.filter(x =>
    (x.situacao || '').toUpperCase() === 'REPILOTAGEM' &&
    (x.servico  || '').toUpperCase() === 'MODELAGEM'
  );
  const modelistasUnicos = [...new Set(opsRepModelista.map(x => x.modelista || 'Não informado'))];
  const modelistas = modelistasUnicos.map(mod => {
    const mOps = opsRepModelista.filter(x => (x.modelista || 'Não informado') === mod);
    return {
      modelista: mod,
      // Neste contexto todas as OPs já têm situacao=REPILOTAGEM;
      // os campos abaixo ficam prontos para quando o filtro for expandido no futuro
      aprovada: 0,
      aprovada_ajustes: 0,
      reprovada: 0,
      repilotagem: mOps.length,   // todas são repilotagem por definição
      standby: 0
    };
  }).filter(m => m.repilotagem > 0)
    .sort((a, b) => b.repilotagem - a.repilotagem);

  // 4b. Pilotistas
  const pilotistasUnicos = [...new Set(ops.map(x => x.pilotista || 'Não informado'))];
  const pilotistas = pilotistasUnicos.map(pil => {
    const pOps = ops.filter(x => (x.pilotista || 'Não informado') === pil);
    return {
      pilotista: pil,
      aprovada: pOps.filter(x => (x.situacao || '').toUpperCase() === 'APROVADA').length,
      aprovada_ajustes: pOps.filter(x => (x.situacao || '').toUpperCase() === 'APROVADA COM AJUSTES').length,
      reprovada: pOps.filter(x => (x.situacao || '').toUpperCase() === 'REPROVADA').length,
      repilotagem: pOps.filter(x => (x.situacao || '').toUpperCase() === 'REPILOTAGEM').length,
      standby: pOps.filter(x => (x.situacao || '').toUpperCase() === 'STANDBY').length
    };
  });

  // 5. Eficiência de Repilotagens (Geral)
  const opsRepilotagens = ops.filter(x => (x.etapa || '').toUpperCase().includes('REPILOTAGEM'));
  const repTotal = opsRepilotagens.length;
  const repAprov = opsRepilotagens.filter(x => {
    const s = (x.situacao || '').toUpperCase();
    return s === 'APROVADA' || s === 'APROVADA COM AJUSTES';
  }).length;
  const repMantida = opsRepilotagens.filter(x => (x.situacao || '').toUpperCase() === 'REPILOTAGEM').length;
  const repReprov = opsRepilotagens.filter(x => (x.situacao || '').toUpperCase() === 'REPROVADA').length;
  const repStandby = opsRepilotagens.filter(x => (x.situacao || '').toUpperCase() === 'STANDBY').length;
  const taxaConversao = repTotal > 0 ? ((repAprov / repTotal) * 100).toFixed(1) : '0.0';

  return {
    kpis: { total, piloto, repilotagens, aprovadas, reprovadas, standby },
    resumo_segmento: resumoSegmento,
    pareto_repilotagem: paretoRepilotagem,
    pareto_reprovacao: paretoReprovacao,
    pareto_aprovacao_ajustes: paretoAprovacaoAjustes,
    modelistas: modelistas,
    pilotistas: pilotistas,
    repilotagem_conversao: {
      total: repTotal,
      aprovada: repAprov,
      repilotagem: repMantida,
      reprovada: repReprov,
      standby: repStandby,
      taxa_conversao: taxaConversao
    },
    raw_ops: ops
  };
}

// =============================================================================
// GERENCIAMENTO DE SESSÃO & AUTENTICAÇÃO
// =============================================================================
function initAuth() {
  loadSavedMetas();

  const saved = localStorage.getItem('ila_user_session');
  if (saved) {
    try {
      state.currentUser = JSON.parse(saved);
      applyUserSession();
    } catch (e) {
      localStorage.removeItem('ila_user_session');
      showLoginView();
    }
  } else {
    showLoginView();
  }

  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = document.getElementById('usuario').value.trim();
      const s = document.getElementById('senha').value.trim();
      const errBox = document.getElementById('login-error');

      if (!u || !s) {
        if (errBox) {
          errBox.textContent = 'Por favor, informe o usuário e a senha.';
          errBox.hidden = false;
        }
        return;
      }

      if (errBox) errBox.hidden = true;

      const res = await apiGet('login', { usuario: u, senha: s });
      if (res && res.success && res.data) {
        state.currentUser = res.data;
        localStorage.setItem('ila_user_session', JSON.stringify(res.data));
        applyUserSession();
        showToast(`Bem-vindo(a), ${res.data.nome}!`, 'success');
      } else {
        if (errBox) {
          errBox.textContent = (res && res.message) || 'Usuário ou senha incorretos.';
          errBox.hidden = false;
        }
      }
    });
  }

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('ila_user_session');
      state.currentUser = null;
      showLoginView();
      showToast('Sessão encerrada com sucesso.', 'success');
    });
  }
}

function showLoginView() {
  const loginView = document.getElementById('view-login');
  const appContainer = document.getElementById('app-container');
  if (loginView) {
    loginView.hidden = false;
    loginView.style.display = 'flex';
  }
  if (appContainer) {
    appContainer.hidden = true;
    appContainer.style.display = 'none';
  }
  document.body.classList.remove('role-desenvolvedor', 'role-criador');
  showLoading(false);
}

function applyUserSession() {
  const user = state.currentUser;
  if (!user) return;

  const loginView = document.getElementById('view-login');
  const appContainer = document.getElementById('app-container');
  if (loginView) {
    loginView.hidden = true;
    loginView.style.display = 'none';
  }
  if (appContainer) {
    appContainer.hidden = false;
    appContainer.style.display = 'flex';
  }

  const userNameEl = document.getElementById('user-name');
  const userRoleEl = document.getElementById('user-role');
  if (userNameEl) userNameEl.textContent = user.nome;
  if (userRoleEl) {
    userRoleEl.textContent = user.papel;
    userRoleEl.className = `role-badge ${user.papel === 'DESENVOLVEDOR' ? 'badge-dev' : 'badge-criador'}`;
  }

  document.body.classList.remove('role-desenvolvedor', 'role-criador');
  if (user.papel === 'DESENVOLVEDOR') {
    document.body.classList.add('role-desenvolvedor');
    document.querySelectorAll('.dev-only').forEach(el => el.hidden = false);
  } else {
    document.body.classList.add('role-criador');
    document.querySelectorAll('.dev-only').forEach(el => el.hidden = true);
  }

  const cadUser = document.getElementById('cad-usuario');
  if (cadUser) cadUser.value = user.nome;

  loadInitialData();
  switchView('dashboard');
}

// =============================================================================
// ETAPA 1: NAVEGAÇÃO & TOGGLE DA SIDEBAR DESKTOP/MOBILE
// =============================================================================
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = item.getAttribute('data-view');
      switchView(targetView);
      closeMobileSidebar();
    });
  });

  // Botão de Alternar Sidebar (ETAPA 1: Funciona dinamicamente no Desktop e Mobile)
  const btnHam = document.getElementById('btn-hamburger');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (btnHam) {
    btnHam.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        // Mobile Drawer
        const isOpen = sidebar.classList.toggle('sidebar-open');
        overlay.hidden = !isOpen;
        btnHam.setAttribute('aria-expanded', isOpen);
      } else {
        // Desktop Collapse/Expand
        document.body.classList.toggle('sidebar-collapsed');
      }
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeMobileSidebar);
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const btnHam = document.getElementById('btn-hamburger');
  if (sidebar) sidebar.classList.remove('sidebar-open');
  if (overlay) overlay.hidden = true;
  if (btnHam) btnHam.setAttribute('aria-expanded', 'false');
}

function switchView(viewName) {
  document.querySelectorAll('.view').forEach(v => {
    v.hidden = true;
    v.style.display = 'none';
  });

  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.remove('active');
    n.removeAttribute('aria-current');
  });

  const target = document.getElementById(`view-${viewName}`);
  const navTarget = document.querySelector(`.nav-item[data-view="${viewName}"]`);

  if (target) {
    target.hidden = false;
    target.style.display = 'block';
  }

  if (navTarget) {
    navTarget.classList.add('active');
    navTarget.setAttribute('aria-current', 'page');
  }

  if (viewName === 'dashboard') {
    loadDashboard();
  } else if (viewName === 'cadastro') {
    setupCadastroFormDefaults();
  } else if (viewName === 'aprovacao') {
    loadFilaAprovacao();
  } else if (viewName === 'config') {
    loadConfigIndicadores();
  }

  if (window.lucide) window.lucide.createIcons();
}

// =============================================================================
// CARREGAMENTO DE INDICADORES, DATALISTS & FILTROS
// =============================================================================
async function loadInitialData() {
  const res = await apiGet('get_indicadores', { usuario: state.currentUser ? state.currentUser.usuario : '' });
  if (res && res.success && res.data) {
    state.rawIndicadores = res.data;
    populateDatalists(res.data);
  }
  updatePendingBadge();
}

function populateDatalists(indicadores) {
  const mapCategoryToDatalist = {
    SEGMENTO: 'dl-segmento',
    SERVICO: 'dl-servico',
    MODELISTA: 'dl-modelista',
    PILOTISTA: 'dl-pilotista',
    SITUACAO: 'dl-situacao',
    MOTIVO: 'dl-motivo'
  };

  Object.values(mapCategoryToDatalist).forEach(id => {
    const dl = document.getElementById(id);
    if (dl) dl.innerHTML = '';
  });

  indicadores.forEach(ind => {
    const dlId = mapCategoryToDatalist[ind.categoria];
    if (dlId) {
      const dl = document.getElementById(dlId);
      if (dl) {
        const opt = document.createElement('option');
        opt.value = ind.termo_customizado;
        dl.appendChild(opt);
      }
    }
  });

  populateFilterSelects(indicadores);
  
  // FIX: Melhorar suporte mobile para datalists
  enhanceMobileDatalistSupport(mapCategoryToDatalist, indicadores);
}

// Função auxiliar para melhorar suporte a datalist no mobile
function enhanceMobileDatalistSupport(mapCategoryToDatalist, indicadores) {
  // Detecta se está em mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (!isMobile) return; // Desktop funciona bem com datalist nativo
  
  // Lista de inputs a processar (incluindo o campo especial de motivo)
  const inputsToProcess = [];
  
  // Adiciona os campos regulares
  Object.entries(mapCategoryToDatalist).forEach(([categoria, datalistId]) => {
    const inputId = datalistId.replace('dl-', 'cad-');
    inputsToProcess.push({ inputId, datalistId, categoria });
  });
  
  // Adiciona o campo especial de motivo (usa cad-motivo-input)
  inputsToProcess.push({ 
    inputId: 'cad-motivo-input', 
    datalistId: 'dl-motivo', 
    categoria: 'MOTIVO' 
  });
  
  // Para cada campo com datalist, adiciona funcionalidade customizada
  inputsToProcess.forEach(({ inputId, datalistId, categoria }) => {
    const input = document.getElementById(inputId);
    
    if (!input) return;
    
    // Armazena os valores válidos no elemento para acesso rápido
    const validValues = indicadores
      .filter(ind => ind.categoria === categoria)
      .map(ind => ind.termo_customizado);
    
    input.dataset.validValues = JSON.stringify(validValues);
    
    // Cria um wrapper para o dropdown customizado
    if (!input.parentElement.classList.contains('custom-datalist-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'custom-datalist-wrapper';
      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(input);
      
      const dropdown = document.createElement('div');
      dropdown.className = 'custom-datalist-dropdown';
      dropdown.style.display = 'none';
      wrapper.appendChild(dropdown);
    }
    
    const wrapper = input.parentElement;
    const dropdown = wrapper.querySelector('.custom-datalist-dropdown');
    
    // Função para mostrar dropdown
    const showDropdown = () => {
      const validValues = JSON.parse(input.dataset.validValues || '[]');
      const filterValue = input.value.toLowerCase();
      
      // Filtra valores baseado no que foi digitado
      const filtered = validValues.filter(v => 
        v.toLowerCase().includes(filterValue)
      );
      
      if (filtered.length === 0) {
        dropdown.style.display = 'none';
        return;
      }
      
      dropdown.innerHTML = '';
      filtered.forEach(value => {
        const option = document.createElement('div');
        option.className = 'custom-datalist-option';
        option.textContent = value;
        
        const doSelect = (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          input.value = value;
          dropdown.style.display = 'none';
          
          // Para o campo de motivo, dispara o botão de adicionar automaticamente
          if (inputId === 'cad-motivo-input') {
            const btnAddMotivo = document.getElementById('btn-add-motivo');
            if (btnAddMotivo) {
              setTimeout(() => btnAddMotivo.click(), 50);
            }
          } else {
            input.blur();
          }
          
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        };
        
        // Desktop: mousedown captura antes do blur
        option.addEventListener('mousedown', doSelect);
        
        // Mobile: rastreia se houve scroll entre touchstart e touchend
        // Se o dedo se moveu mais de 8px, é scroll — não seleciona
        let touchStartY = 0;
        let touchStartX = 0;
        
        option.addEventListener('touchstart', (e) => {
          touchStartY = e.touches[0].clientY;
          touchStartX = e.touches[0].clientX;
        }, { passive: true });
        
        option.addEventListener('touchend', (e) => {
          const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
          const dx = Math.abs(e.changedTouches[0].clientX - touchStartX);
          if (dy > 8 || dx > 8) return; // era scroll, ignora
          doSelect(e);
        }, { passive: false });
        
        dropdown.appendChild(option);
      });
      
      dropdown.style.display = 'block';
    };
    
    // Função para esconder dropdown
    const hideDropdown = () => {
      setTimeout(() => {
        // Não esconde se o usuário está clicando em uma opção
        if (!dropdown.matches(':hover')) {
          dropdown.style.display = 'none';
        }
      }, 300);
    };
    
    // Eventos do input
    input.addEventListener('focus', showDropdown);
    input.addEventListener('input', showDropdown);
    input.addEventListener('blur', hideDropdown);
    
    // Previne scroll quando dropdown está aberto
    input.addEventListener('touchstart', (e) => {
      if (dropdown.style.display === 'block') {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Validação ao sair do campo
    input.addEventListener('blur', function() {
      const validValues = JSON.parse(this.dataset.validValues || '[]');
      const val = this.value;
      
      // Se o campo está vazio ou é um valor válido, OK
      if (val === '' || validValues.includes(val)) {
        this.setCustomValidity('');
        return;
      }
      
      // Permite novos cadastros (valores não na lista)
      this.setCustomValidity('');
    });
  });
  
  // Fecha todos os dropdowns quando clicar fora
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-datalist-wrapper')) {
      document.querySelectorAll('.custom-datalist-dropdown').forEach(dd => {
        dd.style.display = 'none';
      });
    }
  });
}

function populateFilterSelects(indicadores) {
  const populate = (selectId, categoria, defaultLabel = 'Todos') => {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const currentVal = sel.value;
    const items = indicadores.filter(x => x.categoria === categoria && x.exibir_nos_graficos !== false);

    sel.innerHTML = `<option value="Todos">${defaultLabel}</option>`;
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.termo_customizado;
      opt.textContent = item.termo_customizado;
      sel.appendChild(opt);
    });
    sel.value = currentVal || 'Todos';
  };

  populate('filter-segmento', 'SEGMENTO');
  populate('filter-servico', 'SERVICO');
  populate('filter-modelista', 'MODELISTA');
  populate('filter-pilotista', 'PILOTISTA', 'Todas as Pilotistas');

  // Popular seletor de pessoas na conversão de repilotagem
  const selTipo = document.getElementById('filter-repilotagem-tipo');
  if (selTipo) {
    populateRepilotagemPessoaSelect(selTipo.value, indicadores);
  }
}

async function updatePendingBadge() {
  const res = await apiGet('get_pending_count', { usuario: state.currentUser ? state.currentUser.usuario : '' });
  const count = (res && res.success && res.data) ? res.data.count : 0;
  const badgeSidebar = document.getElementById('pending-badge');
  const badgeHeader = document.getElementById('aprovacao-count-badge');
  if (badgeSidebar) badgeSidebar.textContent = count;
  if (badgeHeader) badgeHeader.textContent = count;
}

// =============================================================================
// ETAPA 2: GERENCIAMENTO DE METAS CONFIGURÁVEIS
// =============================================================================
function loadSavedMetas() {
  const saved = localStorage.getItem(CONFIG.CACHE_KEY_METAS);
  if (saved) {
    try {
      state.metas = Object.assign({}, state.metas, JSON.parse(saved));
    } catch (e) {
      console.warn('Erro ao carregar metas salvas:', e);
    }
  }

  // Preencher formulário de metas na aba Configurações
  const inpApr = document.getElementById('meta-input-aprovada');
  const inpRep = document.getElementById('meta-input-repilotagem');
  const inpRpv = document.getElementById('meta-input-reprovada');

  if (inpApr) inpApr.value = state.metas.aprovada;
  if (inpRep) inpRep.value = state.metas.repilotagem;
  if (inpRpv) inpRpv.value = state.metas.reprovada;
}

function initMetasForm() {
  const form = document.getElementById('form-config-metas');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const apr = parseFloat(document.getElementById('meta-input-aprovada').value) || 80;
      const rep = parseFloat(document.getElementById('meta-input-repilotagem').value) || 15;
      const rpv = parseFloat(document.getElementById('meta-input-reprovada').value) || 5;

      state.metas = {
        aprovada: apr,
        repilotagem: rep,
        reprovada: rpv
      };

      localStorage.setItem(CONFIG.CACHE_KEY_METAS, JSON.stringify(state.metas));
      showToast('Metas estratégicas salvas com sucesso!', 'success');

      // Atualizar KPIs do dashboard imediatamente
      if (state.lastDashboardData) {
        updateKpisWithMetas(state.lastDashboardData.kpis);
      }
    });
  }
}

function updateKpisWithMetas(kpis = {}) {
  const total = kpis.total || 0;
  const piloto = kpis.piloto || 0;
  const repilotagens = kpis.repilotagens || 0;
  const aprovadas = kpis.aprovadas || 0;
  const reprovadas = kpis.reprovadas || 0;
  const standby = kpis.standby || 0;

  // 1. Total
  setKpiValue('kpi-total', total);

  // 2. Piloto
  setKpiValue('kpi-piloto', piloto);
  const pctPiloto = total > 0 ? ((piloto / total) * 100).toFixed(1) : '0.0';
  const badgePiloto = document.getElementById('meta-piloto-badge');
  if (badgePiloto) badgePiloto.textContent = `${pctPiloto}% do total`;

  // 3. Repilotagens (Meta: ≤ 15%)
  setKpiValue('kpi-repilotagens', repilotagens);
  const pctRep = total > 0 ? ((repilotagens / total) * 100).toFixed(1) : '0.0';
  const pctRepEl = document.getElementById('kpi-repilotagem-pct');
  const badgeRep = document.getElementById('meta-repilotagem-badge');
  if (pctRepEl) pctRepEl.textContent = `${pctRep}%`;
  if (badgeRep) {
    badgeRep.textContent = `Meta: ≤ ${state.metas.repilotagem}%`;
    const numPctRep = parseFloat(pctRep);
    if (numPctRep <= state.metas.repilotagem) {
      badgeRep.className = 'kpi-meta-badge success';
    } else {
      badgeRep.className = 'kpi-meta-badge danger';
    }
  }

  // 4. Aprovadas (Meta: ≥ 80%)
  setKpiValue('kpi-aprovadas', aprovadas);
  const pctApr = total > 0 ? ((aprovadas / total) * 100).toFixed(1) : '0.0';
  const pctAprEl = document.getElementById('kpi-aprovada-pct');
  const badgeApr = document.getElementById('meta-aprovada-badge');
  if (pctAprEl) pctAprEl.textContent = `${pctApr}%`;
  if (badgeApr) {
    badgeApr.textContent = `Meta: ≥ ${state.metas.aprovada}%`;
    const numPctApr = parseFloat(pctApr);
    if (numPctApr >= state.metas.aprovada) {
      badgeApr.className = 'kpi-meta-badge success';
    } else {
      badgeApr.className = 'kpi-meta-badge danger';
    }
  }

  // 5. Reprovadas (Meta: ≤ 5%)
  setKpiValue('kpi-reprovadas', reprovadas);
  const pctRpv = total > 0 ? ((reprovadas / total) * 100).toFixed(1) : '0.0';
  const pctRpvEl = document.getElementById('kpi-reprovada-pct');
  const badgeRpv = document.getElementById('meta-reprovada-badge');
  if (pctRpvEl) pctRpvEl.textContent = `${pctRpv}%`;
  if (badgeRpv) {
    badgeRpv.textContent = `Meta: ≤ ${state.metas.reprovada}%`;
    const numPctRpv = parseFloat(pctRpv);
    if (numPctRpv <= state.metas.reprovada) {
      badgeRpv.className = 'kpi-meta-badge success';
    } else {
      badgeRpv.className = 'kpi-meta-badge danger';
    }
  }

  // 6. Standby
  setKpiValue('kpi-standby', standby);
  const pctStb = total > 0 ? ((standby / total) * 100).toFixed(1) : '0.0';
  const pctStbEl = document.getElementById('kpi-standby-pct');
  if (pctStbEl) pctStbEl.textContent = `${pctStb}% do total`;

  // 7. Em Repilotagem (OPs com situação REPILOTAGEM — ainda em andamento)
  const emRepilotagem = kpis.em_repilotagem || 0;
  setKpiValue('kpi-em-repilotagem', emRepilotagem);
  const pctEmRep = total > 0 ? ((emRepilotagem / total) * 100).toFixed(1) : '0.0';
  const pctEmRepEl = document.getElementById('kpi-em-repilotagem-pct');
  if (pctEmRepEl) pctEmRepEl.textContent = `${pctEmRep}% do total`;
}

function setKpiValue(cardId, value) {
  const card = document.getElementById(cardId);
  if (card) {
    const valEl = card.querySelector('.kpi-value');
    if (valEl) valEl.textContent = value;
  }
}

// =============================================================================
// ETAPA 5: FORMULÁRIO DE CADASTRO E AUTO-SUGESTÃO
// =============================================================================
function initCadastroForm() {
  const form = document.getElementById('form-cadastro');
  const cadOp = document.getElementById('cad-op');
  const btnAddMotivo = document.getElementById('btn-add-motivo');
  const motivoInput = document.getElementById('cad-motivo-input');
  const cadEtapa = document.getElementById('cad-etapa');
  const groupServico = document.getElementById('group-cad-servico');
  const cadServico = document.getElementById('cad-servico');

  setupCadastroFormDefaults();

  // Mostrar/ocultar campo Serviço: aparece apenas quando etapa ≠ PILOTO
  function updateServicoVisibility() {
    if (!cadEtapa || !groupServico) return;
    const etapa = cadEtapa.value.toUpperCase();
    const isPiloto = etapa === 'PILOTO' || etapa === '';
    groupServico.style.display = isPiloto ? 'none' : '';
    if (cadServico) {
      cadServico.required = !isPiloto;
      if (isPiloto) cadServico.value = '';
    }
  }

  if (cadEtapa) {
    cadEtapa.addEventListener('change', updateServicoVisibility);
    updateServicoVisibility();
  }

  // Auto-preenchimento ao digitar número da OP (busca em todas as OPs cadastradas)
  if (cadOp) {
    cadOp.addEventListener('blur', async () => {
      const opVal = cadOp.value.trim();
      if (!opVal) return;

      // Buscar OP existente nos dados
      const allOps = [...MOCK_DATA.ops_aprovadas, ...MOCK_DATA.ops_pendentes];
      const opExistente = allOps.find(x => String(x.op).trim() === String(opVal).trim());

      if (opExistente) {
        // Preencher campos automaticamente (exceto situação)
        const fields = {
          'cad-referencia': opExistente.referencia,
          'cad-segmento': opExistente.segmento,
          'cad-modelista': opExistente.modelista,
          'cad-pilotista': opExistente.pilotista
        };
        Object.entries(fields).forEach(([id, val]) => {
          const el = document.getElementById(id);
          if (el && val) el.value = val;
        });

        // Sugerir etapa
        const res = await apiGet('get_etapa_sugerida', { op: opVal, usuario: state.currentUser ? state.currentUser.usuario : '' });
        if (res && res.success && res.data && res.data.etapa) {
          const selectEtapa = document.getElementById('cad-etapa');
          if (selectEtapa) {
            let exists = false;
            for (let i = 0; i < selectEtapa.options.length; i++) {
              if (selectEtapa.options[i].value === res.data.etapa) { exists = true; break; }
            }
            if (!exists) {
              const opt = document.createElement('option');
              opt.value = res.data.etapa;
              opt.textContent = res.data.etapa;
              selectEtapa.appendChild(opt);
            }
            selectEtapa.value = res.data.etapa;
            updateServicoVisibility();
          }
        }

        // Mostrar helper informando o preenchimento
        const helper = document.getElementById('cad-op-helper');
        if (helper) {
          helper.textContent = `OP encontrada — dados preenchidos automaticamente. Defina a situação.`;
          helper.style.color = 'var(--color-primary)';
        }
        showToast(`OP ${opVal} encontrada — dados preenchidos!`, 'warning');
      } else {
        // OP nova: apenas sugerir etapa
        const res = await apiGet('get_etapa_sugerida', { op: opVal, usuario: state.currentUser ? state.currentUser.usuario : '' });
        if (res && res.success && res.data && res.data.etapa) {
          const selectEtapa = document.getElementById('cad-etapa');
          if (selectEtapa) {
            let exists = false;
            for (let i = 0; i < selectEtapa.options.length; i++) {
              if (selectEtapa.options[i].value === res.data.etapa) { exists = true; break; }
            }
            if (!exists) {
              const opt = document.createElement('option');
              opt.value = res.data.etapa;
              opt.textContent = res.data.etapa;
              selectEtapa.appendChild(opt);
            }
            selectEtapa.value = res.data.etapa;
            updateServicoVisibility();
            showToast(`Etapa sugerida: ${res.data.etapa}`, 'warning');
          }
        }
        const helper = document.getElementById('cad-op-helper');
        if (helper) {
          helper.textContent = '';
        }
      }
    });
  }

  // Adicionar Motivo Tag
  const addMotivoTag = () => {
    const val = (motivoInput.value || '').trim();
    if (!val) return;

    if (!state.motivosTags.includes(val)) {
      state.motivosTags.push(val);
      renderMotivosTags();
    }
    motivoInput.value = '';
    
    // Esconde dropdown customizado se existir
    const dropdown = motivoInput.parentElement?.querySelector('.custom-datalist-dropdown');
    if (dropdown) {
      dropdown.style.display = 'none';
    }
    
    motivoInput.focus();
  };

  if (btnAddMotivo) {
    btnAddMotivo.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      addMotivoTag();
    });
  }

  if (motivoInput) {
    motivoInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addMotivoTag();
      }
    });
  }

  // Salvar OP
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const op = document.getElementById('cad-op').value.trim();
      const referencia = document.getElementById('cad-referencia').value.trim();
      const segmento = document.getElementById('cad-segmento').value.trim();
      const etapa = document.getElementById('cad-etapa').value.trim();
      const isPiloto = etapa.toUpperCase() === 'PILOTO';
      const servico = isPiloto ? '' : document.getElementById('cad-servico').value.trim();
      const modelista = document.getElementById('cad-modelista').value.trim();
      const pilotista = document.getElementById('cad-pilotista').value.trim();
      const situacao = document.getElementById('cad-situacao').value.trim();
      const observacao = document.getElementById('cad-observacao').value.trim();
      const dataProva = document.getElementById('cad-data').value;
      const hora = document.getElementById('cad-hora').value;

      if (!op || !referencia || !segmento || !etapa || !modelista || !pilotista || !situacao) {
        showToast('Por favor, preencha todos os campos obrigatórios (*)', 'error');
        return;
      }
      if (!isPiloto && !servico) {
        showToast('Por favor, preencha o campo Serviço para repilotagens', 'error');
        return;
      }

      const payload = {
        data_prova: formatDateBR(dataProva),
        hora_cadastro: hora ? hora + ':00' : formatTimeNow() + ':00',
        usuario_cadastro: state.currentUser ? state.currentUser.nome : 'Usuário',
        op,
        referencia,
        segmento,
        etapa,
        servico,
        modelista,
        pilotista,
        situacao,
        motivos: state.motivosTags.join('||'),
        observacao
      };

      const res = await apiPost('cadastrar_op', payload);
      if (res && res.success) {
        showToast(res.message || 'OP cadastrada com sucesso! Aguardando aprovação.', 'success');
        form.reset();
        state.motivosTags = [];
        renderMotivosTags();
        setupCadastroFormDefaults();
        updateServicoVisibility();
        updatePendingBadge();
        const helper = document.getElementById('cad-op-helper');
        if (helper) helper.textContent = '';
      } else {
        showToast((res && res.message) || 'Erro ao cadastrar OP', 'error');
      }
    });
  }
}

function setupCadastroFormDefaults() {
  const cadData = document.getElementById('cad-data');
  const cadHora = document.getElementById('cad-hora');
  const cadUser = document.getElementById('cad-usuario');

  if (cadData) cadData.value = formatDateNowISO();
  if (cadHora) cadHora.value = formatTimeNow();
  if (cadUser && state.currentUser) cadUser.value = state.currentUser.nome;
}

function renderMotivosTags() {
  const container = document.getElementById('motivos-tags');
  if (!container) return;

  container.innerHTML = '';
  state.motivosTags.forEach((m, idx) => {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.innerHTML = `
      <span>${escapeHTML(m)}</span>
      <button type="button" class="remove-tag" data-index="${idx}" aria-label="Remover motivo">&times;</button>
    `;
    container.appendChild(chip);
  });

  container.querySelectorAll('.remove-tag').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const i = parseInt(e.currentTarget.getAttribute('data-index'), 10);
      state.motivosTags.splice(i, 1);
      renderMotivosTags();
    });
  });
}

// =============================================================================
// DASHBOARD & INDICADORES (ETAPAS 1, 2, 3 E 4)
// =============================================================================
function initDashboard() {
  const btnAplicar = document.getElementById('btn-aplicar-filtros');
  const btnLimpar = document.getElementById('btn-limpar-filtros');
  const toggleModelista = document.getElementById('toggle-modelista-chart');
  const togglePilotista = document.getElementById('toggle-pilotista-chart');
  const btnImprimir = document.getElementById('btn-imprimir');
  const selTipoConv = document.getElementById('filter-repilotagem-tipo');
  const selPessoaConv = document.getElementById('filter-repilotagem-pessoa');

  if (btnAplicar) {
    btnAplicar.addEventListener('click', () => loadDashboard());
  }

  if (btnLimpar) {
    btnLimpar.addEventListener('click', () => {
      document.getElementById('filter-data-inicio').value = '';
      document.getElementById('filter-data-fim').value = '';
      document.getElementById('filter-segmento').value = 'Todos';
      document.getElementById('filter-etapa').value = 'Todas';
      document.getElementById('filter-servico').value = 'Todos';
      document.getElementById('filter-modelista').value = 'Todos';
      document.getElementById('filter-pilotista').value = 'Todos';
      loadDashboard();
    });
  }

  if (toggleModelista) {
    toggleModelista.addEventListener('change', (e) => {
      state.modelistaStacked = e.target.checked;
      if (state.lastDashboardData) {
        renderModelistaChart(state.lastDashboardData.modelistas);
      }
    });
  }

  if (togglePilotista) {
    togglePilotista.addEventListener('change', (e) => {
      state.pilotistaStacked = e.target.checked;
      if (state.lastDashboardData) {
        renderPilotistaChart(state.lastDashboardData.pilotistas);
      }
    });
  }

  // Filtro de tipo (Todos / Modelista / Pilotista) na Conversão de Repilotagens
  if (selTipoConv) {
    selTipoConv.addEventListener('change', (e) => {
      populateRepilotagemPessoaSelect(e.target.value);
      if (selPessoaConv) selPessoaConv.value = 'Todos';
      if (state.lastDashboardData) {
        recalculateAndRenderRepilotagemEfficiency(
          state.lastDashboardData.raw_ops,
          e.target.value,
          'Todos'
        );
      }
    });
  }

  if (selPessoaConv) {
    selPessoaConv.addEventListener('change', (e) => {
      const tipo = selTipoConv ? selTipoConv.value : 'Todos';
      if (state.lastDashboardData) {
        recalculateAndRenderRepilotagemEfficiency(
          state.lastDashboardData.raw_ops,
          tipo,
          e.target.value
        );
      }
    });
  }

  if (btnImprimir) {
    btnImprimir.addEventListener('click', prepareAndPrintReport);
  }

  initObservacoesPanel();
}

// Converte data de yyyy-mm-dd (formato HTML input[type=date]) para dd/MM/yyyy (formato BR)
function isoToBR(isoDate) {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

async function loadDashboard() {
  const filters = {
    data_inicio: isoToBR(document.getElementById('filter-data-inicio').value),
    data_fim: isoToBR(document.getElementById('filter-data-fim').value),
    segmento: document.getElementById('filter-segmento').value,
    etapa: document.getElementById('filter-etapa').value,
    servico: document.getElementById('filter-servico').value,
    modelista: document.getElementById('filter-modelista').value,
    pilotista: (document.getElementById('filter-pilotista') || {}).value || 'Todos'
  };

  const res = await apiGet('get_dashboard_data', { ...filters, usuario: state.currentUser ? state.currentUser.usuario : '' });
  if (res && res.success && res.data) {
    state.lastDashboardData = res.data;
    renderDashboard(res.data, filters);
  } else {
    showToast('Não foi possível carregar os dados do painel.', 'error');
  }
}

function renderDashboard(data, filters) {
  // 1. Atualizar KPIs com Metas (ETAPA 2)
  updateKpisWithMetas(data.kpis || {});

  // 2. Resumo por Segmento
  renderResumoSegmentoTable(data.resumo_segmento || []);

  // 3. Gráficos de Pareto com Headroom no Eixo Y (ETAPA 3)
  renderParetoChart('chart-pareto-repilotagem', 'tabela-pareto-repilotagem', 'Repilotagem', data.pareto_repilotagem || []);
  renderParetoChart('chart-pareto-reprovacao', 'tabela-pareto-reprovacao', 'Reprovação', data.pareto_reprovacao || []);
  renderParetoChart('chart-pareto-aprovacao-ajustes', 'tabela-pareto-aprovacao-ajustes', 'Aprovação com Ajustes', data.pareto_aprovacao_ajustes || []);

  // 4. Modelistas sem Lacunas Vazias (ETAPA 3)
  renderModelistaChart(data.modelistas || []);

  // 4b. Pilotistas
  renderPilotistaChart(data.pilotistas || []);

  // 5. Eficiência de Repilotagens (ETAPA 3)
  const selTipo = document.getElementById('filter-repilotagem-tipo');
  const selPessoa = document.getElementById('filter-repilotagem-pessoa');
  const tipo = selTipo ? selTipo.value : 'Todos';
  const pessoa = selPessoa ? selPessoa.value : 'Todos';
  recalculateAndRenderRepilotagemEfficiency(data.raw_ops || [], tipo, pessoa);

  // 6. Painel Avançado de Observações (ETAPA 4)
  renderObservacoesAnalysis(data.raw_ops || []);

  // 7. Cabeçalho Oficial com Logo à Esquerda (ETAPA 1)
  updateReportHeaderInfo(filters);
}

function renderResumoSegmentoTable(rows) {
  const tbody = document.querySelector('#tabela-resumo-segmento tbody');
  const tfoot = document.querySelector('#tabela-resumo-segmento tfoot');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="13" class="text-center" style="padding:1rem;">Nenhum dado encontrado para os filtros selecionados.</td></tr>';
    if (tfoot) tfoot.innerHTML = '';
    return;
  }

  let totOP = 0, totPil = 0, totApr = 0, totEmRep = 0, totRep = 0, totReprov = 0, totStb = 0;

  rows.forEach(r => {
    totOP     += Number(r.total);
    totPil    += Number(r.piloto);
    totApr    += Number(r.aprovadas);
    totEmRep  += Number(r.em_repilotagem || 0);
    totRep    += Number(r.repilotagem);
    totReprov += Number(r.reprovadas);
    totStb    += Number(r.standby);

    // Calcular percentuais localmente caso o backend não os envie
    const tot = Number(r.total) || 0;
    const pctLocal = (val) => tot > 0 ? ((Number(val) / tot) * 100).toFixed(1) : '0.0';
    const pAprovadas   = r.pct_aprovadas   != null ? r.pct_aprovadas   : pctLocal(r.aprovadas);
    const pEmRep       = tot > 0 ? (((r.em_repilotagem || 0) / tot) * 100).toFixed(1) : '0.0';
    const pRepilotagem = r.pct_repilotagem != null ? r.pct_repilotagem : pctLocal(r.repilotagem);
    const pReprovadas  = r.pct_reprovadas  != null ? r.pct_reprovadas  : pctLocal(r.reprovadas);
    const pStandby     = r.pct_standby     != null ? r.pct_standby     : pctLocal(r.standby);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHTML(r.segmento)}</strong></td>
      <td class="num-col">${r.total}</td>
      <td class="num-col">${r.piloto}</td>
      <td class="num-col">${r.aprovadas}</td>
      <td class="num-col">${pAprovadas}%</td>
      <td class="num-col">${r.em_repilotagem || 0}</td>
      <td class="num-col">${pEmRep}%</td>
      <td class="num-col">${r.repilotagem}</td>
      <td class="num-col">${pRepilotagem}%</td>
      <td class="num-col">${r.reprovadas}</td>
      <td class="num-col">${pReprovadas}%</td>
      <td class="num-col">${r.standby}</td>
      <td class="num-col">${pStandby}%</td>
    `;
    tbody.appendChild(tr);
  });

  if (tfoot) {
    const pct = (val) => totOP > 0 ? ((val / totOP) * 100).toFixed(1) + '%' : '0.0%';
    tfoot.innerHTML = `
      <tr class="total-row">
        <th scope="row">TOTAL</th>
        <td class="num-col">${totOP}</td>
        <td class="num-col">${totPil}</td>
        <td class="num-col">${totApr}</td>
        <td class="num-col">${pct(totApr)}</td>
        <td class="num-col">${totEmRep}</td>
        <td class="num-col">${pct(totEmRep)}</td>
        <td class="num-col">${totRep}</td>
        <td class="num-col">${pct(totRep)}</td>
        <td class="num-col">${totReprov}</td>
        <td class="num-col">${pct(totReprov)}</td>
        <td class="num-col">${totStb}</td>
        <td class="num-col">${pct(totStb)}</td>
      </tr>
    `;
  }
}

// Normalizar itens de Pareto para garantir todas as propriedades necessárias (código, porcentagens, acumulado)
function normalizeParetoItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];
  const total = rawItems.reduce((sum, it) => sum + (Number(it.quantidade) || 0), 0);
  let cum = 0;
  return rawItems.map((it, idx) => {
    const qtd = Number(it.quantidade) || 0;
    cum += qtd;
    const pctAcum = total > 0 ? Math.round((cum / total) * 100) : 0;
    const pctNum = total > 0 ? (qtd / total) * 100 : 0;
    const pctIndiv = (pctNum % 1 === 0 ? pctNum.toFixed(0) : pctNum.toFixed(1)) + '%';
    return {
      codigo: it.codigo || `M${idx + 1}`,
      motivo: it.motivo || '',
      quantidade: qtd,
      pctIndividual: it.pctIndividual || pctIndiv,
      pctAcumulado: typeof it.pctAcumulado === 'number' ? it.pctAcumulado : pctAcum
    };
  });
}

// ETAPA 3: Renderização dos Paretos com FOLGA NO EIXO Y (Headroom) e RÓTULOS (quantidade / %)
function renderParetoChart(canvasId, tableId, title, rawItems) {
  const canvas = document.getElementById(canvasId);
  const table = document.getElementById(tableId);
  if (!canvas) return;

  if (state.charts[canvasId]) {
    state.charts[canvasId].destroy();
  }

  // Normalização de dados completa e defensiva
  const items = normalizeParetoItems(rawItems || []);

  if (table) {
    const tbody = table.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = '';
      if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">Nenhum motivo registrado</td></tr>';
      } else {
        items.forEach(it => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><strong>${escapeHTML(it.codigo)}</strong> - ${escapeHTML(it.motivo)}</td>
            <td class="num-col" style="text-align: right;">${it.quantidade}</td>
            <td class="num-col" style="text-align: right;">${it.pctIndividual}</td>
          `;
          tbody.appendChild(tr);
        });
      }
    }
  }

  if (typeof Chart === 'undefined') {
    return;
  }

  const labels = items.map(x => x.codigo);
  const dataBarras = items.map(x => x.quantidade);
  const dataLinha = items.map(x => x.pctAcumulado);

  // Folga superior confortável (Headroom) para não cortar rótulos nem encostar no topo
  const maxQtd = Math.max(...dataBarras, 0);
  const suggestedMaxQtd = maxQtd > 0 ? Math.ceil(maxQtd * 1.35) + 1 : 5;

  // Plugin Inline para desenhar "quantidade / percentual%" acima de cada barra com halo branco
  const paretoBarLabelsPlugin = {
    id: `paretoBarLabels_${canvasId}`,
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const barDatasetIndex = chart.data.datasets.findIndex(d => d.type === 'bar');
      if (barDatasetIndex === -1) return;
      const meta = chart.getDatasetMeta(barDatasetIndex);
      if (!meta || meta.hidden) return;

      ctx.save();
      ctx.font = 'bold 9.5px Arial, Helvetica, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#0f172a';

      meta.data.forEach((bar, index) => {
        const it = items[index];
        if (it && it.quantidade > 0) {
          const text = `${it.quantidade} / ${it.pctIndividual}`;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.strokeText(text, bar.x, bar.y - 3);
          ctx.fillText(text, bar.x, bar.y - 3);
        }
      });
      ctx.restore();
    }
  };

  const ctx = canvas.getContext('2d');
  state.charts[canvasId] = new Chart(ctx, {
    type: 'bar',
    plugins: [paretoBarLabelsPlugin],
    data: {
      labels: labels,
      datasets: [
        {
          type: 'line',
          label: '% Acumulado',
          data: dataLinha,
          borderColor: '#ef4444',
          backgroundColor: '#ef4444',
          borderWidth: 2,
          pointRadius: 3,
          yAxisID: 'yPct'
        },
        {
          type: 'bar',
          label: 'Quantidade',
          data: dataBarras,
          backgroundColor: '#0ea5e9',
          borderWidth: 0,
          yAxisID: 'yQtd',
          barPercentage: 0.55
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 14,
          bottom: 2,
          left: 4,
          right: 4
        }
      },
      plugins: {
        title: {
          display: true,
          text: title,
          align: 'start',
          font: { size: 13, weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            boxWidth: 12,
            font: { size: 10 },
            padding: 4
          }
        },
        tooltip: {
          callbacks: {
            title: (ctxList) => {
              const idx = ctxList[0].dataIndex;
              return `${items[idx].codigo} - ${items[idx].motivo}`;
            },
            label: (ctxItem) => {
              if (ctxItem.dataset.type === 'bar') {
                const it = items[ctxItem.dataIndex];
                return `Quantidade: ${ctxItem.parsed.y} (${it.pctIndividual} do total)`;
              }
              return `% Acumulado: ${ctxItem.parsed.y}%`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 } },
          title: {
            display: true,
            text: 'Motivos conforme legenda abaixo',
            font: { size: 10, style: 'italic' },
            padding: { top: 2, bottom: 0 }
          }
        },
        yQtd: {
          type: 'linear',
          position: 'left',
          beginAtZero: true,
          suggestedMax: suggestedMaxQtd,
          grace: 1,
          title: {
            display: true,
            text: 'Quantidade',
            font: { size: 10 }
          },
          ticks: {
            precision: 0,
            font: { size: 10 }
          }
        },
        yPct: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: '% Acumulado',
            font: { size: 10 }
          },
          ticks: {
            stepSize: 50,
            callback: (v) => v,
            font: { size: 10 }
          },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

// ETAPA 3: Gráfico de Desempenho por Modelista sem Lacunas Vazias (Barras Agrupadas Vizinhas)
// Função utilitária compartilhada para gráficos de Modelista e Pilotista
function renderDesempenhoChart({ canvasId, chartKey, stacked, pessoas, pessoaKey }) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return;

  if (state.charts[chartKey]) {
    state.charts[chartKey].destroy();
    state.charts[chartKey] = null;
  }

  const ctx = canvas.getContext('2d');

  const datasetsConfig = [
    { key: 'aprovada',         label: 'Aprovada',            color: '#16A34A' },
    { key: 'aprovada_ajustes', label: 'Aprovada c/ Ajustes', color: '#38BDF8' },
    { key: 'reprovada',        label: 'Reprovada',           color: '#DC2626' },
    { key: 'repilotagem',      label: 'Repilotagem',         color: '#D97706' },
    { key: 'standby',          label: 'Standby',             color: '#94A3B8' }
  ];

  // Labels categóricos — nome de cada pessoa
  const labels = pessoas.map(x => x[pessoaKey]);

  // Calcula totais por pessoa para o plugin de rótulos
  const totaisPorPessoa = pessoas.map(p =>
    datasetsConfig.reduce((s, c) => s + (p[c.key] || 0), 0)
  );

  // Plugin: desenha o valor em cima de cada barra (agrupado) ou total (empilhado)
  const labelsPlugin = {
    id: `${chartKey}Labels`,
    afterDatasetsDraw(chart) {
      const { ctx: c } = chart;
      c.save();
      c.font = 'bold 11px Arial, Helvetica, sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'bottom';
      c.fillStyle = '#0f172a';

      if (stacked) {
        // No modo empilhado: um rótulo de total acima da coluna inteira
        const metaList = chart.data.datasets.map((_, i) => chart.getDatasetMeta(i));
        labels.forEach((_, idx) => {
          const total = totaisPorPessoa[idx];
          if (!total) return;
          let topY = null, barX = null;
          for (let d = metaList.length - 1; d >= 0; d--) {
            const meta = metaList[d];
            if (meta?.data[idx] && !meta.hidden && chart.data.datasets[d].data[idx] > 0) {
              topY = meta.data[idx].y;
              barX = meta.data[idx].x;
              break;
            }
          }
          if (topY !== null) {
            c.strokeStyle = '#ffffff'; c.lineWidth = 3;
            c.strokeText(`${total}`, barX, topY - 3);
            c.fillText(`${total}`, barX, topY - 3);
          }
        });
      } else {
        // No modo agrupado: valor em cima de cada barra individual
        chart.data.datasets.forEach((ds, dsIdx) => {
          const meta = chart.getDatasetMeta(dsIdx);
          if (!meta || meta.hidden) return;
          meta.data.forEach((bar, ptIdx) => {
            const val = ds.data[ptIdx];
            if (val > 0 && bar?.x !== undefined) {
              c.strokeStyle = '#ffffff'; c.lineWidth = 3;
              c.strokeText(`${val}`, bar.x, bar.y - 3);
              c.fillText(`${val}`, bar.x, bar.y - 3);
            }
          });
        });
      }
      c.restore();
    }
  };

  // Plugin: linhas divisórias verticais entre cada pessoa (modo agrupado)
  const separatorPlugin = {
    id: `${chartKey}Separators`,
    afterDraw(chart) {
      if (stacked) return; // Não precisa no empilhado (eixo categórico já separa)
      const { ctx: c, chartArea, scales } = chart;
      if (!chartArea || !scales.x) return;

      c.save();
      c.strokeStyle = '#E2E8F0';
      c.lineWidth = 1;
      c.setLineDash([4, 3]);

      // Uma linha entre cada par de categorias
      for (let i = 0; i < labels.length - 1; i++) {
        // Ponto médio entre o centro de i e o centro de i+1
        const xI  = scales.x.getPixelForValue(i);
        const xI1 = scales.x.getPixelForValue(i + 1);
        const xMid = (xI + xI1) / 2;

        c.beginPath();
        c.moveTo(xMid, chartArea.top);
        c.lineTo(xMid, chartArea.bottom);
        c.stroke();
      }

      c.setLineDash([]);
      c.restore();
    }
  };

  const maxVal = stacked
    ? Math.max(...totaisPorPessoa, 0)
    : Math.max(...datasetsConfig.flatMap(cfg => pessoas.map(p => p[cfg.key] || 0)), 0);
  const suggestedMax = Math.ceil(maxVal * 1.35) + 1;

  state.charts[chartKey] = new Chart(ctx, {
    type: 'bar',
    plugins: [labelsPlugin, separatorPlugin],
    data: {
      labels,
      datasets: datasetsConfig.map(cfg => ({
        label: cfg.label,
        data: pessoas.map(p => p[cfg.key] || 0),
        backgroundColor: cfg.color,
        // No empilhado todas as barras formam uma coluna; no agrupado ficam lado a lado
        ...(stacked ? { stack: 'stack1' } : {}),
        // Agrupado: barras bem mais estreitas para o grupo não parecer largo demais
        barPercentage:      stacked ? 0.70 : 0.55,
        categoryPercentage: stacked ? 0.80 : 0.75
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 22, bottom: 2, left: 4, right: 4 } },
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            title:  (items) => items[0].label,
            label:  (item)  => ` ${item.dataset.label}: ${item.raw}`,
            footer: (items) => {
              const total = totaisPorPessoa[items[0].dataIndex];
              return `Total: ${total}`;
            }
          }
        }
      },
      scales: {
        x: {
          stacked: stacked,
          grid: { display: false },
          ticks: {
            maxRotation: 40,
            minRotation: 20,
            autoSkip: false,
            font: { size: 11 }
          }
        },
        y: {
          stacked: stacked,
          beginAtZero: true,
          suggestedMax,
          grace: 1,
          title: { display: true, text: 'Quantidade de OPs' },
          ticks: { precision: 0 }
        }
      }
    }
  });
}

function renderModelistaChart(modelistas) {
  renderDesempenhoChart({
    canvasId: 'chart-modelista',
    chartKey: 'modelista',
    stacked: state.modelistaStacked,
    pessoas: modelistas,
    pessoaKey: 'modelista'
  });
}

// Gráfico de Desempenho por Pilotista (espelho do de Modelista)
function renderPilotistaChart(pilotistas) {
  renderDesempenhoChart({
    canvasId: 'chart-pilotista',
    chartKey: 'pilotista',
    stacked: state.pilotistaStacked,
    pessoas: pilotistas,
    pessoaKey: 'pilotista'
  });
}

// ETAPA 3: Recalcular e Renderizar Taxa de Conversão de Repilotagens com Filtro de Tipo e Pessoa
function recalculateAndRenderRepilotagemEfficiency(rawOps = [], tipo = 'Todos', pessoa = 'Todos') {
  let repOps = rawOps.filter(x => (x.etapa || '').toUpperCase().includes('REPILOTAGEM'));

  // Verificar se o campo relevante está preenchido nos dados
  const campoFiltro = tipo === 'Modelista' ? 'modelista' : tipo === 'Pilotista' ? 'pilotista' : null;
  const temDadosDeTipo = campoFiltro
    ? repOps.some(x => String(x[campoFiltro] || '').trim() !== '')
    : true;

  if (tipo === 'Modelista' && pessoa && pessoa !== 'Todos') {
    repOps = repOps.filter(x => (x.modelista || '').toUpperCase() === pessoa.toUpperCase());
  } else if (tipo === 'Pilotista' && pessoa && pessoa !== 'Todos') {
    repOps = repOps.filter(x => (x.pilotista || '').toUpperCase() === pessoa.toUpperCase());
  }

  const repTotal   = repOps.length;
  const repAprov   = repOps.filter(x => { const s = (x.situacao || '').toUpperCase(); return s === 'APROVADA' || s === 'APROVADA COM AJUSTES'; }).length;
  const repMantida = repOps.filter(x => (x.situacao || '').toUpperCase() === 'REPILOTAGEM').length;
  const repReprov  = repOps.filter(x => (x.situacao || '').toUpperCase() === 'REPROVADA').length;
  const repStandby = repOps.filter(x => (x.situacao || '').toUpperCase() === 'STANDBY').length;

  const pct = (n) => repTotal > 0 ? ((n / repTotal) * 100).toFixed(1) : '0.0';

  const canvas = document.getElementById('chart-repilotagem-rosca');

  // Helper para atualizar os 3 cards de KPI
  const updateCards = (aprov, reprov, mantida, total) => {
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('rep-aprovadas-valor',  aprov);
    setEl('rep-aprovadas-pct',    `${total > 0 ? ((aprov  / total) * 100).toFixed(1) : '0.0'}% das repilotagens`);
    setEl('rep-reprovadas-valor', reprov);
    setEl('rep-reprovadas-pct',   `${total > 0 ? ((reprov / total) * 100).toFixed(1) : '0.0'}% das repilotagens`);
    setEl('rep-mantida-valor',    mantida);
    setEl('rep-mantida-pct',      `${total > 0 ? ((mantida / total) * 100).toFixed(1) : '0.0'}% das repilotagens`);
  };

  // Se filtrou por tipo mas não há dados preenchidos para esse campo, mostrar aviso
  if (campoFiltro && !temDadosDeTipo) {
    updateCards('—', '—', '—', 0);
    if (canvas) {
      if (state.charts.repilotagemRosca) { state.charts.repilotagemRosca.destroy(); state.charts.repilotagemRosca = null; }
      const parent = canvas.parentElement;
      let aviso = parent.querySelector('.sem-dados-aviso');
      if (!aviso) {
        aviso = document.createElement('p');
        aviso.className = 'sem-dados-aviso';
        aviso.style.cssText = 'text-align:center;color:#94A3B8;padding:2rem 1rem;font-size:0.875rem;';
        parent.appendChild(aviso);
      }
      canvas.style.display = 'none';
      aviso.textContent = `Nenhum registro possui o campo "${tipo.toLowerCase()}" preenchido.`;
    }
    return;
  }

  // Restaurar canvas caso estivesse oculto
  if (canvas) {
    canvas.style.display = '';
    const aviso = canvas.parentElement?.querySelector('.sem-dados-aviso');
    if (aviso) aviso.remove();
  }

  updateCards(repAprov, repReprov, repMantida, repTotal);

  if (!canvas || typeof Chart === 'undefined') return;

  if (state.charts.repilotagemRosca) state.charts.repilotagemRosca.destroy();

  const ctx = canvas.getContext('2d');

  // Plugin inline: desenha valor + % na parte externa de cada fatia
  const doughnutLabelsPlugin = {
    id: 'repilotagemRoscaLabels',
    afterDraw(chart) {
      const { ctx: c, chartArea, data } = chart;
      const dataset = data.datasets[0];
      const meta    = chart.getDatasetMeta(0);
      const total   = dataset.data.reduce((s, v) => s + v, 0);
      if (!total) return;

      c.save();
      c.font      = 'bold 11px Arial, Helvetica, sans-serif';
      c.textAlign = 'center';

      meta.data.forEach((arc, i) => {
        const val = dataset.data[i];
        if (!val) return;

        // Ângulo do meio da fatia
        const startAngle = arc.startAngle;
        const endAngle   = arc.endAngle;
        const midAngle   = (startAngle + endAngle) / 2;

        // Posiciona o label a ~120% do raio externo
        const outerRadius = arc.outerRadius;
        const r           = outerRadius * 1.20;
        const x           = arc.x + Math.cos(midAngle) * r;
        const y           = arc.y + Math.sin(midAngle) * r;

        const pct  = ((val / total) * 100).toFixed(1);
        const line1 = `${val}`;
        const line2 = `(${pct}%)`;

        // Contorno branco para legibilidade sobre qualquer fundo
        c.strokeStyle = '#ffffff';
        c.lineWidth   = 3;
        c.fillStyle   = '#1E293B';

        c.strokeText(line1, x, y - 6);
        c.fillText(line1,   x, y - 6);
        c.strokeText(line2, x, y + 7);
        c.fillText(line2,   x, y + 7);
      });

      c.restore();
    }
  };

  state.charts.repilotagemRosca = new Chart(ctx, {
    type: 'doughnut',
    plugins: [doughnutLabelsPlugin],
    data: {
      labels: ['Aprovada', 'Em Andamento', 'Reprovada', 'Standby'],
      datasets: [{
        data: [repAprov, repMantida, repReprov, repStandby],
        backgroundColor: ['#16A34A', '#D97706', '#DC2626', '#94A3B8'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 40 },   // espaço para os labels externos
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (item) => {
              const val    = item.raw;
              const pctVal = repTotal > 0 ? ((val / repTotal) * 100).toFixed(1) : '0.0';
              return ` ${item.label}: ${val} (${pctVal}%)`;
            }
          }
        }
      }
    }
  });
}

// =============================================================================
// ETAPA 4: PAINEL DE ANÁLISE DETALHADA DE OBSERVAÇÕES E MOTIVOS
// =============================================================================
function initObservacoesPanel() {
  const selMotivo = document.getElementById('filter-obs-motivo');
  const selOrdem = document.getElementById('filter-obs-ordem');
  const inpBusca = document.getElementById('filter-obs-busca');

  const triggerUpdate = () => {
    if (state.lastDashboardData && state.lastDashboardData.raw_ops) {
      renderObservacoesAnalysis(state.lastDashboardData.raw_ops);
    }
  };

  if (selMotivo) selMotivo.addEventListener('change', triggerUpdate);
  if (selOrdem) selOrdem.addEventListener('change', triggerUpdate);
  if (inpBusca) inpBusca.addEventListener('input', triggerUpdate);
}

function renderObservacoesAnalysis(rawOps = []) {
  const tbody = document.querySelector('#tabela-analise-observacoes tbody');
  const summaryBadge = document.getElementById('obs-summary-badge');
  const selMotivo = document.getElementById('filter-obs-motivo');
  const selOrdem = document.getElementById('filter-obs-ordem');
  const inpBusca = document.getElementById('filter-obs-busca');

  if (!tbody) return;

  // 1. Contagem de frequência de todos os motivos
  const motivoFreqMap = {};
  rawOps.forEach(op => {
    if (op.motivos) {
      op.motivos.split('||').forEach(m => {
        const clean = m.trim();
        if (clean) motivoFreqMap[clean] = (motivoFreqMap[clean] || 0) + 1;
      });
    }
  });

  // Atualizar dropdown de motivos se necessário
  if (selMotivo && selMotivo.options.length <= 1) {
    const currentVal = selMotivo.value;
    selMotivo.innerHTML = '<option value="Todos">Todos os Motivos</option>';
    Object.entries(motivoFreqMap)
      .sort((a, b) => b[1] - a[1])
      .forEach(([motivo, count]) => {
        const opt = document.createElement('option');
        opt.value = motivo;
        opt.textContent = `${motivo} (${count}x)`;
        selMotivo.appendChild(opt);
      });
    selMotivo.value = currentVal || 'Todos';
  }

  // 2. Filtrar OPs
  let filtered = [...rawOps];

  const selectedMotivo = selMotivo ? selMotivo.value : 'Todos';
  if (selectedMotivo && selectedMotivo !== 'Todos') {
    filtered = filtered.filter(op => (op.motivos || '').toUpperCase().includes(selectedMotivo.toUpperCase()));
  }

  const query = inpBusca ? inpBusca.value.toLowerCase().trim() : '';
  if (query) {
    filtered = filtered.filter(op => {
      const matchOp = String(op.op || '').toLowerCase().includes(query);
      const matchRef = String(op.referencia || '').toLowerCase().includes(query);
      const matchObs = String(op.observacao || '').toLowerCase().includes(query);
      const matchMot = String(op.motivos || '').toLowerCase().includes(query);
      return matchOp || matchRef || matchObs || matchMot;
    });
  }

  // 3. Ordenação (ETAPA 4: Ordenar por maior frequência de motivos para identificar padrões)
  const ordem = selOrdem ? selOrdem.value : 'freq_desc';
  filtered.sort((a, b) => {
    if (ordem === 'freq_desc' || ordem === 'freq_asc') {
      const getHighestFreq = (op) => {
        if (!op.motivos) return 0;
        const freqs = op.motivos.split('||').map(m => motivoFreqMap[m.trim()] || 0);
        return Math.max(...freqs, 0);
      };
      const diff = getHighestFreq(b) - getHighestFreq(a);
      return ordem === 'freq_desc' ? diff : -diff;
    }
    if (ordem === 'data_desc') {
      return (b.data_prova || '').localeCompare(a.data_prova || '');
    }
    if (ordem === 'data_asc') {
      return (a.data_prova || '').localeCompare(b.data_prova || '');
    }
    if (ordem === 'op') {
      return String(a.op).localeCompare(String(b.op));
    }
    return 0;
  });

  // 4. Renderizar na Tabela
  tbody.innerHTML = '';
  if (summaryBadge) {
    summaryBadge.textContent = `${filtered.length} registro(s) encontrado(s)`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center" style="padding:1.5rem;">Nenhuma observação encontrada para os filtros selecionados.</td></tr>';
    return;
  }

  filtered.forEach(op => {
    const tr = document.createElement('tr');

    // Montar pílulas de motivos com quantidade de frequência
    let motivosHTML = '—';
    if (op.motivos && op.motivos.trim()) {
      motivosHTML = op.motivos.split('||').map(m => {
        const clean = m.trim();
        const freq = motivoFreqMap[clean] || 1;
        return `<span class="motivo-count-pill" title="Ocorrência total no período: ${freq}">${escapeHTML(clean)} <strong>(${freq}x)</strong></span>`;
      }).join(' ');
    }

    tr.innerHTML = `
      <td><strong>${escapeHTML(op.op)}</strong></td>
      <td>${escapeHTML(op.referencia)}</td>
      <td>${escapeHTML(op.segmento)}</td>
      <td>${escapeHTML(op.etapa)}</td>
      <td>${escapeHTML(op.modelista)}</td>
      <td>${escapeHTML(op.pilotista || '—')}</td>
      <td><span class="role-badge">${escapeHTML(op.situacao)}</span></td>
      <td>${motivosHTML}</td>
      <td style="color:#334155;">${escapeHTML(op.observacao || '—')}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ETAPA 1: Atualização dos dados do cabeçalho oficial do relatório (com logo à esquerda)
function updateReportHeaderInfo(filters = {}) {
  const printPeriodo = document.getElementById('print-periodo');
  const printSegmentos = document.getElementById('print-segmentos');
  const printCriterio = document.getElementById('print-criterio');
  const printDateTime = document.getElementById('print-date-time');

  const inicio = filters.data_inicio ? formatDateBR(filters.data_inicio) : 'Início';
  const fim = filters.data_fim ? formatDateBR(filters.data_fim) : formatDateBR(formatDateNowISO());
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR').slice(0, 5);

  if (printPeriodo) printPeriodo.innerHTML = `<i data-lucide="calendar" class="meta-icon"></i> <strong>Período:</strong> ${inicio} até ${fim}`;
  if (printSegmentos) printSegmentos.innerHTML = `<i data-lucide="tag" class="meta-icon"></i> <strong>Segmentos:</strong> ${filters.segmento && filters.segmento !== 'Todos' ? filters.segmento : 'JEANS, MODINHA'}`;
  if (printCriterio) printCriterio.innerHTML = `<i data-lucide="check-circle" class="meta-icon"></i> <strong>Critério:</strong> somente OPs com PROVA finalizada`;
  if (printDateTime) printDateTime.innerHTML = `<i data-lucide="clock" class="meta-icon"></i> <strong>Data/Hora:</strong> ${dateStr}, ${timeStr}`;

  if (window.lucide) window.lucide.createIcons();
}

// Impressão A4 Fiel ao Modelo
function prepareAndPrintReport() {
  const toggleObs = document.getElementById('toggle-obs-print');
  const annex = document.getElementById('print-obs-annex');
  const printGenerated = document.getElementById('print-generated-datetime');

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');

  if (printGenerated) printGenerated.textContent = `${dateStr}, ${timeStr}`;

  if (toggleObs && toggleObs.checked && annex) {
    annex.hidden = false;
    const tbody = annex.querySelector('tbody');
    if (tbody && state.lastDashboardData && state.lastDashboardData.raw_ops) {
      tbody.innerHTML = '';
      state.lastDashboardData.raw_ops.forEach(op => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHTML(op.op)}</td>
          <td>${escapeHTML(op.referencia)}</td>
          <td>${escapeHTML(op.segmento)}</td>
          <td>${escapeHTML(op.etapa)}</td>
          <td>${escapeHTML(op.situacao)}</td>
          <td>${escapeHTML(op.motivos)}</td>
          <td>${escapeHTML(op.observacao || '—')}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  } else if (annex) {
    annex.hidden = true;
  }

  // Assegura resize prévio de todos os gráficos
  Object.values(state.charts).forEach(chart => {
    if (chart && typeof chart.resize === 'function') chart.resize();
  });

  setTimeout(() => {
    window.print();
  }, 100);
}

// Listeners globais para redimensionamento nítido e perfeito no layout A4 impresso
window.addEventListener('beforeprint', () => {
  Object.values(state.charts).forEach(chart => {
    if (chart && typeof chart.resize === 'function') {
      chart.resize();
    }
  });
});

window.addEventListener('afterprint', () => {
  Object.values(state.charts).forEach(chart => {
    if (chart && typeof chart.resize === 'function') {
      chart.resize();
    }
  });
});

// =============================================================================
// FILA DE APROVAÇÃO (ADMIN / DESENVOLVEDOR)
// =============================================================================
function initFilaAprovacao() {
  const busca = document.getElementById('busca-aprovacao');
  const checkTodos = document.getElementById('select-all-aprovacao');
  const btnAprovarLote = document.getElementById('btn-aprovar-selecionadas');
  const modalRejeitar = document.getElementById('modal-rejeitar');
  const btnConfirmRejeitar = document.getElementById('btn-confirmar-rejeicao');

  if (busca) {
    busca.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('#tabela-aprovacao tbody tr').forEach(tr => {
        const text = tr.textContent.toLowerCase();
        tr.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }

  if (checkTodos) {
    checkTodos.addEventListener('change', (e) => {
      document.querySelectorAll('.check-op-row').forEach(c => c.checked = e.target.checked);
    });
  }

  if (btnAprovarLote) {
    btnAprovarLote.addEventListener('click', async () => {
      const selected = Array.from(document.querySelectorAll('.check-op-row:checked')).map(c => c.value);
      if (selected.length === 0) {
        showToast('Nenhuma OP selecionada para aprovação', 'warning');
        return;
      }

      if (confirm(`Deseja aprovar as ${selected.length} OPs selecionadas?`)) {
        const res = await apiPost('aprovar_lote', { ids: selected });
        if (res && res.success) {
          showToast(res.message || 'OPs aprovadas com sucesso!', 'success');
          loadFilaAprovacao();
          updatePendingBadge();
        } else {
          showToast('Erro ao aprovar lote', 'error');
        }
      }
    });
  }

  if (btnConfirmRejeitar) {
    btnConfirmRejeitar.addEventListener('click', async () => {
      const motivo = document.getElementById('rejeitar-motivo').value.trim();
      if (!motivo) {
        showToast('Informe o motivo da rejeição', 'error');
        return;
      }

      const res = await apiPost('rejeitar_op', { id: state.pendingRejectId, motivo_rejeicao: motivo });
      if (res && res.success) {
        showToast('OP rejeitada com sucesso!', 'success');
        modalRejeitar.hidden = true;
        document.getElementById('rejeitar-motivo').value = '';
        state.pendingRejectId = null;
        loadFilaAprovacao();
        updatePendingBadge();
      } else {
        showToast('Erro ao rejeitar OP', 'error');
      }
    });
  }

  document.querySelectorAll('[data-dismiss]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modalId = e.currentTarget.getAttribute('data-dismiss');
      const m = document.getElementById(modalId);
      if (m) m.hidden = true;
    });
  });
}

async function loadFilaAprovacao() {
  const tbody = document.querySelector('#tabela-aprovacao tbody');
  if (!tbody) return;

  const res = await apiGet('get_ops_pendentes', { usuario: state.currentUser ? state.currentUser.usuario : '' });
  const ops = (res && res.success && res.data) ? res.data : [];
  state.rawOpsPendentes = ops;

  tbody.innerHTML = '';
  if (ops.length === 0) {
    tbody.innerHTML = '<tr><td colspan="14" class="text-center" style="padding:1.5rem;">Nenhuma OP pendente de aprovação no momento.</td></tr>';
    return;
  }

  ops.forEach(op => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="col-check"><input type="checkbox" class="check-op-row" value="${op.id}"></td>
      <td>${escapeHTML(op.data_prova)}</td>
      <td>${escapeHTML(op.hora_cadastro)}</td>
      <td>${escapeHTML(op.usuario_cadastro)}</td>
      <td><strong>${escapeHTML(op.op)}</strong></td>
      <td>${escapeHTML(op.referencia)}</td>
      <td>${escapeHTML(op.segmento)}</td>
      <td>${escapeHTML(op.etapa)}</td>
      <td>${escapeHTML(op.servico || '—')}</td>
      <td>${escapeHTML(op.modelista)}</td>
      <td>${escapeHTML(op.pilotista || '—')}</td>
      <td>${escapeHTML(op.situacao)}</td>
      <td>${escapeHTML(op.motivos)}</td>
      <td>${escapeHTML(op.observacao || '—')}</td>
      <td>
        <div style="display:flex;gap:4px;">
          <button type="button" class="btn btn-success btn-sm btn-aprovar" data-id="${op.id}" title="Aprovar">
            <i data-lucide="check" aria-hidden="true"></i>
          </button>
          <button type="button" class="btn btn-danger btn-sm btn-rejeitar" data-id="${op.id}" title="Rejeitar">
            <i data-lucide="x" aria-hidden="true"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (window.lucide) window.lucide.createIcons({ root: tbody });

  tbody.querySelectorAll('.btn-aprovar').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const res = await apiPost('aprovar_op', { id });
      if (res && res.success) {
        showToast('OP aprovada com sucesso!', 'success');
        loadFilaAprovacao();
        updatePendingBadge();
      } else {
        showToast('Erro ao aprovar OP', 'error');
      }
    });
  });

  tbody.querySelectorAll('.btn-rejeitar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      state.pendingRejectId = id;
      const modal = document.getElementById('modal-rejeitar');
      if (modal) modal.hidden = false;
    });
  });
}

// =============================================================================
// CONFIGURAÇÕES DE INDICADORES (ETAPA 5.3: ATUALIZAÇÃO IMEDIATA)
// =============================================================================
function initConfigIndicadores() {
  const tabs = document.querySelectorAll('.config-tabs .tab-btn');
  const btnAdicionar = document.getElementById('btn-adicionar-termo');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.getAttribute('data-category');
      renderConfigTable(cat);
    });
  });

  if (btnAdicionar) {
    btnAdicionar.addEventListener('click', async () => {
      const termo = document.getElementById('config-novo-termo').value.trim();
      const categoria = document.getElementById('config-categoria').value;

      if (!termo || !categoria) {
        showToast('Preencha o termo e a categoria', 'error');
        return;
      }

      const res = await apiPost('salvar_indicador', {
        termo_customizado: termo,
        categoria: categoria,
        exibir_nos_graficos: true
      });

      if (res && res.success) {
        showToast('Termo adicionado e já disponível para cadastro!', 'success');
        document.getElementById('config-novo-termo').value = '';

        // ETAPA 5.3: Atualização imediata dos datalists para os criadores
        await loadConfigIndicadores();
        populateDatalists(state.rawIndicadores);
      } else {
        showToast('Erro ao adicionar termo', 'error');
      }
    });
  }

  initMetasForm();
}

async function loadConfigIndicadores() {
  const res = await apiGet('get_indicadores', { usuario: state.currentUser ? state.currentUser.usuario : '' });
  if (res && res.success && res.data) {
    state.rawIndicadores = res.data;
    const activeTab = document.querySelector('.config-tabs .tab-btn.active');
    const cat = activeTab ? activeTab.getAttribute('data-category') : 'TODOS';
    renderConfigTable(cat);
  }
}

function renderConfigTable(categoria = 'TODOS') {
  const tbody = document.querySelector('#tabela-indicadores tbody');
  if (!tbody) return;

  let items = state.rawIndicadores;
  if (categoria !== 'TODOS') {
    items = items.filter(x => x.categoria === categoria);
  }

  tbody.innerHTML = '';
  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:1.5rem;">Nenhum termo cadastrado nesta categoria.</td></tr>';
    return;
  }

  items.forEach(it => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHTML(it.termo_customizado)}</strong></td>
      <td><span class="role-badge">${escapeHTML(it.categoria)}</span></td>
      <td>
        <label class="switch">
          <input type="checkbox" class="toggle-ind-switch" data-termo="${escapeHTML(it.termo_customizado)}" data-cat="${escapeHTML(it.categoria)}" ${it.exibir_nos_graficos ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </td>
      <td>${escapeHTML(it.cadastrado_por || 'Sistema')}</td>
      <td>${escapeHTML(it.data_cadastro || '—')}</td>
      <td>
        <button type="button" class="btn btn-outline btn-sm btn-delete-ind" data-termo="${escapeHTML(it.termo_customizado)}" data-cat="${escapeHTML(it.categoria)}" title="Desativar">
          <i data-lucide="trash-2" aria-hidden="true"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (window.lucide) window.lucide.createIcons({ root: tbody });

  tbody.querySelectorAll('.toggle-ind-switch').forEach(sw => {
    sw.addEventListener('change', async (e) => {
      const termo = e.target.getAttribute('data-termo');
      const cat = e.target.getAttribute('data-cat');
      const res = await apiPost('toggle_indicador', { termo_customizado: termo, categoria: cat });
      if (res && res.success) {
        showToast('Configuração atualizada!', 'success');
      }
    });
  });
}

// =============================================================================
// INICIALIZAÇÃO GERAL DA APLICAÇÃO
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  showLoading(false);
  initAuth();
  initNavigation();
  initCadastroForm();
  initDashboard();
  initFilaAprovacao();
  initConfigIndicadores();

  if (window.lucide) window.lucide.createIcons();
});
