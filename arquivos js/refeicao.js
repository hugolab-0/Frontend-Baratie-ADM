/*********************************************************************************************************
 * Objetivo: Arquivo responsável pelas requisições de front-end para o CRUD de Refeições
 * Configurado para coexistir no mesmo HTML que o CRUD de alimentos.
 * Data: 2026-06-19
 *********************************************************************************************************/

// Envolvemos o código em um bloco {} para isolar as variáveis deste script das do main.js
{
    const REFEICAO_URL = 'http://localhost:8080/v1/baratiefit/refeicao';
    const ALIMENTOSURL = 'http://localhost:8080/v1/baratiefit/alimento';

    // ======================================================================
    // MAPEAMENTO DE ELEMENTOS DO DOM (Exclusivos da Refeição)
    // ======================================================================
    const modalRefeicao = document.getElementById('modalRefeicao');
    const btnCadastrarRefeicao = document.getElementById('cadastrarRefeicao');
    const btnCloseModalRefeicao = document.getElementById('closeModalRefeicao');
    const btnCancelarRefeicao = document.getElementById('cancelarRefeicao');
    const btnSalvarRefeicao = document.getElementById('salvarRefeicao');
    const formRefeicao = document.getElementById('formRefeicao');
    const conteudoRefeicoes = document.getElementById('conteudoRefeicoes');

    // Campos de Input específicos
    const inputNomeRefeicao = document.getElementById('nomeRefeicao');
    const inputDescricaoRefeicao = document.getElementById('descricaoRefeicao');

    // ======================================================================
    // CONTROLE DO MODAL DE REFEIÇÃO
    // ======================================================================
    const openModalRefeicao = () => {
        if (modalRefeicao) modalRefeicao.classList.add('active');
    };

    const closeModalRefeicao = () => {
        if (modalRefeicao) {
            modalRefeicao.classList.remove('active');
            formRefeicao.reset();
            inputNomeRefeicao.dataset.index = 'new';
            const tituloModal = modalRefeicao.querySelector('h2');
            if (tituloModal) tituloModal.textContent = "Nova Refeição";
        }
    };

    // Associa os eventos se os botões existirem na página
    if (btnCadastrarRefeicao) btnCadastrarRefeicao.addEventListener('click', openModalRefeicao);
    if (btnCloseModalRefeicao) btnCloseModalRefeicao.addEventListener('click', closeModalRefeicao);
    if (btnCancelarRefeicao) btnCancelarRefeicao.addEventListener('click', closeModalRefeicao);

    // ======================================================================
    // MÉTODOS FETCH - CRUD REFEIÇÃO
    // ======================================================================

    // 1. LISTAR REFEIÇÕES (GET)
    const carregarRefeicoes = async () => {
        try {
            const response = await fetch(REFEICAO_URL);
            const data = await response.json();

            if (!conteudoRefeicoes) return;
            conteudoRefeicoes.innerHTML = ''; 

            if (response.status === 200 && data.response) {
                // Tratamento dinâmico para o formato que vier da API
                const lista = data.response.refeicao || data.response.refeicoes || (Array.isArray(data.response) ? data.response : []);
                
                if (lista.length === 0) {
                    conteudoRefeicoes.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 15px;">Nenhuma refeição encontrada.</td></tr>`;
                    return;
                }

                lista.forEach(refeicao => {
                    const linha = criarLinhaTabelaRefeicao(refeicao);
                    conteudoRefeicoes.appendChild(linha);
                });
            } else {
                conteudoRefeicoes.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 15px;">Nenhuma refeição encontrada.</td></tr>`;
            }
        } catch (error) {
            console.error('Erro ao listar refeições:', error);
        }
    };

    // 2. CADASTRAR OU ATUALIZAR (POST / PUT)
    const salvarDadosRefeicao = async (event) => {
        event.preventDefault();

        if (!formRefeicao.reportValidity()) return;

        // ID_ADM_PADRAO é lido a partir do escopo global definido no main.js
        const payload = {
            nome: inputNomeRefeicao.value,
            descricao: inputDescricaoRefeicao.value || "Sem descrição",
            id_adm: typeof ID_ADM_PADRAO !== 'undefined' ? ID_ADM_PADRAO : 1
        };

        const idRefeicao = inputNomeRefeicao.dataset.index;
        
        try {
            let response;
            if (idRefeicao === 'new' || !idRefeicao) {
                response = await fetch(REFEICAO_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                response = await fetch(`${REFEICAO_URL}/${idRefeicao}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            const resultado = await response.json();

            if (response.status === 201 || response.status === 200) {
                alert('Refeição guardada com sucesso!');
                closeModalRefeicao();
                carregarRefeicoes();
            } else {
                alert(`Erro do Servidor: ${resultado.message || 'Erro ao salvar.'}`);
            }
        } catch (error) {
            console.error('Erro na requisição da refeição:', error);
            alert('Erro ao ligar ao servidor.');
        }
    };

    // 3. APAGAR REFEIÇÃO (DELETE)
    const deletarRefeicao = async (id, nome) => {
        if (!confirm(`Deseja mesmo apagar a refeição "${nome}"?`)) return;

        try {
            const response = await fetch(`${REFEICAO_URL}/${id}`, {
                method: 'DELETE'
            });

            if (response.status === 200) {
                alert('Refeição eliminada!');
                carregarRefeicoes();
            } else {
                alert('Não foi possível eliminar a refeição.');
            }
        } catch (error) {
            console.error('Erro ao eliminar refeição:', error);
        }
    };

    // 4. PREPARAR EDIÇÃO (GET por ID)
    const prepararEdicaoRefeicao = async (id) => {
        try {
            const response = await fetch(`${REFEICAO_URL}/${id}`);
            const data = await response.json();

            if (response.status === 200 && data.response) {
                const refeicao = Array.isArray(data.response) ? data.response[0] : data.response;

                inputNomeRefeicao.value = refeicao.nome;
                inputNomeRefeicao.dataset.index = refeicao.id; // Alterna o estado de inserção para o ID real
                inputDescricaoRefeicao.value = refeicao.descricao || '';

                const tituloModal = modalRefeicao.querySelector('h2');
                if (tituloModal) tituloModal.textContent = "Editar Refeição";
                openModalRefeicao();
            }
        } catch (error) {
            console.error('Erro ao buscar ID da refeição:', error);
        }
    };

    // Gerador de linhas da tabela
    const criarLinhaTabelaRefeicao = (refeicao) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${refeicao.nome}</td>
            <td>${refeicao.descricao || ''}</td>
            <td>
                <button type="button" class="button green btn-editar-ref">editar</button>
                <button type="button" class="button red btn-excluir-ref">excluir</button>
            </td>
        `;

        tr.querySelector('.btn-editar-ref').addEventListener('click', () => prepararEdicaoRefeicao(refeicao.id));
        tr.querySelector('.btn-excluir-ref').addEventListener('click', () => deletarRefeicao(refeicao.id, refeicao.nome));

        return tr;
    };

    // Configuração dos gatilhos iniciais
    if (btnSalvarRefeicao) btnSalvarRefeicao.addEventListener('click', salvarDadosRefeicao);
    
    document.addEventListener('DOMContentLoaded', () => {
        carregarRefeicoes();
    });
}