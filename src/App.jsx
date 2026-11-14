import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import EmojiPicker from "emoji-picker-react";

export const SERVER = "http://localhost:8080";
const WS_URL = "ws://localhost:8080/ws";

export default function App() {
  const [usuario, setUsuario] = useState("");
  const [conectado, setConectado] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [escribe, setEscribe] = useState("");
  const [verEmojis, setVerEmojis] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  const clientRef = useRef(null);
  const finRef = useRef(null);
  const timerRef = useRef(null);
  const inputFileRef = useRef(null);

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
    setVerEmojis(false);
  }

  async function subir(archivo) {
    const datos = new FormData();
    datos.append("archivo", archivo);
    const r = await fetch(SERVER + "/api/archivos", { method: "POST", body: datos });
    if (!r.ok) throw new Error("Falló la subida");
    return (await r.json()).url;
  }

  async function subirYEnviar(archivo) {
    try {
      setSubiendo(true);
      const url = await subir(archivo);
      const tipo = archivo.type.startsWith("image/") ? "IMAGEN" : "AUDIO";
      enviar(tipo, url);
    } catch (err) {
      alert("No se pudo subir el archivo: " + err.message);
    } finally {
      setSubiendo(false);
    }
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
        <div className="login-card">
          <p className="login-kicker">◤ Party Lobby ◢</p>
          <h1>LOBBY GAMER</h1>
          <p className="login-sub">Arma escuadrón, presume rango y entra a la sala</p>
          <input
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="Tu gamertag"
            maxLength={16}
          />
          <button>▶ ENTRAR A LA PARTIDA</button>
        </div>
      </form>
    );
  }

  return (
    <main className="chat">
      <header className="chat-header">
        <span className="dot" /> <b>LOBBY GAMER</b>
        <span className="tag">🟢 {usuario}</span>
      </header>

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
                <b>{m.autor}</b> <span>{m.contenido}</span>
              </>
            )}
            {m.tipo === "IMAGEN" && (
              <>
                <b>{m.autor}</b>
                <img src={SERVER + m.contenido} alt="" loading="lazy" />
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

      <p className="escribiendo">
        {escribe && `⌨️ ${escribe} está escribiendo…`}
      </p>

      <form onSubmit={enviarTexto} className="barra">
        <div className="emoji-wrap">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setVerEmojis(!verEmojis)}
            aria-label="Emojis"
          >
            😄
          </button>
          {verEmojis && (
            <div className="emoji-pop">
              <EmojiPicker
                onEmojiClick={(e) => setTexto((t) => t + e.emoji)}
                theme="dark"
                lazyLoadEmojis
              />
            </div>
          )}
        </div>

        <button
          type="button"
          className="icon-btn"
          onClick={() => inputFileRef.current?.click()}
          disabled={subiendo}
          aria-label="Subir imagen"
        >
          {subiendo ? "⏳" : "🖼️"}
        </button>
        <input
          ref={inputFileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const archivo = e.target.files?.[0];
            if (archivo) await subirYEnviar(archivo);
            e.target.value = "";
          }}
        />

        <input
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            clientRef.current?.publish({
              destination: "/app/chat.escribiendo",
              body: usuario,
            });
          }}
          placeholder="Escribe tu jugada…"
        />
        <button>ENVIAR ⚔</button>
      </form>
    </main>
  );
}