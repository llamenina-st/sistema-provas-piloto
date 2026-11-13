// =============================================================================
// RELATÓRIO PROVA DE PILOTO — Backend Google Apps Script
// Publicado como Web App. Google Sheets como banco de dados.
// =============================================================================

// ---------------------------------------------------------------------------
// CONSTANTES GLOBAIS
// ---------------------------------------------------------------------------
var NOME_ABA_USUARIOS        = 'USUARIOS';
var NOME_ABA_OPS_PENDENTES   = 'OPS_PENDENTES';
var NOME_ABA_OPS_APROVADAS   = 'OPS_APROVADAS';
var NOME_ABA_CONFIG_INDIC    = 'CONFIG_INDICADORES';
var NOME_ABA_OPS_REJEITADAS  = 'OPS_REJEITADAS';
var FUSO_HORARIO             = 'America/Sao_Paulo';
var TAMANHO_MAX_TEXTO        = 500;

// ---------------------------------------------------------------------------
// PONTO DE ENTRADA — GET (leitura)
// ---------------------------------------------------------------------------
function doGet(e) {
  var parametros = e.parameter || {};
  var acao = (parametros.action || '').trim().toLowerCase();

  try {
    // Login não exige token
    if (acao === 'login') {
      return responderJSON(processarLogin(parametros));
    }

    // Demais ações exigem token
    var validacaoToken = validarToken(parametros['x-api-token']);
    if (!validacaoToken.valido) {
      return responderJSON({ success: false, message: 'Token inválido' });
    }

    switch (acao) {
      case 'get_ops_pendentes':
        return responderJSON(processarGetOpsPendentes(parametros));
      case 'get_ops_aprovadas':
        return responderJSON(processarGetOpsAprovadas(parametros));
      case 'get_indicadores':
        return responderJSON(processarGetIndicadores(parametros));
      case 'get_dashboard_data':
        return responderJSON(processarGetDashboardData(parametros));
      case 'get_etapa_sugerida':
        return responderJSON(processarGetEtapaSugerida(parametros));
      case 'get_pending_count':
        return responderJSON(processarGetPendingCount(parametros));
      default:
        return responderJSON({ success: false, message: 'Ação GET desconhecida: ' + acao });
    }
  } catch (erro) {
    return responderJSON({ success: false, message: 'Erro interno: ' + erro.message });
  }
}

// ---------------------------------------------------------------------------
// PONTO DE ENTRADA — POST (escrita)
// ---------------------------------------------------------------------------
function doPost(e) {
  var corpo = {};
  try {
    corpo = JSON.parse(e.postData.contents);
  } catch (erroParse) {
    return responderJSON({ success: false, message: 'Corpo da requisição inválido (JSON mal formado)' });
  }

  var acao = (corpo.action || '').trim().toLowerCase();

  try {
    // Todas as ações POST exigem token
    var validacaoToken = validarToken(corpo['x-api-token']);
    if (!validacaoToken.valido) {
      return responderJSON({ success: false, message: 'Token inválido' });
    }

    switch (acao) {
      case 'cadastrar_op':
        return responderJSON(processarCadastrarOp(corpo));
      case 'aprovar_op':
        return responderJSON(processarAprovarOp(corpo));
      case 'aprovar_lote':
        return responderJSON(processarAprovarLote(corpo));
      case 'rejeitar_op':
        return responderJSON(processarRejeitarOp(corpo));
      case 'editar_op_pendente':
        return responderJSON(processarEditarOpPendente(corpo));
      case 'salvar_indicador':
        return responderJSON(processarSalvarIndicador(corpo));
      case 'toggle_indicador':
        return responderJSON(processarToggleIndicador(corpo));
      default:
        return responderJSON({ success: false, message: 'Ação POST desconhecida: ' + acao });
    }
  } catch (erro) {
    return responderJSON({ success: false, message: 'Erro interno: ' + erro.message });
  }
}

// =============================================================================
// UTILITÁRIOS GERAIS
// =============================================================================

/**
 * Monta a resposta JSON com ContentService.
 * @param {Object} obj - Objeto a ser serializado.
 * @return {TextOutput}
 */
function responderJSON(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Valida o token de API comparando com a Script Property 'API_TOKEN'.
 * @param {string} tokenRecebido
 * @return {{ valido: boolean }}
 */
function validarToken(tokenRecebido) {
  if (!tokenRecebido) return { valido: false };
  var tokenEsperado = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
  return { valido: tokenRecebido === tokenEsperado };
}

/**
 * Verifica se o usuário possui o papel exigido.
 * @param {string} nomeUsuario - Nome de login do usuário.
 * @param {string} papelExigido - Papel mínimo requerido.
 * @return {{ autorizado: boolean, message: string }}
 */
function verificarPapel(nomeUsuario, papelExigido) {
  if (!nomeUsuario) return { autorizado: false, message: 'Usuário não informado' };
  var aba = obterAba(NOME_ABA_USUARIOS);
  var dados = aba.getDataRange().getValues();
  for (var i = 1; i < dados.length; i++) {
    if (String(dados[i][0]).trim() === String(nomeUsuario).trim()) {
      var papel = String(dados[i][3]).trim().toUpperCase();
      var ativo = String(dados[i][4]).trim().toUpperCase();
      if (ativo !== 'TRUE') return { autorizado: false, message: 'Usuário inativo' };
      if (papelExigido === 'DESENVOLVEDOR' && papel !== 'DESENVOLVEDOR') {
        return { autorizado: false, message: 'Acesso restrito a desenvolvedores' };
      }
      return { autorizado: true, message: 'OK', papel: papel };
    }
  }
  return { autorizado: false, message: 'Usuário não encontrado' };
}

/**
 * Obtém a aba (sheet) pelo nome.
 * @param {string} nomeAba
 * @return {Sheet}
 */
function obterAba(nomeAba) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet(); // Acessa a planilha onde este script está vinculado
  var aba = planilha.getSheetByName(nomeAba);
  if (!aba) throw new Error('Aba "' + nomeAba + '" não encontrada. Execute setupInitialData() primeiro.');
  return aba;
}

/**
 * Gera um ID único baseado em timestamp + componente aleatório.
 * @return {string}
 */
function gerarId() {
  return new Date().getTime().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Retorna a data/hora atual formatada no fuso de São Paulo.
 * @param {string} formato - Padrão de formatação (ex.: 'dd/MM/yyyy HH:mm:ss').
 * @return {string}
 */
function agora(formato) {
  return Utilities.formatDate(new Date(), FUSO_HORARIO, formato || 'dd/MM/yyyy HH:mm:ss');
}

/**
 * Sanitiza texto: remove tags HTML e limita comprimento.
 * @param {*} valor
 * @param {number} [limite]
 * @return {string}
 */
function sanitizar(valor, limite) {
  if (valor === null || valor === undefined) return '';
  var texto = String(valor).replace(/<[^>]*>/g, '').trim();
  var max = limite || TAMANHO_MAX_TEXTO;
  return texto.length > max ? texto.substring(0, max) : texto;
}

/**
 * Converte os dados de uma aba em array de objetos, usando a primeira linha como cabeçalhos.
 * @param {Sheet} aba
 * @return {Object[]}
 */
function abaParaObjetos(aba) {
  var dados = aba.getDataRange().getValues();
  if (dados.length <= 1) return [];
  var cabecalhos = dados[0].map(function(c) { return String(c).trim(); });
  var resultado = [];
  for (var i = 1; i < dados.length; i++) {
    var obj = {};
    for (var j = 0; j < cabecalhos.length; j++) {
      obj[cabecalhos[j]] = dados[i][j];
    }
    resultado.push(obj);
  }
  return resultado;
}

/**
 * Converte valor de célula para string segura para comparação de datas (dd/MM/yyyy).
 * @param {*} valor
 * @return {string}
 */
function formatarDataCelula(valor) {
  if (!valor) return '';
  if (valor instanceof Date) {
    return Utilities.formatDate(valor, FUSO_HORARIO, 'dd/MM/yyyy');
  }
  return String(valor).trim();
}

/**
 * Converte uma string dd/MM/yyyy em objeto Date para comparações.
 * @param {string} texto
 * @return {Date|null}
 */
function parseDateBR(texto) {
  if (!texto) return null;
  var str = texto instanceof Date
    ? Utilities.formatDate(texto, FUSO_HORARIO, 'dd/MM/yyyy')
    : String(texto).trim();

  // Suporte a formato ISO yyyy-mm-dd (enviado por input[type=date] do frontend)
  if (str.indexOf('-') !== -1 && str.indexOf('/') === -1) {
    var isoPartes = str.split('-');
    if (isoPartes.length === 3) {
      // converte yyyy-mm-dd → dd/MM/yyyy
      str = isoPartes[2] + '/' + isoPartes[1] + '/' + isoPartes[0];
    }
  }

  var partes = str.split('/');
  if (partes.length !== 3) return null;
  var dia = parseInt(partes[0], 10);
  var mes = parseInt(partes[1], 10) - 1;
  var ano = parseInt(partes[2], 10);
  if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return null;
  return new Date(ano, mes, dia);
}

// =============================================================================
// PROCESSADORES — doGet
// =============================================================================

// ---- LOGIN ----
function processarLogin(params) {
  var usuario = sanitizar(params.usuario);
  var senha   = sanitizar(params.senha);
  if (!usuario || !senha) {
    return { success: false, message: 'Usuário e senha são obrigatórios' };
  }

  var aba = obterAba(NOME_ABA_USUARIOS);
  var dados = aba.getDataRange().getValues();

  for (var i = 1; i < dados.length; i++) {
    var usu  = String(dados[i][0]).trim();
    var sn   = String(dados[i][1]).trim();
    var nome = String(dados[i][2]).trim();
    var papel = String(dados[i][3]).trim();
    var ativo = String(dados[i][4]).trim().toUpperCase();

    if (usu === usuario && sn === senha) {
      if (ativo !== 'TRUE') {
        return { success: false, message: 'Usuário inativo. Contate o administrador.' };
      }
      return {
        success: true,
        message: 'Login realizado com sucesso',
        data: { usuario: usu, nome: nome, papel: papel }
      };
    }
  }

  return { success: false, message: 'Usuário ou senha incorretos' };
}

// ---- GET OPS PENDENTES (apenas DESENVOLVEDOR) ----
function processarGetOpsPendentes(params) {
  var auth = verificarPapel(params.usuario, 'DESENVOLVEDOR');
  if (!auth.autorizado) return { success: false, message: auth.message };

  var registros = abaParaObjetos(obterAba(NOME_ABA_OPS_PENDENTES));

  // Formatar datas para strings legíveis
  registros = registros.map(function(r) {
    r.data_prova = formatarDataCelula(r.data_prova);
    r.data_criacao = formatarDataCelula(r.data_criacao);
    return r;
  });

  // Ordenar por data_prova desc, depois hora_cadastro desc
  registros.sort(function(a, b) {
    var dA = parseDateBR(a.data_prova);
    var dB = parseDateBR(b.data_prova);
    var tA = dA ? dA.getTime() : 0;
    var tB = dB ? dB.getTime() : 0;
    if (tB !== tA) return tB - tA;
    // hora_cadastro como string (HH:mm) — comparação lexicográfica inversa
    var hA = String(a.hora_cadastro || '');
    var hB = String(b.hora_cadastro || '');
    return hB.localeCompare(hA);
  });

  return { success: true, message: 'OK', data: registros };
}

// ---- GET OPS APROVADAS (todos autenticados, com filtros) ----
function processarGetOpsAprovadas(params) {
  var auth = verificarPapel(params.usuario, 'QUALQUER');
  if (!auth.autorizado) return { success: false, message: auth.message };

  var registros = abaParaObjetos(obterAba(NOME_ABA_OPS_APROVADAS));

  // Formatar datas
  registros = registros.map(function(r) {
    r.data_prova = formatarDataCelula(r.data_prova);
    r.data_aprovacao = formatarDataCelula(r.data_aprovacao);
    r.data_criacao = formatarDataCelula(r.data_criacao);
    return r;
  });

  // Aplicar filtros
  registros = aplicarFiltrosOps(registros, params);

  return { success: true, message: 'OK', data: registros };
}

// ---- GET INDICADORES ----
function processarGetIndicadores(params) {
  var auth = verificarPapel(params.usuario, 'QUALQUER');
  if (!auth.autorizado) return { success: false, message: auth.message };

  var registros = abaParaObjetos(obterAba(NOME_ABA_CONFIG_INDIC));
  var categoriaFiltro = sanitizar(params.categoria).toUpperCase();

  if (categoriaFiltro) {
    registros = registros.filter(function(r) {
      return String(r.categoria).trim().toUpperCase() === categoriaFiltro;
    });
  }

  // Formatar datas
  registros = registros.map(function(r) {
    r.data_cadastro = formatarDataCelula(r.data_cadastro);
    return r;
  });

  return { success: true, message: 'OK', data: registros };
}

// ---- GET DASHBOARD DATA ----
function processarGetDashboardData(params) {
  var auth = verificarPapel(params.usuario, 'QUALQUER');
  if (!auth.autorizado) return { success: false, message: auth.message };

  var registros = abaParaObjetos(obterAba(NOME_ABA_OPS_APROVADAS));

  // Formatar datas antes de filtrar
  registros = registros.map(function(r) {
    r.data_prova = formatarDataCelula(r.data_prova);
    r.data_aprovacao = formatarDataCelula(r.data_aprovacao);
    r.data_criacao = formatarDataCelula(r.data_criacao);
    return r;
  });

  // Aplicar filtros
  registros = aplicarFiltrosOps(registros, params);

  // ---------- AGREGAR DADOS ----------

  // --- KPIs ---
  var kpis = { total: 0, piloto: 0, repilotagens: 0, aprovadas: 0, reprovadas: 0, standby: 0, em_repilotagem: 0 };
  kpis.total = registros.length;

  registros.forEach(function(r) {
    var etapa = String(r.etapa || '').trim().toUpperCase();
    var situacao = normalizarSituacao(r.situacao);

    if (etapa === 'PILOTO') {
      kpis.piloto++;
    } else {
      kpis.repilotagens++;
    }

    switch (situacao) {
      case 'APROVADA':
      case 'APROVADA COM AJUSTES':
        kpis.aprovadas++;
        break;
      case 'REPROVADA':
        kpis.reprovadas++;
        break;
      case 'STANDBY':
        kpis.standby++;
        break;
      case 'REPILOTAGEM':
        kpis.em_repilotagem++;
        break;
    }
  });

  // --- Resumo por Segmento ---
  var mapaSegmento = {};
  registros.forEach(function(r) {
    var seg = String(r.segmento || 'SEM SEGMENTO').trim().toUpperCase();
    if (!mapaSegmento[seg]) {
      mapaSegmento[seg] = { segmento: seg, total: 0, piloto: 0, aprovadas: 0, em_repilotagem: 0, repilotagem: 0, reprovadas: 0, standby: 0 };
    }
    mapaSegmento[seg].total++;
    var etapa = String(r.etapa || '').trim().toUpperCase();
    var situacao = normalizarSituacao(r.situacao);

    if (etapa === 'PILOTO') mapaSegmento[seg].piloto++;
    if (etapa !== 'PILOTO') mapaSegmento[seg].repilotagem++;
    if (situacao === 'APROVADA' || situacao === 'APROVADA COM AJUSTES') mapaSegmento[seg].aprovadas++;
    if (situacao === 'REPROVADA') mapaSegmento[seg].reprovadas++;
    if (situacao === 'STANDBY') mapaSegmento[seg].standby++;
    if (situacao === 'REPILOTAGEM') mapaSegmento[seg].em_repilotagem++;
  });

  var resumoSegmento = Object.keys(mapaSegmento).map(function(k) {
    var s = mapaSegmento[k];
    var tot = s.total || 1; // evitar divisão por zero
    function pct(val) { return s.total > 0 ? ((val / s.total) * 100).toFixed(1) : '0.0'; }
    s.pct_aprovadas    = pct(s.aprovadas);
    s.pct_em_repilotagem = pct(s.em_repilotagem);
    s.pct_repilotagem  = pct(s.repilotagem);
    s.pct_reprovadas   = pct(s.reprovadas);
    s.pct_standby      = pct(s.standby);
    return s;
  });
  resumoSegmento.sort(function(a, b) { return b.total - a.total; });

  // --- Pareto de Motivos (top 8 por situação) ---
  var paretoRepilotagem     = calcularPareto(registros, 'REPILOTAGEM');
  var paretoReprovacao      = calcularPareto(registros, 'REPROVADA');
  var paretoAprovacaoAjustes = calcularPareto(registros, 'APROVADA COM AJUSTES');

  // --- Breakdown por Modelista — todas as OPs onde modelista está preenchida ---
  var mapaModelista = {};
  registros.forEach(function(r) {
    var mod = String(r.modelista || '').trim();
    if (!mod) return; // ignora OPs sem modelista cadastrada

    var situacao = normalizarSituacao(r.situacao);

    if (!mapaModelista[mod]) {
      mapaModelista[mod] = { modelista: mod, aprovada: 0, aprovada_ajustes: 0, reprovada: 0, repilotagem: 0, standby: 0 };
    }

    switch (situacao) {
      case 'APROVADA':             mapaModelista[mod].aprovada++;         break;
      case 'APROVADA COM AJUSTES': mapaModelista[mod].aprovada_ajustes++; break;
      case 'REPROVADA':            mapaModelista[mod].reprovada++;        break;
      case 'REPILOTAGEM':          mapaModelista[mod].repilotagem++;      break;
      case 'STANDBY':              mapaModelista[mod].standby++;          break;
    }
  });

  var modelistas = Object.keys(mapaModelista).map(function(k) { return mapaModelista[k]; });
  modelistas.sort(function(a, b) {
    var totalA = a.aprovada + a.aprovada_ajustes + a.reprovada + a.repilotagem + a.standby;
    var totalB = b.aprovada + b.aprovada_ajustes + b.reprovada + b.repilotagem + b.standby;
    return totalB - totalA;
  });

  // --- Breakdown por Pilotista ---
  var mapaPilotista = {};
  registros.forEach(function(r) {
    var pil = String(r.pilotista || 'SEM PILOTISTA').trim();
    var situacao = normalizarSituacao(r.situacao);

    if (!mapaPilotista[pil]) {
      mapaPilotista[pil] = { pilotista: pil, aprovada: 0, aprovada_ajustes: 0, reprovada: 0, repilotagem: 0, standby: 0 };
    }

    switch (situacao) {
      case 'APROVADA':           mapaPilotista[pil].aprovada++;         break;
      case 'APROVADA COM AJUSTES': mapaPilotista[pil].aprovada_ajustes++; break;
      case 'REPROVADA':          mapaPilotista[pil].reprovada++;        break;
      case 'STANDBY':            mapaPilotista[pil].standby++;          break;
      case 'REPILOTAGEM':        mapaPilotista[pil].repilotagem++;      break;
    }
  });

  var pilotistas = Object.keys(mapaPilotista).map(function(k) { return mapaPilotista[k]; });
  pilotistas.sort(function(a, b) {
    var totalA = a.aprovada + a.aprovada_ajustes + a.reprovada + a.repilotagem + a.standby;
    var totalB = b.aprovada + b.aprovada_ajustes + b.reprovada + b.repilotagem + b.standby;
    return totalB - totalA;
  });

  // --- Conversão de Repilotagem ---
  var repilotagens = registros.filter(function(r) {
    return String(r.etapa || '').trim().toUpperCase() !== 'PILOTO';
  });

  var repConversao = {
    total: repilotagens.length,
    aprovada: 0,
    repilotagem: 0,
    reprovada: 0,
    standby: 0,
    taxa_conversao: 0
  };

  repilotagens.forEach(function(r) {
    var situacao = normalizarSituacao(r.situacao);
    switch (situacao) {
      case 'APROVADA':
      case 'APROVADA COM AJUSTES':
        repConversao.aprovada++;
        break;
      case 'REPILOTAGEM':
        repConversao.repilotagem++;
        break;
      case 'REPROVADA':
        repConversao.reprovada++;
        break;
      case 'STANDBY':
        repConversao.standby++;
        break;
    }
  });

  if (repConversao.total > 0) {
    repConversao.taxa_conversao = Math.round((repConversao.aprovada / repConversao.total) * 10000) / 100;
  }

  return {
    success: true,
    message: 'OK',
    data: {
      kpis: kpis,
      resumo_segmento: resumoSegmento,
      pareto_repilotagem: paretoRepilotagem,
      pareto_reprovacao: paretoReprovacao,
      pareto_aprovacao_ajustes: paretoAprovacaoAjustes,
      modelistas: modelistas,
      pilotistas: pilotistas,
      repilotagem_conversao: repConversao,
      raw_ops: registros
    }
  };
}

// ---- GET ETAPA SUGERIDA ----
function processarGetEtapaSugerida(params) {
  var auth = verificarPapel(params.usuario, 'QUALQUER');
  if (!auth.autorizado) return { success: false, message: auth.message };

  var opBuscada = sanitizar(params.op);
  if (!opBuscada) return { success: false, message: 'Número da OP é obrigatório' };

  var etapasEncontradas = [];

  // Buscar em OPS_PENDENTES
  var pendentes = abaParaObjetos(obterAba(NOME_ABA_OPS_PENDENTES));
  pendentes.forEach(function(r) {
    if (String(r.op).trim() === opBuscada) {
      etapasEncontradas.push(String(r.etapa || '').trim().toUpperCase());
    }
  });

  // Buscar em OPS_APROVADAS
  var aprovadas = abaParaObjetos(obterAba(NOME_ABA_OPS_APROVADAS));
  aprovadas.forEach(function(r) {
    if (String(r.op).trim() === opBuscada) {
      etapasEncontradas.push(String(r.etapa || '').trim().toUpperCase());
    }
  });

  // Buscar em OPS_REJEITADAS também (para não sugerir etapas já utilizadas)
  var rejeitadas = abaParaObjetos(obterAba(NOME_ABA_OPS_REJEITADAS));
  rejeitadas.forEach(function(r) {
    if (String(r.op).trim() === opBuscada) {
      etapasEncontradas.push(String(r.etapa || '').trim().toUpperCase());
    }
  });

  var etapaSugerida = calcularProximaEtapa(etapasEncontradas);

  return {
    success: true,
    message: 'OK',
    data: { op: opBuscada, etapa_sugerida: etapaSugerida, etapas_existentes: etapasEncontradas }
  };
}

// ---- GET PENDING COUNT ----
function processarGetPendingCount(params) {
  var auth = verificarPapel(params.usuario, 'DESENVOLVEDOR');
  if (!auth.autorizado) return { success: false, message: auth.message };

  var aba = obterAba(NOME_ABA_OPS_PENDENTES);
  var ultimaLinha = aba.getLastRow();
  var contagem = ultimaLinha > 1 ? ultimaLinha - 1 : 0; // desconta cabeçalho

  return { success: true, message: 'OK', data: { count: contagem } };
}

// =============================================================================
// PROCESSADORES — doPost
// =============================================================================

// ---- CADASTRAR OP ----
function processarCadastrarOp(corpo) {
  var authResult = verificarPapel(corpo.usuario, 'QUALQUER');
  if (!authResult.autorizado) return { success: false, message: authResult.message };

  // Validações mínimas
  var op = sanitizar(corpo.op);
  var referencia = sanitizar(corpo.referencia);
  if (!op) return { success: false, message: 'Campo "op" é obrigatório' };

  var id = gerarId();
  var dataProva       = sanitizar(corpo.data_prova);
  var horaCadastro    = agora('HH:mm:ss');
  var usuarioCadastro = sanitizar(corpo.usuario);
  var segmento        = sanitizar(corpo.segmento);
  var etapa           = sanitizar(corpo.etapa);
  var servico         = sanitizar(corpo.servico);
  var modelista       = sanitizar(corpo.modelista);
  var pilotista       = sanitizar(corpo.pilotista);
  var situacao        = sanitizar(corpo.situacao);
  var motivos         = sanitizar(corpo.motivos, 2000);
  var observacao      = sanitizar(corpo.observacao, 1000);
  var dataCriacao     = agora('dd/MM/yyyy HH:mm:ss');

  var novaLinha = [
    id, dataProva, horaCadastro, usuarioCadastro,
    op, referencia, segmento, etapa, servico,
    modelista, pilotista, situacao, motivos, observacao, dataCriacao
  ];

  var aba = obterAba(NOME_ABA_OPS_PENDENTES);
  aba.appendRow(novaLinha);

  // ETAPA 5.2: Registrar automaticamente termos inéditos em CONFIG_INDICADORES com exibir_nos_graficos = FALSE
  registrarTermosIneditos(situacao, 'SITUACAO', usuarioCadastro);
  registrarTermosIneditos(segmento, 'SEGMENTO', usuarioCadastro);
  registrarTermosIneditos(servico, 'SERVICO', usuarioCadastro);
  registrarTermosIneditos(modelista, 'MODELISTA', usuarioCadastro);
  registrarTermosIneditos(pilotista, 'PILOTISTA', usuarioCadastro);
  registrarTermosIneditos(etapa, 'ETAPA', usuarioCadastro);
  if (motivos) {
    var listaMotivos = motivos.split('||');
    for (var m = 0; m < listaMotivos.length; m++) {
      registrarTermosIneditos(listaMotivos[m].trim(), 'MOTIVO', usuarioCadastro);
    }
  }

  return { success: true, message: 'OP cadastrada com sucesso', data: { id: id } };
}

/**
 * ETAPA 5.2: Registra um termo inédito na aba CONFIG_INDICADORES com exibir_nos_graficos = FALSE (desligado por padrão)
 */
function registrarTermosIneditos(termo, categoria, cadastradoPor) {
  if (!termo) return;
  termo = String(termo).trim();
  if (!termo) return;

  var aba = obterAba(NOME_ABA_CONFIG_INDIC);
  var dados = aba.getDataRange().getValues();

  for (var i = 1; i < dados.length; i++) {
    var tExistente = String(dados[i][0]).trim().toUpperCase();
    var cExistente = String(dados[i][1]).trim().toUpperCase();
    if (tExistente === termo.toUpperCase() && cExistente === categoria.toUpperCase()) {
      return; // Já cadastrado
    }
  }

  // Não cadastrado: registrar automaticamente com exibir_nos_graficos = FALSE
  var dataCadastro = agora('dd/MM/yyyy');
  aba.appendRow([termo.toUpperCase(), categoria.toUpperCase(), 'FALSE', cadastradoPor + ' (Auto)', dataCadastro]);
}

// ---- APROVAR OP ----
function processarAprovarOp(corpo) {
  var auth = verificarPapel(corpo.usuario, 'DESENVOLVEDOR');
  if (!auth.autorizado) return { success: false, message: auth.message };

  var idBuscado = sanitizar(corpo.id);
  if (!idBuscado) return { success: false, message: 'ID da OP é obrigatório' };

  var resultado = moverOpParaAprovada(idBuscado, sanitizar(corpo.usuario));
  return resultado;
}

// ---- APROVAR LOTE ----
function processarAprovarLote(corpo) {
  var auth = verificarPapel(corpo.usuario, 'DESENVOLVEDOR');
  if (!auth.autorizado) return { success: false, message: auth.message };

  var ids = corpo.ids;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return { success: false, message: 'Lista de IDs é obrigatória' };
  }

  var aprovados = 0;
  var erros = [];

  for (var i = 0; i < ids.length; i++) {
    var resultado = moverOpParaAprovada(sanitizar(ids[i]), sanitizar(corpo.usuario));
    if (resultado.success) {
      aprovados++;
    } else {
      erros.push({ id: ids[i], message: resultado.message });
    }
  }

  return {
    success: true,
    message: aprovados + ' OP(s) aprovada(s)' + (erros.length > 0 ? ', ' + erros.length + ' erro(s)' : ''),
    data: { aprovados: aprovados, erros: erros }
  };
}

// ---- REJEITAR OP ----
function processarRejeitarOp(corpo) {
  var auth = verificarPapel(corpo.usuario, 'DESENVOLVEDOR');
  if (!auth.autorizado) return { success: false, message: auth.message };

  var idBuscado = sanitizar(corpo.id);
  var motivoRejeicao = sanitizar(corpo.motivo_rejeicao, 1000);
  if (!idBuscado) return { success: false, message: 'ID da OP é obrigatório' };
  if (!motivoRejeicao) return { success: false, message: 'Motivo da rejeição é obrigatório' };

  var abaPendentes = obterAba(NOME_ABA_OPS_PENDENTES);
  var dados = abaPendentes.getDataRange().getValues();
  var cabecalhos = dados[0];
  var indiceColunaId = cabecalhos.indexOf('id');
  var linhaEncontrada = -1;
  var registroOriginal = null;

  for (var i = 1; i < dados.length; i++) {
    if (String(dados[i][indiceColunaId]).trim() === idBuscado) {
      linhaEncontrada = i + 1; // linha 1-based na planilha
      registroOriginal = dados[i];
      break;
    }
  }

  if (linhaEncontrada === -1) {
    return { success: false, message: 'OP não encontrada nas pendentes' };
  }

  // Montar linha para OPS_REJEITADAS
  // Colunas: id | data_prova | hora_cadastro | usuario_cadastro | op | referencia | segmento | etapa | servico | modelista | pilotista | situacao | motivos | observacao | rejeitado_por | data_rejeicao | motivo_rejeicao
  var novaLinha = [
    registroOriginal[0],  // id
    registroOriginal[1],  // data_prova
    registroOriginal[2],  // hora_cadastro
    registroOriginal[3],  // usuario_cadastro
    registroOriginal[4],  // op
    registroOriginal[5],  // referencia
    registroOriginal[6],  // segmento
    registroOriginal[7],  // etapa
    registroOriginal[8],  // servico
    registroOriginal[9],  // modelista
    registroOriginal[10], // pilotista
    registroOriginal[11], // situacao
    registroOriginal[12], // motivos
    registroOriginal[13], // observacao
    sanitizar(corpo.usuario),                // rejeitado_por
    agora('dd/MM/yyyy HH:mm:ss'),            // data_rejeicao
    motivoRejeicao                            // motivo_rejeicao
  ];

  var abaRejeitadas = obterAba(NOME_ABA_OPS_REJEITADAS);
  abaRejeitadas.appendRow(novaLinha);

  // Remover da aba de pendentes
  abaPendentes.deleteRow(linhaEncontrada);

  return { success: true, message: 'OP rejeitada com sucesso', data: { id: idBuscado } };
}

// ---- EDITAR OP PENDENTE ----
function processarEditarOpPendente(corpo) {
  var auth = verificarPapel(corpo.usuario, 'DESENVOLVEDOR');
  if (!auth.autorizado) return { success: false, message: auth.message };

  var idBuscado = sanitizar(corpo.id);
  if (!idBuscado) return { success: false, message: 'ID da OP é obrigatório' };

  var campos = corpo.fields;
  if (!campos || typeof campos !== 'object') {
    return { success: false, message: 'Campos para edição não informados' };
  }

  var aba = obterAba(NOME_ABA_OPS_PENDENTES);
  var dados = aba.getDataRange().getValues();
  var cabecalhos = dados[0].map(function(c) { return String(c).trim(); });
  var indiceColunaId = cabecalhos.indexOf('id');
  var linhaEncontrada = -1;

  for (var i = 1; i < dados.length; i++) {
    if (String(dados[i][indiceColunaId]).trim() === idBuscado) {
      linhaEncontrada = i + 1;
      break;
    }
  }

  if (linhaEncontrada === -1) {
    return { success: false, message: 'OP não encontrada nas pendentes' };
  }

  // Atualizar apenas os campos informados
  var camposAtualizados = [];
  var chavesPermitidas = ['data_prova', 'op', 'referencia', 'segmento', 'etapa', 'servico', 'modelista', 'situacao', 'motivos', 'observacao'];

  for (var chave in campos) {
    if (campos.hasOwnProperty(chave)) {
      if (chavesPermitidas.indexOf(chave) === -1) continue; // ignora campos não editáveis
      var indiceColuna = cabecalhos.indexOf(chave);
      if (indiceColuna === -1) continue;
      var limiteTexto = (chave === 'motivos') ? 2000 : (chave === 'observacao' ? 1000 : TAMANHO_MAX_TEXTO);
      var valorSanitizado = sanitizar(campos[chave], limiteTexto);
      aba.getRange(linhaEncontrada, indiceColuna + 1).setValue(valorSanitizado);
      camposAtualizados.push(chave);
    }
  }

  return {
    success: true,
    message: 'OP atualizada com sucesso',
    data: { id: idBuscado, campos_atualizados: camposAtualizados }
  };
}

// ---- SALVAR INDICADOR ----
function processarSalvarIndicador(corpo) {
  var auth = verificarPapel(corpo.usuario, 'DESENVOLVEDOR');
  if (!auth.autorizado) return { success: false, message: auth.message };

  var termo = sanitizar(corpo.termo_customizado).toUpperCase();
  var categoria = sanitizar(corpo.categoria).toUpperCase();
  var exibir = corpo.exibir_nos_graficos === true || String(corpo.exibir_nos_graficos).toUpperCase() === 'TRUE';

  if (!termo) return { success: false, message: 'Termo é obrigatório' };
  if (!categoria) return { success: false, message: 'Categoria é obrigatória' };

  var categoriasValidas = ['SITUACAO', 'MOTIVO', 'SEGMENTO', 'MODELISTA', 'SERVICO', 'ETAPA'];
  if (categoriasValidas.indexOf(categoria) === -1) {
    return { success: false, message: 'Categoria inválida. Válidas: ' + categoriasValidas.join(', ') };
  }

  var aba = obterAba(NOME_ABA_CONFIG_INDIC);
  var dados = aba.getDataRange().getValues();
  var linhaExistente = -1;

  // Verificar se já existe esse termo+categoria
  for (var i = 1; i < dados.length; i++) {
    if (String(dados[i][0]).trim().toUpperCase() === termo &&
        String(dados[i][1]).trim().toUpperCase() === categoria) {
      linhaExistente = i + 1;
      break;
    }
  }

  if (linhaExistente > -1) {
    // Atualizar existente
    aba.getRange(linhaExistente, 3).setValue(exibir ? 'TRUE' : 'FALSE');
    aba.getRange(linhaExistente, 4).setValue(sanitizar(corpo.usuario));
    aba.getRange(linhaExistente, 5).setValue(agora('dd/MM/yyyy HH:mm:ss'));
    return { success: true, message: 'Indicador atualizado com sucesso' };
  } else {
    // Inserir novo
    aba.appendRow([
      termo,
      categoria,
      exibir ? 'TRUE' : 'FALSE',
      sanitizar(corpo.usuario),
      agora('dd/MM/yyyy HH:mm:ss')
    ]);
    return { success: true, message: 'Indicador cadastrado com sucesso' };
  }
}

// ---- TOGGLE INDICADOR ----
function processarToggleIndicador(corpo) {
  var auth = verificarPapel(corpo.usuario, 'DESENVOLVEDOR');
  if (!auth.autorizado) return { success: false, message: auth.message };

  var termo = sanitizar(corpo.termo_customizado).toUpperCase();
  var categoria = sanitizar(corpo.categoria).toUpperCase();

  if (!termo || !categoria) {
    return { success: false, message: 'Termo e categoria são obrigatórios' };
  }

  var aba = obterAba(NOME_ABA_CONFIG_INDIC);
  var dados = aba.getDataRange().getValues();

  for (var i = 1; i < dados.length; i++) {
    if (String(dados[i][0]).trim().toUpperCase() === termo &&
        String(dados[i][1]).trim().toUpperCase() === categoria) {
      var valorAtual = String(dados[i][2]).trim().toUpperCase();
      var novoValor = (valorAtual === 'TRUE') ? 'FALSE' : 'TRUE';
      aba.getRange(i + 1, 3).setValue(novoValor);
      return { success: true, message: 'Indicador alternado para ' + novoValor, data: { exibir_nos_graficos: novoValor } };
    }
  }

  return { success: false, message: 'Indicador não encontrado' };
}

// =============================================================================
// FUNÇÕES AUXILIARES DE NEGÓCIO
// =============================================================================

/**
 * Move uma OP da aba OPS_PENDENTES para OPS_APROVADAS.
 * @param {string} idBuscado - ID da OP.
 * @param {string} aprovadoPor - Usuário que aprovou.
 * @return {Object} Resultado da operação.
 */
function moverOpParaAprovada(idBuscado, aprovadoPor) {
  var abaPendentes = obterAba(NOME_ABA_OPS_PENDENTES);
  var dados = abaPendentes.getDataRange().getValues();
  var cabecalhos = dados[0];
  var indiceColunaId = cabecalhos.indexOf('id');
  var linhaEncontrada = -1;
  var registroOriginal = null;

  for (var i = 1; i < dados.length; i++) {
    if (String(dados[i][indiceColunaId]).trim() === idBuscado) {
      linhaEncontrada = i + 1;
      registroOriginal = dados[i];
      break;
    }
  }

  if (linhaEncontrada === -1) {
    return { success: false, message: 'OP "' + idBuscado + '" não encontrada nas pendentes' };
  }

  // Montar linha para OPS_APROVADAS
  // Colunas: id | data_prova | hora_cadastro | usuario_cadastro | op | referencia | segmento | etapa | servico | modelista | pilotista | situacao | motivos | observacao | aprovado_por | data_aprovacao
  var novaLinha = [
    registroOriginal[0],  // id
    registroOriginal[1],  // data_prova
    registroOriginal[2],  // hora_cadastro
    registroOriginal[3],  // usuario_cadastro
    registroOriginal[4],  // op
    registroOriginal[5],  // referencia
    registroOriginal[6],  // segmento
    registroOriginal[7],  // etapa
    registroOriginal[8],  // servico
    registroOriginal[9],  // modelista
    registroOriginal[10], // pilotista
    registroOriginal[11], // situacao
    registroOriginal[12], // motivos
    registroOriginal[13], // observacao
    aprovadoPor,                              // aprovado_por
    agora('dd/MM/yyyy HH:mm:ss')              // data_aprovacao
  ];

  var abaAprovadas = obterAba(NOME_ABA_OPS_APROVADAS);
  abaAprovadas.appendRow(novaLinha);

  // Remover da aba de pendentes
  abaPendentes.deleteRow(linhaEncontrada);

  return { success: true, message: 'OP aprovada com sucesso', data: { id: idBuscado } };
}

/**
 * Aplica filtros sobre um array de registros de OPs.
 * Filtros suportados: data_inicio, data_fim, segmento, etapa, servico, modelista.
 * @param {Object[]} registros
 * @param {Object} params - Parâmetros com os filtros.
 * @return {Object[]}
 */
function aplicarFiltrosOps(registros, params) {
  var dataInicio = sanitizar(params.data_inicio);
  var dataFim    = sanitizar(params.data_fim);

  // Sanitizar e ignorar valores sentinela ("Todos", "Todas", "TODOS")
  function filtroAtivo(val) {
    var v = sanitizar(val).toUpperCase();
    return v && v !== 'TODOS' && v !== 'TODAS';
  }

  var segmento   = filtroAtivo(params.segmento)  ? sanitizar(params.segmento).toUpperCase()  : '';
  var etapa      = filtroAtivo(params.etapa)      ? sanitizar(params.etapa).toUpperCase()      : '';
  var servico    = filtroAtivo(params.servico)    ? sanitizar(params.servico).toUpperCase()    : '';
  var modelista  = filtroAtivo(params.modelista)  ? sanitizar(params.modelista).toUpperCase()  : '';
  var pilotista  = filtroAtivo(params.pilotista)  ? sanitizar(params.pilotista).toUpperCase()  : '';

  var dtInicio = parseDateBR(dataInicio);
  var dtFim    = parseDateBR(dataFim);

  return registros.filter(function(r) {
    if (dtInicio || dtFim) {
      var dtProva = parseDateBR(r.data_prova);
      if (!dtProva) return false;
      if (dtInicio && dtProva < dtInicio) return false;
      if (dtFim && dtProva > dtFim) return false;
    }

    if (segmento && String(r.segmento || '').trim().toUpperCase() !== segmento) return false;
    if (etapa && String(r.etapa || '').trim().toUpperCase() !== etapa) return false;
    if (servico && String(r.servico || '').trim().toUpperCase() !== servico) return false;
    if (modelista && String(r.modelista || '').trim().toUpperCase() !== modelista) return false;
    if (pilotista && String(r.pilotista || '').trim().toUpperCase() !== pilotista) return false;

    return true;
  });
}

/**
 * Normaliza a situação para comparações consistentes.
 * @param {*} valor
 * @return {string}
 */
function normalizarSituacao(valor) {
  return String(valor || '').trim().toUpperCase();
}

/**
 * Calcula o Pareto de motivos para uma situação específica.
 * Retorna os top 8 motivos, ordenados por quantidade decrescente.
 * @param {Object[]} registros - Array de registros de OPs.
 * @param {string} situacaoAlvo - Situação para filtrar (ex.: 'REPILOTAGEM').
 * @return {Object[]} Array com { motivo, quantidade }.
 */
function calcularPareto(registros, situacaoAlvo) {
  var contagemMotivos = {};

  registros.forEach(function(r) {
    var situacao = normalizarSituacao(r.situacao);
    if (situacao !== situacaoAlvo) return;

    var motivosStr = String(r.motivos || '').trim();
    if (!motivosStr) return;

    var listaMotivos = motivosStr.indexOf('||') !== -1 ? motivosStr.split('||') : (motivosStr.indexOf(';') !== -1 ? motivosStr.split(';') : [motivosStr]);
    listaMotivos.forEach(function(m) {
      var motivo = m.trim().toUpperCase();
      if (!motivo) return;
      contagemMotivos[motivo] = (contagemMotivos[motivo] || 0) + 1;
    });
  });

  var chaves = Object.keys(contagemMotivos);
  chaves.sort(function(a, b) { return contagemMotivos[b] - contagemMotivos[a]; });
  var top8Chaves = chaves.slice(0, 8);

  var totalTop8 = top8Chaves.reduce(function(acc, k) { return acc + contagemMotivos[k]; }, 0);
  var cum = 0;

  var resultado = top8Chaves.map(function(motivo, idx) {
    var qtd = contagemMotivos[motivo];
    cum += qtd;
    var pctAcum = totalTop8 > 0 ? Math.round((cum / totalTop8) * 100) : 0;
    var pctNum = totalTop8 > 0 ? (qtd / totalTop8) * 100 : 0;
    var pctIndiv = (pctNum % 1 === 0 ? pctNum.toFixed(0) : pctNum.toFixed(1)) + '%';
    return {
      codigo: 'M' + (idx + 1),
      motivo: motivo,
      quantidade: qtd,
      pctIndividual: pctIndiv,
      pctAcumulado: pctAcum
    };
  });

  return resultado;
}

/**
 * Calcula a próxima etapa sugerida com base nas etapas já registradas para uma OP.
 * @param {string[]} etapasExistentes - Etapas já cadastradas.
 * @return {string} Etapa sugerida.
 */
function calcularProximaEtapa(etapasExistentes) {
  if (!etapasExistentes || etapasExistentes.length === 0) {
    return 'PILOTO';
  }

  // Verificar se PILOTO já existe
  var temPiloto = etapasExistentes.some(function(e) {
    return e === 'PILOTO';
  });

  if (!temPiloto) return 'PILOTO';

  // Encontrar o maior número de repilotagem
  var maiorNumero = 0;
  etapasExistentes.forEach(function(e) {
    // Padrão: "N° REPILOTAGEM" ou "Nº REPILOTAGEM"
    var match = e.match(/^(\d+)[°º]\s*REPILOTAGEM$/i);
    if (match) {
      var num = parseInt(match[1], 10);
      if (num > maiorNumero) maiorNumero = num;
    }
  });

  var proximoNumero = maiorNumero + 1;
  return proximoNumero + '° REPILOTAGEM';
}

// =============================================================================
// SETUP INICIAL — Executar manualmente para preparar a planilha
// =============================================================================

/**
 * Cria todas as 5 abas com cabeçalhos corretos e popula dados iniciais.
 * Executar manualmente pelo editor do Apps Script.
 */
function setupInitialData() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();

  // --- Aba USUARIOS ---
  var abaUsuarios = criarAbaSePreciso(planilha, NOME_ABA_USUARIOS, [
    'usuario', 'senha', 'nome', 'papel', 'ativo'
  ]);
  // Criar usuário admin padrão se a aba estiver vazia
  if (abaUsuarios.getLastRow() <= 1) {
    abaUsuarios.appendRow(['admin', 'admin123', 'Administrador', 'DESENVOLVEDOR', 'TRUE']);
  }

  // --- Aba OPS_PENDENTES ---
  criarAbaSePreciso(planilha, NOME_ABA_OPS_PENDENTES, [
    'id', 'data_prova', 'hora_cadastro', 'usuario_cadastro', 'op', 'referencia',
    'segmento', 'etapa', 'servico', 'modelista', 'pilotista', 'situacao', 'motivos', 'observacao', 'data_criacao'
  ]);

  // --- Aba OPS_APROVADAS ---
  criarAbaSePreciso(planilha, NOME_ABA_OPS_APROVADAS, [
    'id', 'data_prova', 'hora_cadastro', 'usuario_cadastro', 'op', 'referencia',
    'segmento', 'etapa', 'servico', 'modelista', 'pilotista', 'situacao', 'motivos', 'observacao',
    'aprovado_por', 'data_aprovacao'
  ]);

  // --- Aba CONFIG_INDICADORES ---
  var abaConfig = criarAbaSePreciso(planilha, NOME_ABA_CONFIG_INDIC, [
    'termo_customizado', 'categoria', 'exibir_nos_graficos', 'cadastrado_por', 'data_cadastro'
  ]);
  // Popular com valores padrão se estiver vazia
  if (abaConfig.getLastRow() <= 1) {
    var dataSetup = agora('dd/MM/yyyy HH:mm:ss');
    var usuarioSetup = 'SISTEMA';

    var indicadoresPadrao = [
      // SEGMENTO
      ['JEANS', 'SEGMENTO', 'TRUE', usuarioSetup, dataSetup],
      ['MODINHA', 'SEGMENTO', 'TRUE', usuarioSetup, dataSetup],
      // ETAPA
      ['PILOTO', 'ETAPA', 'TRUE', usuarioSetup, dataSetup],
      ['1° REPILOTAGEM', 'ETAPA', 'TRUE', usuarioSetup, dataSetup],
      ['2° REPILOTAGEM', 'ETAPA', 'TRUE', usuarioSetup, dataSetup],
      ['3° REPILOTAGEM', 'ETAPA', 'TRUE', usuarioSetup, dataSetup],
      // SERVICO
      ['MODELAGEM', 'SERVICO', 'TRUE', usuarioSetup, dataSetup],
      ['COSTURA', 'SERVICO', 'TRUE', usuarioSetup, dataSetup],
      ['CORTE', 'SERVICO', 'TRUE', usuarioSetup, dataSetup],
      ['ACABAMENTO', 'SERVICO', 'TRUE', usuarioSetup, dataSetup],
      ['GRADUAÇÃO', 'SERVICO', 'TRUE', usuarioSetup, dataSetup],
      ['PILOTAGEM', 'SERVICO', 'TRUE', usuarioSetup, dataSetup],
      ['ESTAMPARIA', 'SERVICO', 'TRUE', usuarioSetup, dataSetup],
      // MODELISTA
      ['Evair', 'MODELISTA', 'TRUE', usuarioSetup, dataSetup],
      ['Nilda Ferreira Brito', 'MODELISTA', 'TRUE', usuarioSetup, dataSetup],
      ['Elisangela', 'MODELISTA', 'TRUE', usuarioSetup, dataSetup],
      ['Cintia Lopes', 'MODELISTA', 'TRUE', usuarioSetup, dataSetup],
      // PILOTISTA
      ['Ana Paula', 'PILOTISTA', 'TRUE', usuarioSetup, dataSetup],
      ['Fernanda', 'PILOTISTA', 'TRUE', usuarioSetup, dataSetup],
      ['Juliana', 'PILOTISTA', 'TRUE', usuarioSetup, dataSetup],
      // SITUACAO
      ['APROVADA', 'SITUACAO', 'TRUE', usuarioSetup, dataSetup],
      ['APROVADA COM AJUSTES', 'SITUACAO', 'TRUE', usuarioSetup, dataSetup],
      ['REPROVADA', 'SITUACAO', 'TRUE', usuarioSetup, dataSetup],
      ['REPILOTAGEM', 'SITUACAO', 'TRUE', usuarioSetup, dataSetup],
      ['STANDBY', 'SITUACAO', 'TRUE', usuarioSetup, dataSetup]
    ];

    indicadoresPadrao.forEach(function(linha) {
      abaConfig.appendRow(linha);
    });
  }

  // --- Aba OPS_REJEITADAS ---
  criarAbaSePreciso(planilha, NOME_ABA_OPS_REJEITADAS, [
    'id', 'data_prova', 'hora_cadastro', 'usuario_cadastro', 'op', 'referencia',
    'segmento', 'etapa', 'servico', 'modelista', 'pilotista', 'situacao', 'motivos', 'observacao',
    'rejeitado_por', 'data_rejeicao', 'motivo_rejeicao'
  ]);

  Logger.log('Setup inicial concluído com sucesso!');
  Logger.log('ATENÇÃO: Defina a propriedade API_TOKEN nas Script Properties do projeto.');
  Logger.log('Menu: Arquivo > Configurações do Projeto > Script Properties > Adicionar > Chave=API_TOKEN, Valor=<seu_token>');
}

/**
 * Cria uma aba com os cabeçalhos informados, caso ela ainda não exista.
 * Se já existir, retorna a aba existente sem alterá-la.
 * @param {Spreadsheet} planilha
 * @param {string} nomeAba
 * @param {string[]} cabecalhos
 * @return {Sheet} A aba criada ou existente.
 */
function criarAbaSePreciso(planilha, nomeAba, cabecalhos) {
  var aba = planilha.getSheetByName(nomeAba);
  if (aba) return aba;

  aba = planilha.insertSheet(nomeAba);
  aba.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);

  // Formatar cabeçalho (negrito e fundo cinza)
  var rangeCabecalho = aba.getRange(1, 1, 1, cabecalhos.length);
  rangeCabecalho.setFontWeight('bold');
  rangeCabecalho.setBackground('#d9d9d9');

  // Congelar primeira linha
  aba.setFrozenRows(1);

  return aba;
}
