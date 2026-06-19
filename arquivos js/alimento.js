// URL base da sua API configurada no app.js
const BASE_URL = 'http://localhost:8080/v1/baratiefit/alimento';

// ID do administrador fixo para testes (já que sua API exige um id_adm na validação do controller)
const ID_ADM_PADRAO = 2; 

const modalAlimento          = document.getElementById('modalAlimento');
const btnCadastrarAlimento   = document.getElementById('cadastrarAlimento');
const btnCloseModalAlimento  = document.getElementById('closeModalAlimento');
const btnCancelarAlimento    = document.getElementById('cancelarAlimento');
const btnSalvarAlimento      = document.getElementById('salvarAlimento');
const formAlimento           = document.getElementById('formAlimento');
const tabelaAlimentos        = document.getElementById('tableAlimentos');
const conteudoAlimentos      = document.getElementById('conteudoAlimentos');
const btnVisualizarAlimentos = document.getElementById('visualizarAlimentos');

//Modais
const openModal = () => modalAlimento.classList.add('active');
const closeModal = () => {
    modalAlimento.classList.remove('active');
    formAlimento.reset();
    document.getElementById('nome').dataset.index = 'new'; // Reseta o estado para inserção
};

btnCadastrarAlimento.addEventListener('click', openModal);
btnCloseModalAlimento.addEventListener('click', closeModal);
btnCancelarAlimento.addEventListener('click', closeModal);

//Listar todos os alimentos
const carregarAlimentos = async () => {
    try {
        const response = await fetch(BASE_URL);
        const data = await response.json();

        // Limpa a tabela antes de renderizar
        conteudoAlimentos.innerHTML = '';

        if (response.status === 200 && data.response && data.response.alimento) {
            data.response.alimento.forEach(alimento => {
                const linha = criarLinhaTabela(alimento);
                conteudoAlimentos.appendChild(linha);
            });
        } else if (response.status === 404) {
            conteudoAlimentos.innerHTML = `<tr><td colspan="14" class="text-center p-4">Nenhum alimento cadastrado.</td></tr>`;
        }
    } catch (error) {
        console.error('Erro ao listar alimentos:', error);
        alert('Erro ao conectar com o servidor para listar alimentos.');
    }
};

//Cadastrar ou Atualizar um Alimento
const salvarDadosAlimento = async (event) => {
    event.preventDefault(); // Evita o reload da página

    // Verifica se o formulário HTML é válido
    if (!formAlimento.reportValidity()) return;

    // Coleta os dados do formulário montando o objeto esperado pela sua API
    const alimento = {
        nome: document.getElementById('nome').value,
        descricao: document.getElementById('descricao').value || "Sem descrição",
        proteinas_g: Number(document.getElementById('proteinas_g').value),
        carboidratos_g: Number(document.getElementById('carboidratos_g').value),
        lipidios_g: Number(document.getElementById('lipidios_g').value),
        fibras_g: Number(document.getElementById('fibras_g').value),
        acucar_adicionado_g: Number(document.getElementById('acucar_adicionado_g').value),
        gorduras_trans_g: Number(document.getElementById('gorduras_trans_g').value),
        gorduras_saturadas_g: Number(document.getElementById('gorduras_saturadas_g').value),
        unidade_medida: document.getElementById('selectUnidadeMedida').value,
        id_categoria: Number(document.getElementById('id_categoria').value) || 1, // Fallback caso não venha preenchido do backend
        id_enquadramento: Number(document.getElementById('id_enquadramento').value) || 1,
        id_adm: ID_ADM_PADRAO 
    };

    const idAlimento = document.getElementById('nome').dataset.index;
    
    try {
        let response;
        
        if (idAlimento === 'new') {
            // Método POST para novo registro
            response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alimento)
            });
        } else {
            // Método PUT para atualizar registro existente
            response = await fetch(`${BASE_URL}/${idAlimento}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alimento)
            });
        }

        const resultado = await response.json();

        if (response.status === 201 || response.status === 200) {
            alert(idAlimento === 'new' ? 'Alimento cadastrado com sucesso!' : 'Alimento atualizado com sucesso!');
            closeModal();
            carregarAlimentos(); // Atualiza a tabela dinamicamente
        } else {
            alert(`Erro enviado pelo servidor: ${resultado.message || 'Verifique os dados enviados.'}`);
        }

    } catch (error) {
        console.error('Erro ao salvar alimento:', error);
        alert('Erro de conexão ao salvar o alimento.');
    }
};

// Excluir um Alimento
const deletarAlimento = async (id, nome) => {
    const confirmar = confirm(`Tem certeza que deseja excluir o alimento "${nome}"?`);
    if (!confirmar) return;

    try {
        const response = await fetch(`${BASE_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.status === 200) {
            alert('Alimento excluído com sucesso!');
            carregarAlimentos();
        } else {
            alert('Não foi possível excluir o alimento.');
        }
    } catch (error) {
        console.error('Erro ao deletar alimento:', error);
        alert('Erro de conexão ao tentar deletar.');
    }
};

// Buscar por ID (Auxiliar para preencher o formulário na edição)
const prepararEdicaoAlimento = async (id) => {
    try {
        const response = await fetch(`${BASE_URL}/${id}`);
        const data = await response.json();

        if (response.status === 200 && data.response.length > 0) {
            const alimento = data.response[0];

            // Preenche os campos do modal com os dados atuais vindos do banco
            document.getElementById('nome').value = alimento.nome;
            document.getElementById('nome').dataset.index = alimento.id; // Guarda o ID aqui para saber que é um PUT
            document.getElementById('descricao').value = alimento.descricao;
            document.getElementById('proteinas_g').value = alimento.proteinas_g;
            document.getElementById('carboidratos_g').value = alimento.carboidratos_g;
            document.getElementById('lipidios_g').value = alimento.lipidios_g;
            document.getElementById('fibras_g').value = alimento.fibras_g;
            document.getElementById('acucar_adicionado_g').value = alimento.acucar_adicionado_g;
            document.getElementById('gorduras_trans_g').value = alimento.gorduras_trans_g;
            document.getElementById('gorduras_saturadas_g').value = alimento.gorduras_saturadas_g;
            document.getElementById('selectUnidadeMedida').value = alimento.unidade_medida;
            
            // Simula os selects de chaves estrangeiras (adicione options dinâmicas se necessário)
            document.getElementById('id_categoria').value = alimento.id_categoria;
            document.getElementById('id_enquadramento').value = alimento.id_enquadramento;

            // Altera o título do modal e abre ele
            modalAlimento.querySelector('h2').textContent = "Editar alimento";
            openModal();
        }
    } catch (error) {
        console.error('Erro ao buscar dados para edição:', error);
    }
};

// Função para construir o HTML de cada linha da tabela baseado no banco de dados
const criarLinhaTabela = (alimento) => {
    const tr = document.createElement('tr');
    
    // Cálculo simples de Kcal baseado nos macronutrientes fornecidos
    const kcalCalculado = (alimento.carboidratos_g * 4) + (alimento.proteinas_g * 4) + (alimento.lipidios_g * 9);

    tr.innerHTML = `
        <td>${alimento.nome}</td>
        <td>${alimento.descricao || ''}</td>
        <td>${alimento.id_categoria}</td>
        <td>${alimento.id_enquadramento}</td>
        <td>${alimento.proteinas_g}g</td>
        <td>${alimento.carboidratos_g}g</td>
        <td>${alimento.lipidios_g}g</td>
        <td>${alimento.fibras_g}g</td>
        <td>${alimento.acucar_adicionado_g}g</td>
        <td>${alimento.gorduras_trans_g}g</td>
        <td>${alimento.gorduras_saturadas_g}g</td>
        <td>${kcalCalculado.toFixed(0)}</td>
        <td>${alimento.unidade_medida}</td>
        <td>
            <button type="button" class="button green btn-editar" data-id="${alimento.id}">editar</button>
            <button type="button" class="button red btn-excluir" data-id="${alimento.id}" data-nome="${alimento.nome}">excluir</button>
        </td>
    `;

    // Eventos dos botões de ação internos da linha criada
    tr.querySelector('.btn-editar').addEventListener('click', () => prepararEdicaoAlimento(alimento.id));
    tr.querySelector('.btn-excluir').addEventListener('click', () => deletarAlimento(alimento.id, alimento.nome));

    return tr;
};


// Listener do botão de Salvar do Modal
btnSalvarAlimento.addEventListener('click', salvarDadosAlimento);

// Listener do botão de visualização rápida da tabela
btnVisualizarAlimentos.addEventListener('click', () => {
    tabelaAlimentos.style.display = 'table';
    carregarAlimentos();
});

// Executa automaticamente ao carregar a página para popular os dados
document.addEventListener('DOMContentLoaded', () => {
    // Esconde a tabela inicialmente se preferir ou já deixa carregada
    carregarAlimentos();
    
    // Adiciona valores mockados iniciais para os selects foreign key enquanto você não puxa via API
    popularSelectsProvisorios();
});

const popularSelectsProvisorios = () => {
    const selectCat = document.getElementById('id_categoria');
    const selectEnq = document.getElementById('id_enquadramento');
    
    if(selectCat.options.length <= 1) {
        selectCat.innerHTML += `<option value="1" selected>Categoria Padrão (ID 1)</option>`;
    }
    if(selectEnq.options.length <= 1) {
        selectEnq.innerHTML += `<option value="1" selected>Enquadramento Padrão (ID 1)</option>`;
    }
};