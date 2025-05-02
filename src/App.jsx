import { useState, useEffect } from "react";
import "./App.css";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const formatarMoeda = (valor) => {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

function App() {
  const [cardapio, setCardapio] = useState([]);
  const [total, setTotal] = useState(0);
  const popupConfirmar = document.getElementById("confirmar-pedido");

  window.onclick = (event) => {
    if (event.target == popupConfirmar) {
      popupConfirmar.style.display = "none";
    }
  };

  //confirmação do pedido
  const confirmarPedido = () => {
    const nome = document.getElementById("cliente").value;
    const turma = document.getElementById("turma").value;
    const contato = document.getElementById("contato").value;
    const observacao = document.getElementById("observacao").value;

    const container = document.getElementById("revisao");

    if (
      nome === null ||
      nome === "" ||
      turma === null ||
      turma === "" ||
      contato === null ||
      contato === ""
    ) {
      container.innerHTML = "<h1>Preencha todas as informações!</h1>";
    } else {
      const dadosCliente = `
      <div class="resumo" id="resumo-dados"> 
      <p><strong>Nome:</strong> ${nome}</p>
      <p><strong>Turma:</strong> ${turma}</p>
      <p><strong>Contato:</strong> ${contato}</p>
      </div>
      ${ (observacao !== "" && observacao !== null) ? `<div class="resumo" id="resumo-observacao"><p><strong>Observação</strong><br/> ${observacao} <br/></p></div>` : ""}
      `;

      let precoTotal = 0;
      const itensPedidos = cardapio
        .filter((item) => item.quantidade > 0)
        .map((item) => {
          precoTotal += item.preco * item.quantidade;
          return `<p>${item.item} - ${item.quantidade} unidade(s)</p>`;
        })
        .join("");

      if (precoTotal > 0) {
        container.innerHTML =
          `<h2>Verifique seu pedido</h2>` +
          dadosCliente +
          `<div class="resumo" id="resumo-pedidos"> <h3>Resumo do pedido:</h3> ${itensPedidos}</div>` +
          `<br/><h4 id="valor-final">Valor total: ${formatarMoeda(precoTotal)}</h4>`;

        setTimeout(() => {
          const botao = document.createElement("button");
          botao.className = "submit-button";
          botao.textContent = "Confirmar pedido";
          botao.onclick = enviarPedido;
          container.appendChild(botao);
        }, 0);
      } else {
        container.innerHTML = `<h1>Selecione pelo menos um produto!</h1>`;
      }
    }
    document.getElementById("confirmar-pedido").style.display = "block";
  };

  // enviar pedido ao supabase
  const enviarPedido = async () => {
    const tempoMinimo = 5 * 60 * 1000; // 5 minutos

    try {
      const ipResponse = await axios.get("https://api.ipify.org?format=json");
      const ip = ipResponse.data.ip;

      // Verificar último pedido por IP
      const { data: historico, error: errorHistorico } = await supabase
        .from("Pedidos")
        .select("created_at, ip_address")
        .order("created_at", { ascending: false })
        .limit(1);

      if (errorHistorico) {
        console.error("Erro ao buscar histórico:", errorHistorico);
        return;
      }

      if (Array.isArray(historico) && historico.length > 0) {
        const ultimoPedido = new Date(historico[0].created_at);
        const tempoDecorrido = Date.now() - ultimoPedido.getTime();

        if (tempoDecorrido < tempoMinimo) {
          alert(
            "Você já fez um pedido recentemente. Tente novamente em 5 minutos."
          );
          // return;
        }
      }

      // Dados do pedido
      const cliente = document.getElementById("cliente").value;
      const turma = document.getElementById("turma").value;
      const contato = document.getElementById("contato").value;
      const observacao = document.getElementById("observacao").value;

      const itensSelecionados = cardapio
        .filter((item) => item.quantidade > 0)
        .map((item) => ({
          nome: item.item,
          quantidade: item.quantidade,
          preco: item.preco,
        }));

      const pedido = {
        cliente,
        turma,
        contato,
        item: itensSelecionados,
        observacao,
        ip_address: ip,
        total,
      };

      const { data, error } = await supabase.from("Pedidos").insert([pedido]);

      if (error) {
        console.error("Erro ao enviar o pedido:", error);
      } else {
        document.getElementById("revisao").innerHTML = "";
        document.getElementById("confirmar-pedido").style.display = "none";

        localStorage.setItem("mensagem-pedido", "Seu pedido foi registrado!");
        window.location.reload();
      }
    } catch (err) {
      console.error("Erro geral ao enviar o pedido:", err);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase.from("Estoque").select("*");

        if (error) {
          console.error("Erro ao buscar dados:", error.message);
        } else {
          console.log("Dados recebidos:", data);
          if (data && data.length === 0) {
            console.log('Nenhum dado encontrado na tabela "Estoque".');
          }
          setCardapio(data);
        }
      } catch (err) {
        console.error("Erro na requisição:", err);
      }
    }

    fetchData();

    const mensagem = localStorage.getItem("mensagem-pedido");

    if (mensagem) {
      const divMensagem = document.createElement("div");
      divMensagem.textContent = mensagem;
      divMensagem.className = "mensagem-sucesso";

      document.body.appendChild(divMensagem);

      setTimeout(() => {
        divMensagem.remove();
        localStorage.removeItem("mensagem-pedido");
      }, 5000);
    }
  }, []);

  //calcular valor total
  const calcularTotal = (cardapio) => {
    const novoTotal = cardapio.reduce((acc, item) => {
      return acc + (item.quantidade || 0) * item.preco;
    }, 0);

    setTotal(novoTotal);
  };

  //aumentar e diminuir quantidade
  const handleIncrement = (index) => {
    const newCardapio = [...cardapio];
    if ((newCardapio[index].quantidade || 0) < cardapio[index].estoque) {
      newCardapio[index].quantidade = (newCardapio[index].quantidade || 0) + 1;
      setCardapio(newCardapio);
      calcularTotal(newCardapio);
    }
  };

  const handleDecrement = (index) => {
    const newCardapio = [...cardapio];
    if (newCardapio[index].quantidade > 0) {
      newCardapio[index].quantidade = newCardapio[index].quantidade - 1;
      setCardapio(newCardapio);
      calcularTotal(newCardapio);
    }
  };

  //pagina
  return (
    <>
      <h1>Cardápio da TJA</h1>
      <div className="form">
        <div className="cardapio">
          {cardapio.length > 0 ? (
            cardapio.map((item, index) => (
              <div key={index} className="cardapio-item">
                <img src={item.imagem} />
                <div className="detalhes-item" style={{ width: '200px'}}>
                  <h3 style={{ marginLeft: "auto", marginRight: "auto" }}>
                    {item.item}
                  </h3>
                  <p style={{ color: "white", fontSize: "1.05rem" }}>
                  R$ {item.preco.toFixed(2)}
                  </p>
                  <p>
                    {item.estoque > 0
                      ? item.estoque + " Restantes"
                      : "Esgotado"}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: "auto",
                    width: "fit-content",
                  }}
                >
                  <span style={{ marginBottom: "8px" }}>Encomendar</span>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleDecrement(index)}
                    >
                      -
                    </button>
                    <span>{item.quantidade || 0}</span>
                    <button
                      type="button"
                      onClick={() => handleIncrement(index)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>Ainda não há itens no cardápio.</p>
          )}
        </div>
        <h3 id="preco-total">Total: {formatarMoeda(total)}</h3>
        <div className="dados">
          <label htmlFor="cliente">Nome: </label>
          <input
            type="text"
            name="cliente"
            id="cliente"
            placeholder="Seu nome"
            required
            autoComplete="off"
          />

          <label htmlFor="turma">Turma: </label>
          <input
            type="text"
            name="turma"
            id="turma"
            placeholder="Sua turma"
            autoComplete="off"
          />

          <label htmlFor="contato">Contato: </label>
          <input
            type="tel"
            name="contato"
            id="contato"
            placeholder="(99) 99999-9999"
            pattern="\(\d{2}\) \d{9}"
            required
            autoComplete="off"
          />
        </div>
        <label htmlFor="observacao" id="label-observacao">Observações adicionais: </label> <br />
        <textarea
          name="observacao"
          id="observacao"
          rows="10"
          cols="50"
          placeholder="(Opcional) Detalhes adicionais do pedido"
        ></textarea>
        <div id="confirmar-pedido">
          <div id="revisao"></div>
        </div>
        <br />
        <div id="mensagem">
          <h4>
            {" "}
            <strong>Atenção!</strong> <br />A turma <strong>NÃO</strong> fará
            entregas. Os pedidos devem ser retirados na sala 05 do bloco 1 no
            primeiro intervalo (a partir das 14h30). <br />
            Os pagamentos devem ser realizados na retirada dos pedidos.
            <br />
          </h4>
        </div>
        <button
          type="button"
          className="submit-button"
          onClick={confirmarPedido}
        >
          Fazer pedido
        </button>
      </div>
    </>
  );
}

export default App;
