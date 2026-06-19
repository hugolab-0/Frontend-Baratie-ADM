/***********************************************************************************************************
 *
 * Objetivo: Arquivo responsável pela parte do FRONT-END (fetch + manipulação do modal e da tabela)
 *           referente ao CRUD de Refeição
 * Autor: Geovane
 * Versão: 1.0
 *
 * OBSERVAÇÕES IMPORTANTES (ajustar conforme o restante do projeto):
 * 1) ID_ADM: o backend (refeicao_controller.js -> validarRefeicao) exige o campo "id_adm" no
 *    cadastro/atualização da refeição, mas não existe esse campo no modal. Está sendo usado um valor
 *    salvo no localStorage (chave "id_adm"). Troque pela lógica real de login/sessão do administrador.
 * 2) Público alvo / Tipo de refeição / Restrições: não há controllers/rotas desses CRUDs nos arquivos
 *    enviados. As funções de carregamento desses <select> tentam endpoints "padrão" (ex: /publico_alvo)
 *    e falham silenciosamente (apenas um aviso no console) caso eles não existam. Ajuste as constantes
 *    de URL abaixo assim que as rotas reais existirem.
 * 3) Estrutura da resposta da API: como o arquivo de DAO (model) não foi enviado, os nomes dos campos
 *    retornados (ex: nome do público alvo, nome do tipo de refeição) foram assumidos com fallback para
 *    o próprio ID. Ajuste as funções "obterNome*" se os nomes dos campos forem diferentes.
 *
 **********************************************************************************************************/

// ======================================================================
// CONFIGURAÇÃO DA API
// ======================================================================
const API_BASE = 'http://localhost:8080/v1/baratiefit';

const API_REFEICAO = `${API_BASE}/refeicao`;
const API_REFEICAO_ALIMENTO = `${API_BASE}/refeicao/alimento`;
const API_ALIMENTO = `${API_BASE}/alimento`;

// Endpoints "assumidos" (ainda não existem nos arquivos enviados) - ajustar quando existirem
const API_PUBLICO_ALVO = `${API_BASE}/publico_alvo`;
const API_TIPO_REFEICAO = `${API_BASE}/tipo_refeicao`;
const API_RESTRICAO = `${API_BASE}/restricao`;

// ======================================================================
// ESTADO LOCAL
// ======================================================================
let refeicaoEmEdicaoId = null;     // null = cadastro novo | número = edição
let cacheAlimentos = [];           // cache da lista de alimentos (para popular select e exibir nomes)
let cachePublicoAlvo = [];
let cacheTipoRefeicao = [];
let alimentosTemp = [];            // alimentos adicionados na refeição que está sendo criada/editada
// Estrutura de cada item de alimentosTemp:
// { id_alimento, nome, quantidade_g, unidade_medida, id (opcional, se já existir vínculo salvo) }

// ======================================================================
// REFERÊNCIAS DO DOM
// ======================================================================
const modalRefeicao   = document.getElementById('modalRefeicao');
const formRefeicao     = document.getElementById('formRefeicao');
const tbodyRefeicoes   = document.getElementById('conteudoRefeicoes');

const inputIdRefeicao        = document.getElementById('idRefeicao');
const inputNomeRefeicao      = document.getElementById('nomeRefeicao');
const inputModoPreparo       = document.getElementById('modoPreparoRefeicao');
const inputDescricaoRefeicao = document.getElementById('descricaoRefeicao');
const inputApoioDecisao      = document.getElementById('apoioDecisaoRefeicao');
const inputImgRefeicao       = document.getElementById('imgRefeicao');

const selectPublico   = document.getElementById('selectPublico');
const selectRefeicao  = document.getElementById('selectRefeicao'); // tipo de refeição
const selectRestricao = document.getElementById('selectRestricao');

const selectAlimento  = document.getElementById('selectAlimento');
const inputQtdeAlimento = document.getElementById('qtdeAlimento');
const selectUnidadeMedidaAlimento = document.getElementById('selectUnidadeMedidaAlimento');
const btnAddAlimentoRefeicao = document.getElementById('addAlimentoRefeicao');
const listaAlimentosRefeicaoEl = document.getElementById('listaAlimentosRefeicao');

const btnCadastrarRefeicao = document.getElementById('cadastrarRefeicao');
const btnVisualizarRefeicoes = document.getElementById('visualizarRefeicoes');
const btnSalvarRefeicao = document.getElementById('salvarRefeicao');
const btnCancelarRefeicao = document.getElementById('cancelarRefeicao');
const btnModalClose = document.getElementById('modalClose');

// ======================================================================
// INICIALIZAÇÃO
// ======================================================================

document.addEventListener('DOMContentLoaded', function () {
    listarRefeicoes();
    carregarAlimentosSelect();
    carregarPublicoAlvoSelect();
    carregarTipoRefeicaoSelect();
    carregarRestricaoSelect();

    btnCadastrarRefeicao?.addEventListener('click', () => abrirModalRefeicao('novo'));
btnVisualizarRefeicoes?.addEventListener('click', () => {
        const tabelaRefeicoes = document.getElementById('tableRefeicoes');
        const tabelaAlimentos = document.getElementById('tableAlimentos');

        // 1. Mostra a tabela de refeições
        tabelaRefeicoes?.classList.add('active');

        // 2. Esconde a tabela de alimentos completamente (classe + inline)
        if (tabelaAlimentos) {
            tabelaAlimentos.classList.remove('active');
            tabelaAlimentos.style.display = ''; // Limpa o inline antigo
        }

        // 3. Atualiza os dados do banco e faz o scroll
        listarRefeicoes();
        tabelaRefeicoes?.scrollIntoView({ behavior: 'smooth' });
    });

    btnModalClose?.addEventListener('click', fecharModalRefeicao);
    btnCancelarRefeicao?.addEventListener('click', fecharModalRefeicao);
    btnSalvarRefeicao?.addEventListener('click', salvarRefeicao);
    btnAddAlimentoRefeicao?.addEventListener('click', adicionarAlimentoTemp);

    // Delegação de evento para os botões "editar" e "excluir" da tabela de refeições
    tbodyRefeicoes?.addEventListener('click', function (event) {
        const botao = event.target.closest('button[data-id]');
        if (!botao) return;

        const id = botao.getAttribute('data-id');

        if (botao.classList.contains('green')) {
            editarRefeicao(id);
        } else if (botao.classList.contains('red')) {
            excluirRefeicao(id);
        }
    });
});

// ======================================================================
// CARREGAMENTO DOS SELECTS (combos)
// ======================================================================

// Carrega a lista de alimentos cadastrados para popular o <select> do modal
async function carregarAlimentosSelect() {
    try {
        const resposta = await fetch(API_ALIMENTO);
        const dados = await resposta.json();

        const lista = dados?.response?.alimento || dados?.response || [];
        cacheAlimentos = Array.isArray(lista) ? lista : [];

        selectAlimento.innerHTML = '<option value="" disabled selected>Selecione o alimento...</option>';

        cacheAlimentos.forEach(function (alimento) {
            const option = document.createElement('option');
            option.value = alimento.id;
            option.textContent = alimento.nome;
            selectAlimento.appendChild(option);
        });

    } catch (error) {
        console.warn('Não foi possível carregar a lista de alimentos.', error);
    }
}

// Carrega público alvo (endpoint assumido - ajustar quando a rota real existir)
async function carregarPublicoAlvoSelect() {
    try {
        const resposta = await fetch(API_PUBLICO_ALVO);
        if (!resposta.ok) throw new Error('Endpoint de público alvo indisponível');
        const dados = await resposta.json();

        const lista = dados?.response?.publico_alvo || dados?.response || [];
        cachePublicoAlvo = Array.isArray(lista) ? lista : [];

        selectPublico.innerHTML = '<option value="" disabled selected>Selecione o público alvo...</option>';

        cachePublicoAlvo.forEach(function (item) {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.nome;
            selectPublico.appendChild(option);
        });

    } catch (error) {
        console.warn('[Ajustar API_PUBLICO_ALVO] Não foi possível carregar público alvo.', error);
    }
}

// Carrega tipo de refeição (endpoint assumido - ajustar quando a rota real existir)
async function carregarTipoRefeicaoSelect() {
    try {
        const resposta = await fetch(API_TIPO_REFEICAO);
        if (!resposta.ok) throw new Error('Endpoint de tipo de refeição indisponível');
        const dados = await resposta.json();

        const lista = dados?.response?.tipo_refeicao || dados?.response || [];
        cacheTipoRefeicao = Array.isArray(lista) ? lista : [];

        selectRefeicao.innerHTML = '<option value="" disabled selected>Selecione o tipo de refeição...</option>';

        cacheTipoRefeicao.forEach(function (item) {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.nome;
            selectRefeicao.appendChild(option);
        });

    } catch (error) {
        console.warn('[Ajustar API_TIPO_REFEICAO] Não foi possível carregar tipo de refeição.', error);
    }
}

// Carrega restrições (endpoint assumido - ajustar quando a rota real existir)
async function carregarRestricaoSelect() {
    try {
        const resposta = await fetch(API_RESTRICAO);
        if (!resposta.ok) throw new Error('Endpoint de restrições indisponível');
        const dados = await resposta.json();

        const lista = dados?.response?.restricao || dados?.response || [];

        selectRestricao.innerHTML = '<option value="" disabled selected>Selecione as restrições...</option>';

        lista.forEach(function (item) {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.nome;
            selectRestricao.appendChild(option);
        });

    } catch (error) {
        console.warn('[Ajustar API_RESTRICAO] Não foi possível carregar restrições.', error);
    }
}

// ======================================================================
// LISTA TEMPORÁRIA DE ALIMENTOS DA REFEIÇÃO (dentro do modal)
// ======================================================================

function adicionarAlimentoTemp() {
    const idAlimento = selectAlimento.value;
    const quantidade = inputQtdeAlimento.value;
    const unidade = selectUnidadeMedidaAlimento.value;

    if (!idAlimento || !quantidade || Number(quantidade) <= 0 || !unidade) {
        alert('Selecione o alimento, a quantidade e a unidade de medida antes de adicionar.');
        return;
    }

    const alimento = cacheAlimentos.find(a => String(a.id) === String(idAlimento));

    alimentosTemp.push({
        id_alimento: Number(idAlimento),
        nome: alimento ? alimento.nome : `Alimento #${idAlimento}`,
        quantidade_g: Number(quantidade),
        unidade_medida: unidade
    });

    // Limpa os campos da linha de adição
    selectAlimento.selectedIndex = 0;
    inputQtdeAlimento.value = '';
    selectUnidadeMedidaAlimento.selectedIndex = 0;

    renderizarAlimentosTemp();
}

function removerAlimentoTemp(index) {
    alimentosTemp.splice(index, 1);
    renderizarAlimentosTemp();
}

function renderizarAlimentosTemp() {
    if (!listaAlimentosRefeicaoEl) return;

    if (alimentosTemp.length === 0) {
        listaAlimentosRefeicaoEl.innerHTML = '<p><em>Nenhum alimento adicionado ainda.</em></p>';
        return;
    }

    listaAlimentosRefeicaoEl.innerHTML = alimentosTemp.map(function (item, index) {
        return `
            <div class="relacao-1-muitos">
                <span><strong>${item.nome}</strong> - ${item.quantidade_g} ${item.unidade_medida}</span>
                <button type="button" class="button red" data-remover-index="${index}">remover</button>
            </div>
        `;
    }).join('');

    listaAlimentosRefeicaoEl.querySelectorAll('[data-remover-index]').forEach(function (botao) {
        botao.addEventListener('click', function () {
            removerAlimentoTemp(Number(botao.getAttribute('data-remover-index')));
        });
    });
}

// ======================================================================
// MODAL - abrir / fechar / limpar
// ======================================================================

function abrirModalRefeicao(modo, refeicao) {
    limparFormRefeicao();

    if (modo === 'editar' && refeicao) {
        refeicaoEmEdicaoId = refeicao.id;
        inputIdRefeicao.value = refeicao.id;
        inputNomeRefeicao.value = refeicao.nome || '';
        inputModoPreparo.value = refeicao.modo_preparo || '';
        inputDescricaoRefeicao.value = refeicao.descricao || '';
        inputApoioDecisao.value = refeicao.apoio_decisao || '';

        if (refeicao.id_publico_alvo) selectPublico.value = refeicao.id_publico_alvo;
        if (refeicao.id_tipo_refeicao) selectRefeicao.value = refeicao.id_tipo_refeicao;

        document.querySelector('#modalRefeicao h2').textContent = 'Editar refeição';
    } else {
        refeicaoEmEdicaoId = null;
        document.querySelector('#modalRefeicao h2').textContent = 'Nova refeição';
    }

    renderizarAlimentosTemp();
    modalRefeicao.classList.add('active');
}

function fecharModalRefeicao() {
    modalRefeicao.classList.remove('active');
    limparFormRefeicao();
}

function limparFormRefeicao() {
    refeicaoEmEdicaoId = null;
    alimentosTemp = [];
    formRefeicao.reset();
    inputIdRefeicao.value = '';
    if (listaAlimentosRefeicaoEl) listaAlimentosRefeicaoEl.innerHTML = '';
}

// ======================================================================
// LISTAR REFEIÇÕES
// ======================================================================

async function listarRefeicoes() {
    try {
        const resposta = await fetch(API_REFEICAO);
        const dados = await resposta.json();

        if (!resposta.ok) {
            tbodyRefeicoes.innerHTML = `<tr><td colspan="11">${dados.message || 'Nenhuma refeição encontrada.'}</td></tr>`;
            atualizarCardMetricaRefeicoes(0);
            return;
        }

        const lista = dados?.response?.refeicao || dados?.response || [];

        atualizarCardMetricaRefeicoes(lista.length);
        await renderizarTabelaRefeicoes(lista);

    } catch (error) {
        console.error('Erro ao listar refeições:', error);
        tbodyRefeicoes.innerHTML = '<tr><td colspan="11">Erro ao carregar refeições.</td></tr>';
    }
}

async function renderizarTabelaRefeicoes(lista) {
    if (!lista || lista.length === 0) {
        tbodyRefeicoes.innerHTML = '<tr><td colspan="11">Nenhuma refeição cadastrada.</td></tr>';
        return;
    }

    // Busca os alimentos vinculados de cada refeição em paralelo
    const linhasHtml = await Promise.all(lista.map(async function (refeicao) {
        const alimentosVinculados = await buscarAlimentosDaRefeicao(refeicao.id);

        const alimentosNomes = alimentosVinculados.map(function (item) {
            const alimento = cacheAlimentos.find(a => String(a.id) === String(item.id_alimento));
            return `<p><strong>Nome: </strong>${alimento ? alimento.nome : ('#' + item.id_alimento)}</p>`;
        }).join('') || '<p><strong>Nome: </strong>none</p>';

        const qtdesHtml = alimentosVinculados.map(item => `<p>${item.quantidade_g}</p>`).join('') || '<p>-</p>';
        const umHtml = alimentosVinculados.map(item => `<p>${item.unidade_medida}</p>`).join('') || '<p>-</p>';

        return `
            <tr>
                <td>${escapeHtml(refeicao.nome)}</td>
                <td>${escapeHtml(refeicao.modo_preparo)}</td>
                <td>${escapeHtml(refeicao.descricao)}</td>
                <td>${escapeHtml(refeicao.apoio_decisao)}</td>
                <td><div class="relacao-1-muitos"><p><strong>Nome: </strong>${obterNomePublicoAlvo(refeicao.id_publico_alvo)}</p></div></td>
                <td><div class="relacao-1-muitos"><p><strong>Nome: </strong>${obterNomeTipoRefeicao(refeicao.id_tipo_refeicao)}</p></div></td>
                <td><div class="relacao-1-muitos"><p><strong>Nome: </strong>none</p></div></td>
                <td><div class="relacao-1-muitos">${alimentosNomes}</div></td>
                <td><div class="relacao-1-muitos">${qtdesHtml}</div></td>
                <td><div class="relacao-1-muitos">${umHtml}</div></td>
                <td>
                    <button type="button" class="button green" data-id="${refeicao.id}">editar</button>
                    <button type="button" class="button red" data-id="${refeicao.id}">excluir</button>
                </td>
            </tr>
        `;
    }));

    tbodyRefeicoes.innerHTML = linhasHtml.join('');
}

function obterNomePublicoAlvo(id) {
    const item = cachePublicoAlvo.find(p => String(p.id) === String(id));
    return item ? item.nome : (id ? `#${id}` : 'none');
}

function obterNomeTipoRefeicao(id) {
    const item = cacheTipoRefeicao.find(t => String(t.id) === String(id));
    return item ? item.nome : (id ? `#${id}` : 'none');
}

function atualizarCardMetricaRefeicoes(quantidade) {
    // Atualiza o card "Refeições" -> "Cadastradas no sistema" (primeiro card-metrica da tela)
    const cardNumero = document.querySelectorAll('.card-metrica .numero')[0];
    if (cardNumero) cardNumero.textContent = quantidade;
}

function escapeHtml(texto) {
    if (texto == null) return '';
    return String(texto)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

// ======================================================================
// BUSCAR ALIMENTOS DE UMA REFEIÇÃO (refeicao_alimento)
// ======================================================================

async function buscarAlimentosDaRefeicao(idRefeicao) {
    try {
        const resposta = await fetch(`${API_REFEICAO_ALIMENTO}/refeicao/${idRefeicao}`);
        const dados = await resposta.json();

        if (!resposta.ok) return [];

        return dados?.response || [];

    } catch (error) {
        console.error(`Erro ao buscar alimentos da refeição ${idRefeicao}:`, error);
        return [];
    }
}

// ======================================================================
// SALVAR (CADASTRAR / ATUALIZAR) REFEIÇÃO
// ======================================================================

async function salvarRefeicao() {
    const nome = inputNomeRefeicao.value.trim();
    const modoPreparo = inputModoPreparo.value.trim();
    const descricao = inputDescricaoRefeicao.value.trim();
    const apoioDecisao = inputApoioDecisao.value.trim();
    const idPublicoAlvo = selectPublico.value;
    const idTipoRefeicao = selectRefeicao.value;
    const arquivoImg = inputImgRefeicao.files[0];

    if (!nome || !modoPreparo || !descricao || !apoioDecisao || !idPublicoAlvo || !idTipoRefeicao) {
        alert('Preencha todos os campos obrigatórios antes de salvar.');
        return;
    }

    if (!refeicaoEmEdicaoId && !arquivoImg) {
        alert('A imagem da refeição é obrigatória no cadastro.');
        return;
    }

    // TODO: substituir pela lógica real de sessão/login do administrador
    const idAdm = localStorage.getItem('id_adm') || 1;

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('modo_preparo', modoPreparo);
    formData.append('descricao', descricao);
    formData.append('apoio_decisao', apoioDecisao);
    formData.append('id_publico_alvo', idPublicoAlvo);
    formData.append('id_tipo_refeicao', idTipoRefeicao);
    formData.append('id_adm', idAdm);

    if (arquivoImg) {
        formData.append('img', arquivoImg);
    }

    try {
        btnSalvarRefeicao.disabled = true;

        let resposta;

        if (refeicaoEmEdicaoId) {
            resposta = await fetch(`${API_REFEICAO}/${refeicaoEmEdicaoId}`, {
                method: 'PUT',
                body: formData
            });
        } else {
            resposta = await fetch(API_REFEICAO, {
                method: 'POST',
                body: formData
            });
        }

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.message || 'Não foi possível salvar a refeição.');
            return;
        }

        const idRefeicaoSalva = refeicaoEmEdicaoId || dados.response?.id;

        // Sincroniza os alimentos vinculados (refeicao_alimento)
        await sincronizarAlimentosDaRefeicao(idRefeicaoSalva);

        fecharModalRefeicao();
        listarRefeicoes();

    } catch (error) {
        console.error('Erro ao salvar refeição:', error);
        alert('Erro ao salvar refeição. Verifique o console para mais detalhes.');
    } finally {
        btnSalvarRefeicao.disabled = false;
    }
}

// Cadastra cada alimento da lista temporária vinculado à refeição salva.
// Observação: em uma edição, o ideal é comparar com os vínculos já existentes (PUT no que mudou,
// POST no que é novo, DELETE no que foi removido). Como o objetivo aqui é o CRUD básico,
// os vínculos novos (sem "id") são sempre criados via POST.
async function sincronizarAlimentosDaRefeicao(idRefeicao) {
    const novos = alimentosTemp.filter(item => !item.id);

    for (const item of novos) {
        try {
            await fetch(API_REFEICAO_ALIMENTO, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_refeicao: idRefeicao,
                    id_alimento: item.id_alimento,
                    quantidade_g: item.quantidade_g,
                    unidade_medida: item.unidade_medida
                })
            });
        } catch (error) {
            console.error('Erro ao vincular alimento à refeição:', error);
        }
    }
}

// ======================================================================
// EDITAR REFEIÇÃO
// ======================================================================

async function editarRefeicao(id) {
    try {
        const resposta = await fetch(`${API_REFEICAO}/${id}`);
        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.message || 'Refeição não encontrada.');
            return;
        }

        const refeicao = Array.isArray(dados.response) ? dados.response[0] : dados.response;

        abrirModalRefeicao('editar', refeicao);

        // Carrega os alimentos já vinculados a essa refeição na lista temporária
        const alimentosVinculados = await buscarAlimentosDaRefeicao(id);
        alimentosTemp = alimentosVinculados.map(function (item) {
            const alimento = cacheAlimentos.find(a => String(a.id) === String(item.id_alimento));
            return {
                id: item.id,
                id_alimento: item.id_alimento,
                nome: alimento ? alimento.nome : `Alimento #${item.id_alimento}`,
                quantidade_g: item.quantidade_g,
                unidade_medida: item.unidade_medida
            };
        });
        renderizarAlimentosTemp();

    } catch (error) {
        console.error('Erro ao buscar refeição para edição:', error);
        alert('Erro ao buscar refeição. Verifique o console para mais detalhes.');
    }
}

// ======================================================================
// EXCLUIR REFEIÇÃO
// ======================================================================

async function excluirRefeicao(id) {
    const confirmar = confirm('Tem certeza que deseja excluir esta refeição?');
    if (!confirmar) return;

    try {
        const resposta = await fetch(`${API_REFEICAO}/${id}`, { method: 'DELETE' });
        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.message || 'Não foi possível excluir a refeição.');
            return;
        }

        listarRefeicoes();

    } catch (error) {
        console.error('Erro ao excluir refeição:', error);
        alert('Erro ao excluir refeição. Verifique o console para mais detalhes.');
    }
}
