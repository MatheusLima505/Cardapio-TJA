import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [cardapio, setCardapio] = useState(["Coxinha","Pastel", "Pizza", "Charles"])

  return (
    <>
    <form>
    {cardapio.map((item) => {
      return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlOVPOFvPb5zuHi8lEc_D0-il0GYmnlYN8Dg&s'
        style={{ width: '100px', height: '100px', marginRight: '16px' }}></img>
        <h2>{item}</h2>
        <div style={{marginLeft: 'auto'}}>
          Encomendar <br />
        <button>-</button>number <button>+</button>
        </div>
        
        </div>
      )
    })}
    <input type="submit" />
    </form>
    </>
  )
}

export default App
