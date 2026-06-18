'use strict'

//Controle de cadastro dos alimentos e refeicoes
const openModal = () => document.getElementById('modal')
    .classList.add('active')

const closeModal = () => document.getElementById('modal')
    .classList.remove('active')

const openModalAlimento = () => document.getElementById('modalAlimento')
    .classList.add('active')

const closeModalAlimento = () => {
    clearFieldsAlimento()
    document.getElementById('modalAlimento').classList.remove('active')
}

//Controle de abertura e fechamento das tabelas
const openTableAlimentos = () => {
    document.getElementById('tableRefeicoes')
    .classList.remove('active')
    document.getElementById('tableAlimentos')
    .classList.add('active')
}

const openTableRefeicoes = () => {
    document.getElementById('tableAlimentos')
    .classList.remove('active')
    document.getElementById('tableRefeicoes')
    .classList.add('active')
}

//Função para transformar a conversão de JSON para string em JSON novamente
const getLocalStorage = () => JSON.parse(localStorage.getItem('db_alimento')) ?? []
//Função para transformar a conversão de JSON para string
const setLocalStorage = (db_alimento) => localStorage.setItem('db_alimento', JSON.stringify(db_alimento))

//CRUD - CREATE, READ, UPDATE, DELETE

//CREATE
const createAlimento = (alimento) => {
    const db_alimento = getLocalStorage()
    db_alimento.push(alimento)
    setLocalStorage(db_alimento)
}

//READ
const readAlimento = () => getLocalStorage()

//UPDATE
const updadeAlimento = (index, alimento) => {
    const db_alimento = readAlimento()
    db_alimento [index] = alimento
    setLocalStorage(db_alimento)
}

//DELETE
const deleteAlimento = (index) => {
    const db_alimento = readAlimento()
    db_alimento.splice(index, 1)
    setLocalStorage(db_alimento)
}


//Interação com o layout
const salvarAlimento = () => {
    if(isValidFieldAlimento()){
        const alimento = {
            nome: document.getElementById('nome').value,
            descricao: document.getElementById('descricao').value,
            qtde_proteina: document.getElementById('proteina').value,
            qtde_carboidrato: document.getElementById('carboidrato').value,
            qtde_lipidio: document.getElementById('lipidio').value,
            qtde_acucar_add: document.getElementById('acucarAdd').value,
            qtde_gord_trans: document.getElementById('gordTrans').value,
            qtde_gord_sat: document.getElementById('gordSat').value,
            unidade_medida: document.getElementById('selectUnidadeMedida').value,
            categoria: document.getElementById('selectCategoria').value,
            enquadramento: document.getElementById('selectEnquadramento').value,

        }
        createAlimento(alimento)
        updateTableAlimentos()
        closeModalAlimento()
    }
}

//Limpar apenas os campos do formulário de alimentos
const clearFieldsAlimento = () => {
    const fields = document.querySelectorAll('#formAlimento .modal-field');
    fields.forEach(field => {
        // Se for um select, volta para a opção padrão (vazia)
        if (field.tagName === 'SELECT') {
            field.selectedIndex = 0;
        } else {
            field.value = '';
        }
    });
}

const isValidFieldAlimento = () => {
   return document.getElementById('formAlimento').reportValidity()
}

//Criar uma linha nova para cada alimento cadastrado no banco de dados
const createRow = (alimento) => {
    const newRow = document.createElement('tr')
    newRow.innerHTML = `
        <td>${alimento.nome}</td>
        <td>${alimento.descricao || ''}</td>
        <td>${alimento.categoria || 'Não informada'}</td>
        <td>${alimento.enquadramento || 'Não informado'}</td>
        <td>${alimento.qtde_proteina}</td>
        <td>${alimento.qtde_carboidrato}</td>
        <td>${alimento.qtde_lipidio}</td>
        <td>0</td> <td>${alimento.qtde_acucar_add}</td>
        <td>${alimento.qtde_gord_trans}</td>
        <td>${alimento.qtde_gord_sat}</td>
        <td>${calcularKcal(alimento)}</td>
        <td>${alimento.unidade_medida}</td>
        <td>
            <button type="button" class="button green">editar</button>
            <button type="button" class="button red">excluir</button>
        </td>
    `

    document.querySelector('#tableAlimentos>tbody').appendChild(newRow)
}

//Funcao para calcular as kcal do alimento
const calcularKcal = function(alimento){
    const proteina      = alimento.qtde_proteina
    const carboidrato   = alimento.qtde_carboidrato
    const lipidios      = alimento.qtde_lipidio
    //Retorna o valor de kcal do alimento
    return ((Number(proteina) + Number(carboidrato)) * 4 + (Number(lipidios) * 9)) 
}

//Limpar a tabela de alimentos para não carregar alimentos que já foram carregados
const clearTable = () => {
    const rows = document.querySelectorAll('#tableAlimentos>tbody tr')
    rows.forEach(row => row.parentNode.removeChild(row))
}

//Carregar todos os alimentos cadastrados no banco de dados
const updateTableAlimentos = () => {
    const db_alimento = readAlimento()
    clearTable()
    db_alimento.forEach(createRow)
}

//

//Carregar os alimentos cadastrados
updateTableAlimentos()

// Eventos de cadastro
document.getElementById('cadastrarRefeicao')
        .addEventListener('click', openModal)

document.getElementById('modalClose')
        .addEventListener('click', closeModal)

document.getElementById('cadastrarAlimento')
        .addEventListener('click', openModalAlimento)

document.getElementById('closeModalAlimento')
        .addEventListener('click', closeModalAlimento)

// Eventos de alterar entre as tabelas
document.getElementById('visualizarAlimentos')
        .addEventListener('click', openTableAlimentos)

document.getElementById('visualizarRefeicoes')
        .addEventListener('click', openTableRefeicoes)


document.getElementById('salvarAlimento')
        .addEventListener('click', salvarAlimento);

//Botão Cancelar do Alimento para fechar o modal com segurança
document.getElementById('cancelarAlimento')
        .addEventListener('click', (cancel) => {
            cancel.preventDefault(); // Evita recarregar a página se disparar submit
            closeModalAlimento();
        });


document.querySelector('#tableAlimentos>tbody')
        .addEventListener('click', editDelete)