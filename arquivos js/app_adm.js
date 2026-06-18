'use strict'

//Função responsável por retornar o endereço json
const selectEndereco = async function () {
    const url = 'http://localhost:8080/v1/baratiefit/alimento'
    try {
        const dados = await fetch(url)
        const json = await dados.json()
        return json
    } catch (error) {
        console.error("Erro crítico na requisição HTTP:", error)
    }
}

//Função para filtrar o resultado da API
const selectAllAlimentos = async function () {
    const apiResult = await selectEndereco()
    if (apiResult && apiResult.status_code == 200) {
        const listaDeAlimentos = apiResult.response.alimento
        return listaDeAlimentos
    } else {
        return apiResult
    }
}

//Função para criar uma linha na tabela
const criarLinha = function (alimento) {

    let tabela = document.getElementById('conteudoAlimentos')
    let tr = document.createElement('tr')

    let tdNome = document.createElement('td')
    tdNome.textContent = alimento.nome

    let tdDescricao = document.createElement('td')
    tdDescricao.textContent = alimento.descricao || "Sem descrição"

    let tdCategoria = document.createElement('td')
    tdCategoria.textContent = alimento.id_categoria

    let tdEnquadramento = document.createElement('td')
    tdEnquadramento.textContent = alimento.id_enquadramento

    let tdCarboidratos = document.createElement('td')
    tdCarboidratos.textContent = alimento.carboidratos_g

    let tdProteinas = document.createElement('td')
    tdProteinas.textContent = alimento.proteinas_g

    let tdLipidos = document.createElement('td')
    tdLipidos.textContent = alimento.lipidios_g

    let tdFibras = document.createElement('td')
    tdFibras.textContent = alimento.fibras_g

    let tdAcucarAdd = document.createElement('td')
    tdAcucarAdd.textContent = alimento.acucar_adicionado_g

    let tdGordurasTrans = document.createElement('td')
    tdGordurasTrans.textContent = alimento.gorduras_trans_g

    let tdGordurasSat = document.createElement('td')
    tdGordurasSat.textContent = alimento.gorduras_saturadas_g

    let tdKcal = document.createElement('td')
    tdKcal.textContent = calcularKcal(alimento)

    let tdUM = document.createElement('td')
    tdUM.textContent = alimento.unidade_medida

    // Criando a coluna de Ações com os botões (Faltava no teu código)
    let tdAcoes = document.createElement('td')
    tdAcoes.innerHTML = `
        <button type="button" class="button green">editar</button>
        <button type="button" class="button red">excluir</button>
    `

    tr.replaceChildren(
        tdNome,
        tdDescricao,
        tdCategoria,
        tdEnquadramento,
        tdCarboidratos,
        tdProteinas, 
        tdLipidos,
        tdFibras,
        tdAcucarAdd,
        tdGordurasTrans,
        tdGordurasSat,
        tdKcal,
        tdUM,
        tdAcoes
    )
    tabela.appendChild(tr)
}

//Função para calcular as kcal
const calcularKcal = function (alimento) {
    const proteina = Number(alimento.proteinas_g)
    const carboidratos = Number(alimento.carboidratos_g)
    const lipidios = Number(alimento.lipidios_g)
    const result = ((proteina + carboidratos) * 4) + (lipidios * 9)
    return result.toFixed(2) 
}

//Função para exibir os resultados
const result = async function(){
    const tabela = document.getElementById('conteudoAlimentos')
    tabela.innerHTML = '' 
    const alimentos = await selectAllAlimentos()
    
    alimentos.forEach(function(alimento){
        criarLinha(alimento)
    })
}

//Funcao para deletar alimentos
const deletarAlimentos = async function(id){
    const url = `http://localhost:8080/v1/baratiefit/alimento/${id}`
}

// Evento do click do botão
document.getElementById('visualizarAlimentos')
    .addEventListener('click', result)