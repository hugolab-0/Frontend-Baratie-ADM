'use strict'

//Controle de cadastro dos alimentos e refeicoes
const openModal = () => document.getElementById('modal')
    .classList.add('active')

const closeModal = () => document.getElementById('modal')
    .classList.remove('active')

const openModalAlimento = () => document.getElementById('modalAlimento')
    .classList.add('active')

const closeModalAlimento = () => document.getElementById('modalAlimento')
    .classList.remove('active')

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


//Eventos de cadastro
document.getElementById('cadastrarRefeicao')
        .addEventListener('click', openModal)

document.getElementById('modalClose')
        .addEventListener('click', closeModal)

document.getElementById('cadastrarAlimento')
        .addEventListener('click', openModalAlimento)

document.getElementById('closeModalAlimento')
        .addEventListener('click', closeModalAlimento)

//Eventos de alterar entre as tabelas
document.getElementById('visualizarAlimentos')
        .addEventListener('click', openTableAlimentos)

document.getElementById('visualizarRefeicoes')
        .addEventListener('click', openTableRefeicoes)
