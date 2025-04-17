import { useState, useEffect } from 'react'
import './App.css'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

function App() {
  const [cardapio, setCardapio] = useState([])

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

  const handleIncrement = (index) => {
    const newCardapio = [...cardapio]
    newCardapio[index].quantidade = (newCardapio[index].quantidade || 0) + 1
    setCardapio(newCardapio)
  }

  const handleDecrement = (index) => {
    const newCardapio = [...cardapio]
    if (newCardapio[index].quantidade > 0) {
      newCardapio[index].quantidade = newCardapio[index].quantidade - 1
      setCardapio(newCardapio)
    }
  }

  return (
    <>
      <form>
        {cardapio.length > 0 ? (
          cardapio.map((item, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', width: '500px' }}>
              <img
                src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlOVPOFvPb5zuHi8lEc_D0-il0GYmnlYN8Dg&s'
                style={{ width: '100px', height: '100px', marginRight: '16px' }}
              />
              <h2 style={{ marginLeft: 'auto', marginRight: 'auto' }}>{item.item}</h2>
              {item.estoque} Restantes
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
        <input type="submit" />
      </form>
    </>
  )
}

export default App
