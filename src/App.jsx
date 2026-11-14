import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";

export const SERVER = "http://localhost:8080";
const WS_URL = "ws://localhost:8080/ws";

export default function App() {
  const [usuario, setUsuario] = useState("");
  const [conectado, setConectado] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [escribe, setEscribe] = useState("");
  const clientRef = useRef(null);
  const finRef = useRef(null);
  const timerRef = useRef(null);

  function conectar(e) {
    e.preventDefault();
    if (!usuario.trim()) return;

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 3000,
      onConnect: () => {
        setConectado(true);
        client.subscribe("/topic/sala", (frame) =>
          setMensajes((prev) => [...prev, JSON.parse(frame.body)])
        );
        client.subscribe("/topic/escribiendo", (frame) => {
          if (frame.body !== usuario) {
            setEscribe(frame.body);
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setEscribe(""), 1500);
          }
        });
        client.publish({
          destination: "/app/chat.unirse",
          body: JSON.stringify({ tipo: "UNION", autor: usuario }),
        });
      },
      onWebSocketClose: () => setConectado(false),
    });
    client.activate();
    clientRef.current = client;
  }

  function enviar(tipo, contenido) {
    clientRef.current?.publish({
      destination: "/app/chat.enviar",
      body: JSON.stringify({ tipo, autor: usuario, contenido }),
    });
  }

  function enviarTexto(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    enviar("TEXTO", texto.trim());
    setTexto("");
  }

  // Cleanup al desmontar
  useEffect(() => {
    return () => clientRef.current?.deactivate();
  }, []);

  // Auto-scroll al final cuando llegan mensajes
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  if (!conectado) {
    return (
      <form onSubmit={conectar} className="login">
        <h1>Estación Órbita 7</h1>
        <input
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          placeholder="Tu nombre de tripulante"
        />
        <button>Entrar</button>
      </form>
    );
  }

  return (
    <main className="chat">
      <ul className="mensajes">
        {mensajes.map((m, i) => (
          <li
            key={i}
            className={
              m.tipo === "UNION" || m.tipo === "SALIDA"
                ? "sistema"
                : m.autor === usuario
                ? "mio"
                : "otro"
            }
          >
            {m.tipo === "TEXTO" && (
              <>
                <b>{m.autor}</b> {m.contenido}
              </>
            )}
            {m.tipo === "IMAGEN" && (
              <>
                <b>{m.autor}</b>
                <img src={SERVER + m.contenido} alt="" />
              </>
            )}
            {m.tipo === "AUDIO" && (
              <>
                <b>{m.autor}</b>
                <audio controls src={SERVER + m.contenido} />
              </>
            )}
            {(m.tipo === "UNION" || m.tipo === "SALIDA") && m.contenido}
            <small>{m.fecha}</small>
          </li>
        ))}
        <li ref={finRef} />
      </ul>

      <p className="escribiendo">{escribe && `${escribe} está transmitiendo…`}</p>

      <form onSubmit={enviarTexto} className="barra">
        <input
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            clientRef.current?.publish({
              destination: "/app/chat.escribiendo",
              body: usuario,
            });
          }}
          placeholder="Transmite un mensaje"
        />
        <button>Enviar</button>
      </form>
    </main>
  );
}