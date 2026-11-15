# Chat Client · Lobby Gamer (Frontend)

Cliente web interactivo para el chat en tiempo real. Construido con **React**, **Vite** y la librería `@stomp/stompjs` para comunicarse por WebSocket con el servidor de Spring Boot.

## Tecnologías utilizadas
- **React 18** (con Hooks)
- **Vite** (Bundler)
- **@stomp/stompjs** (Cliente STOMP sobre WebSocket)
- **emoji-picker-react** (Selector de emojis)
- **CSS Puro** (Tema personalizado Lobby Gamer con animaciones y colores neón)

## Cómo ejecutar en local
1. Asegúrate de tener el backend (`chat-server`) corriendo en el puerto 8080.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
    ```bash
    npm run dev
    ```
4. Abre http://localhost:5173 en tu navegador.

5. **Tip:** Abre 3 pestañas distintas con nombres diferentes para probar la experiencia multiusuario y ver cómo aparecen y desaparecen del lobby.

## Tema Escogido: Lobby Gamer
El chat cuenta con una identidad visual completa inspirada en un Lobby de videojuegos:

- Interfaz oscura con colores neón (morado y cyan).

- Tipografía futurista (`Unbounded` y `JetBrains Mono`).

- Las burbujas de chat diferencian al usuario (`mio`), a los demás (`otro`) y los mensajes del sistema (`UNION` / `SALIDA`).

- Mensajes de sistema gamificados (Ej: `🎮 NoobSlayer se unió al lobby`).

##  Funciones Extra Implementadas
Además del chat de texto básico, se implementaron las siguientes funciones:

1. **Envío de Imágenes:** Botón en la barra inferior que permite seleccionar una imagen, la sube vía HTTP (`POST /api/archivos`) y luego la transmite por WebSocket para que todos los usuarios la vean.

2. **Selector de Emojis:** Integración de `emoji-picker-react` para insertar emojis fácilmente en el input de texto.

3. **Indicador "Escribiendo..."**: Suscripción al topic `/topic/escribiendo` para mostrar cuándo otro jugador está tecleando.

## Capturas de Pantalla

1. Pantalla de Login
![Login](/chat-client/docs/Login.png)

2. Sala de Chat en Vivo (Imágenes y Emojis)
![Chat en Vivo](/chat-client/docs/ChatFuncional.png)

