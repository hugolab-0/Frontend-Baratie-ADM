// URL base da sua API configurada no app.js para refeições
const REFEICAO_URL = 'http://localhost:8080/v1/baratiefit/refeicao';

// ID do administrador fixo (obrigatório para auditoria/controle no seu banco)
const ID_ADM_PADRAO = 1;

// ======================================================================
// MAPEAMENTO DE ELEMENTOS DO DOM
// ======================================================================
const modalRefeicao = document.getElementById('modalRefeicao');
const btnCadastrarRefeicao = document.getElementById('cadastrarRefeicao');
const btnCloseModalRefeicao = document.getElementById('closeModalRefeicao');
const btnCancelarRefeicao = document.getElementById('cancelarRefeicao');
const btnSalvarRefeicao = document.getElementById('salvarRefeicao');
const formRefeicao = document.getElementById('formRefeicao');
const tabelaRefeicoes = document.getElementById('tableRefeicoes');
const conteudoRefeicoes = document.getElementById('conteudoRefeicoes');
const btnVisualizarRefeicoes = document.getElementById('visualizarRefeicoes');

// Campos específicos do formulário de Refeição
const inputNomeRefeicao = document.getElementById('nomeRefeicao');
const inputDescricaoRefeicao = document.getElementById('descricaoRefeicao');

// ======================================================================
// CONTROLE DO MODAL
// ======================================================================
const openModal = () => modalRefeicao.classList.add('active');

const closeModal = () => {
    modalRefeicao.classList.remove('active');
    formRefeicao.reset();
    inputNomeRefeicao.dataset.index = 'new'; // Reseta o estado para inserção
    modalRefeicao.querySelector('h2').textContent = "Nova Refeição";
};

if (btnCadastrarRefeicao) btnCadastrarRefeicao.addEventListener('click', openModal);
if (btnCloseModalRefeicao) btnCloseModalRefeicao.addEventListener('click', closeModal);
if (btnCancelarRefeicao) btnCancelarRefeicao.addEventListener('click', closeModal);

// ======================================================================
// CONSUMO DA API - MÉTODOS DO CRUD (GET, POST, PUT, DELETE)
// ======================================================================

// 1. LISTAR TODAS AS REFEIÇÕES (GET)
const carregarRefeicoes = async () => {
    try {
        const response = await fetch(REFEICAO_URL);
        const data = await response.json();

        if (!conteudoRefeicoes) return;
        conteudoRefeicoes.innerHTML = ''; // Limpa as linhas atuais

        // Adaptação para a estrutura padrão de retorno do seu configMessages (status 200)
        if (response.status === 200 && data.response) {
            // Tratamento caso venha dentro de um objeto específico ou array direto
            const lista = data.response.refeicoes || data.response;
            
            lista.forEach(refeicao => {
                const linha = criarLinhaTabela(refeicao);
                conteudoRefeicoes.appendChild(linha);
            });
        } else if (response.status === 404) {
            conteudoRefeicoes.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 15px;">Nenhuma refeição localizada.</td></tr>`;
        }
    } catch (error) {
        console.error('Erro ao buscar refeições do servidor:', error);
        alert('Erro ao tentar conectar com a API para listar refeições.');
    }
};

// 2. SALVAR DADOS - INSERIR OU ATUALIZAR (POST / PUT)
const salvarDadosRefeicao = async (event) => {
    event.preventDefault();

    if (!formRefeicao.reportValidity()) return;

    // Monta o payload conforme as colunas padrão de uma tabela de tipo/refeição
    const refeicaoPayload = {
        nome: inputNomeRefeicao.value,
        descricao: inputDescricaoRefeicao.value || "Sem descrição.",
        id_adm: ID_ADM_PADRAO
    };

    const idRefeicao = inputNomeRefeicao.dataset.index;
    
    try {
        let response;
        
        if (idRefeicao === 'new') {
            // Fluxo de Criação (POST)
            response = await fetch(REFEICAO_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(refeicaoPayload)
            });
        } else {
            // Fluxo de Atualização (PUT)
            response = await fetch(`${REFEICAO_URL}/${idRefeicao}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(refeicaoPayload)
            });
        }

        const resultado = await response.json();

        if (response.status === 201 || response.status === 200) {
            alert(idRefeicao === 'new' ? 'Nova refeição cadastrada!' : 'Refeição atualizada com sucesso!');
            closeModal();
            carregarRefeicoes();
        } else {
            alert(`Falha na operação: ${resultado.message || 'Verifique os dados enviados.'}`);
        }

    } catch (error) {
        console.error('Erro de requisição ao salvar refeição:', error);
        alert('Falha na comunicação com o servidor.');
    }
};

// 3. EXCLUIR REFEIÇÃO (DELETE)
const deletarRefeicao = async (id, nome) => {
    const confirmar = confirm(`Tem certeza que deseja deletar a refeição "${nome}"?`);
    if (!confirmar) return;

    try {
        const response = await fetch(`${REFEICAO_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.status === 200) {
            alert('Refeição removida com sucesso.');
            carregarRefeicoes();
        } else {
            alert('Não foi possível remover a refeição.');
        }
    } catch (error) {
        console.error('Erro ao deletar refeição:', error);
        alert('Erro interno de rede ao apagar o registro.');
    }
};

// 4. BUSCAR POR ID E PREPARAR EDIÇÃO (GET/:id)
const prepararEdicaoRefeicao = async (id) => {
    try {
        const response = await fetch(`${REFEICAO_URL}/${id}`);
        const data = await response.json();

        if (response.status === 200 && data.response) {
            // Se o retorno for um array de resultados toma o primeiro índice
            const refeicao = Array.isArray(data.response) ? data.response[0] : data.response;

            inputNomeRefeicao.value = refeicao.nome;
            inputNomeRefeicao.dataset.index = refeicao.id; // Salva o ID para a rota de PUT
            inputDescricaoRefeicao.value = refeicao.descricao;

            modalRefeicao.querySelector('h2').textContent = "Editar Refeição";
            openModal();
        } else {
            alert('Não foi possível encontrar as informações desta refeição.');
        }
    } catch (error) {
        console.error('Erro ao requisitar dados da refeição por ID:', error);
    }
};

// ======================================================================
// MANIPULAÇÃO DINÂMICA DO DOM (Renderização da Tabela)
// ======================================================================
const criarLinhaTabela = (refeicao) => {
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
        <td>${refeicao.nome}</td>
        <td>${refeicao.descricao || ''}</td>
        <td>
            <button type="button" class="button green btn-editar">editar</button>
            <button type="button" class="button red btn-excluir">excluir</button>
        </td>
    `;

    // Listeners locais para os botões de ação de cada linha
    tr.querySelector('.btn-editar').addEventListener('click', () => prepararEdicaoRefeicao(refeicao.id));
    tr.querySelector('.btn-excluir').addEventListener('click', () => deletarRefeicao(refeicao.id, refeicao.nome));

    return tr;
};

// ======================================================================
// INICIALIZAÇÃO DA PÁGINA E LISTENERS
// ======================================================================
if (btnSalvarRefeicao) btnSalvarRefeicao.addEventListener('click', salvarDadosRefeicao);

if (btnVisualizarRefeicoes) {
    btnVisualizarRefeicoes.addEventListener('click', () => {
        if (tabelaRefeicoes) tabelaRefeicoes.style.display = 'table';
        carregarRefeicoes();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    carregarRefeicoes();
});