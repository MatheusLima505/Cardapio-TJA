import { useState, useEffect } from 'react'
import './App.css'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const formatarMoeda = (valor) => {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function App() {
  const [cardapio, setCardapio] = useState([])
  const [total, setTotal] = useState(0)
  const popupConfirmar = document.getElementById('confirmar-pedido')

  window.onclick = (event) => {
    if (event.target == popupConfirmar) {
      popupConfirmar.style.display = 'none'
    }
  }

  const enviarPedido = async () => {
    try {
      const cliente = document.getElementById('cliente').value
      const turma = document.getElementById('turma').value
      const contato = document.getElementById('contato').value
      const observacao = document.getElementById('observacao').value

      const itensSelecionados = cardapio
        .filter(item => item.quantidade > 0)
        .map(item => ({
          nome: item.item,
          quantidade: item.quantidade,
          preco: item.preco
        }))

      const pedido = {
        cliente: cliente,
        turma: turma,
        contato: contato,
        item: itensSelecionados,
        observacao: observacao,
        total: total
      }

      const { data, error } = await supabase
        .from('Pedidos')
        .insert([pedido])

      if (error) {
        console.error('Erro ao enviar o pedido: ', error)
      } else {
        console.log('Pedido enviado com sucesso: ', data)
      }
    } catch (err) {
      console.error('Erro ao enviar o pedido: ', err)
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('Estoque')
          .select('*')

        if (error) {
          console.error('Erro ao buscar dados:', error.message)
        } else {
          console.log('Dados recebidos:', data)
          if (data && data.length === 0) {
            console.log('Nenhum dado encontrado na tabela "Estoque".')
          }
          setCardapio(data)
        }
      } catch (err) {
        console.error('Erro na requisição:', err)
      }
    }

    fetchData()
  }, [])

  const calcularTotal = (cardapio) => {
    const novoTotal = cardapio.reduce((acc, item) => {
      return acc + ((item.quantidade || 0) * item.preco)
    }, 0)

    setTotal(novoTotal)
  }

  const handleIncrement = (index) => {
    const newCardapio = [...cardapio]
    if ((newCardapio[index].quantidade || 0) < cardapio[index].estoque) {
      newCardapio[index].quantidade = (newCardapio[index].quantidade || 0) + 1
      setCardapio(newCardapio)
      calcularTotal(newCardapio)
    }
  }

  const handleDecrement = (index) => {
    const newCardapio = [...cardapio]
    if (newCardapio[index].quantidade > 0) {
      newCardapio[index].quantidade = newCardapio[index].quantidade - 1
      setCardapio(newCardapio)
      calcularTotal(newCardapio)
    }
  }

  const confirmarPedido = () => {
    const nome = document.getElementById('cliente').value
    const turma = document.getElementById('turma').value
    const contato = document.getElementById('contato').value

    const container = document.getElementById('revisao')

    if (nome === null || nome === '' || turma === null || turma === '' || contato === null || contato === '') {
      container.innerHTML = "<h1>Preencha todas as informações!</h1>"
    } else {
      const dadosCliente = `
      <p><strong>Nome:</strong> ${nome}</p>
      <p><strong>Turma:</strong> ${turma}</p>
      <p><strong>Contato:</strong> ${contato}</p>
      <br/>
      <h3>Resumo do pedido:</h3>
      `
      let precoTotal = 0;
      const itensPedidos = cardapio
        .filter(item => item.quantidade > 0)
        .map(item => {
          precoTotal += item.preco * item.quantidade
          return `<p>${item.item} - ${item.quantidade} unidade(s)</p>`
        })
        .join('')

      if (precoTotal > 0) {
        container.innerHTML = dadosCliente + itensPedidos
          + `<br/><h4>Valor total: ${formatarMoeda(precoTotal)}</h4>`
          + `<br/> <button type='submit' class='submit-button'>Confirmar pedido</button>`

          document.querySelector('.submit-button')?.addEventListener('click', enviarPedido)
      } else {
        container.innerHTML = `<h1>Selecione pelo menos um produto!</h1>`
      }
    }

    document.getElementById('confirmar-pedido').style.display = 'block'
  }

  return (
    <>
      <h1>Cardápio da TJA</h1>
      <form>
        <div id='cardapio' style={{ border: 'solid red 1px' }}>
          {cardapio.length > 0 ? (
            cardapio.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', width: '500px', margin: '15px', padding: '5px', border: 'solid black 1px' }}>
                <img
                  src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlOVPOFvPb5zuHi8lEc_D0-il0GYmnlYN8Dg&s'
                  style={{ width: '100px', height: '100px', marginRight: '16px' }}
                />
                <div>
                  <h3 style={{ marginLeft: 'auto', marginRight: 'auto' }}>{item.item + ` (R$ ${item.preco.toFixed(2)})`}</h3>
                  <p>{item.estoque > 0 ? (item.estoque + ' Restantes') : 'Esgotado'}</p>
                </div>

                <div style={{ marginLeft: 'auto' }}>
                  Encomendar <br />
                  <button type="button" onClick={() => handleDecrement(index)}>-</button>
                  <span>{item.quantidade || 0}</span>
                  <button type="button" onClick={() => handleIncrement(index)}>+</button>
                </div>
              </div>
            ))
          ) : (
            <p>Ainda não há itens no cardápio.</p>
          )}
        </div>

        <h3 id='preco-total'>Total: {formatarMoeda(total)}</h3>

        <div id='dados' style={{ border: 'solid green 1px', padding: '10px', marginTop: '20px', marginBottom: '10px' }}>
          <label htmlFor="cliente">Nome: </label>
          <input type="text" name="cliente" id="cliente" placeholder="Seu nome" />

          <label htmlFor="turma">Turma: </label>
          <input type="text" name="turma" id="turma" placeholder='Sua turma' />

          <label htmlFor="contato">Contato: </label>
          <input type="tel" name="contato" id="contato" placeholder='Seu contato' />
        </div>

        <label htmlFor="observacao">Observações adicionais: </label> <br />
        <textarea name="observacao" id="observacao" rows="10" cols="50" placeholder='(Opcional) Detalhes adicionais do pedido' style={{ resize: 'none' }}></textarea>

        <div id="confirmar-pedido">
          <div id="revisao"></div>
        </div>

        <br />
        <h4>Atenção! <br /> Os pagamentos devem ser realizados na retirada dos pedidos!</h4> <br />
        <button type='button' className='submit-button' onClick={confirmarPedido}>Fazer pedido</button>
      </form>
    </>
  )
}

export default App