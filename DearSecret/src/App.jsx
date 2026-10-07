
import { useState } from "react";
import "./styles/global2.css";
import EventosAdmin from "./pages/EventosAdmin";
import UsuariosAdmin from "./pages/UsuariosAdmin";
import ControlSorteo from "./pages/ControlSorteo";
import Wishlist from "./pages/Wishlist";
import Reglas from "./pages/Reglas";
import MiAmigoSecreto from "./pages/MiAmigoSecreto";


function App() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [pantalla, setPantalla] = useState("login");
  const [rol, setRol] = useState("");

  function iniciarSesion(e) {
    e.preventDefault();

    if (usuario === "admin" && contrasena === "1234") {
      setRol("admin");
      setPantalla("admin");
    } else if (usuario === "participante" && contrasena === "1234") {
      setRol("participante");
      setPantalla("participante");
    } else {
      alert("Usuario o contraseña incorrectos");
    }
  }
  

  function cerrarSesion() {
    setUsuario("");
    setContrasena("");
    setRol("");
    setPantalla("login");
  }

  return (
    <div className="app">
      {pantalla === "login" && (
        <div className="login-container">
          <div className="login-card">
            <div className="logo">🎁</div>

            <h1>Dear Secret</h1>
            <p className="subtitulo">
              TITULO
            </p>

            <form onSubmit={iniciarSesion}>
              <label>Usuario</label>
              <input
                type="text"
                placeholder="Ingresa tu usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
              />

              <label>Contraseña</label>
              <input
                type="password"
                placeholder="Ingresa tu contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
              />

              <button type="submit" className="boton-login">
                Iniciar sesión
              </button>
            </form>

            <p className="nota">
              Texto prueba.
            </p>
          </div>
        </div>
      )}

      {pantalla === "admin" && (
        <div className="dashboard-theme">
          <header className="encabezado">
            <h2>🎁 Ángel Secreto</h2>
            <button onClick={cerrarSesion} className="boton-secundario">
              Cerrar sesión
            </button>
          </header>

          <div className="contenido">
            <h1>Panel de administración</h1>
            <p>Bienvenida, ingeniera.</p>

            <div className="tarjetas">
              <div className="tarjeta">
                <h3>📅 Eventos</h3>
                <p>Crea eventos y configura todo</p>
                <button onClick={() => setPantalla("eventos")}className="boton-dashboard">
                  Gestionar eventos
                </button>
              </div>

              <div className="tarjeta">
                <h3>👥 Usuarios</h3>
                <p>Crea cuenta y asigna</p>
                <button onClick={() => setPantalla("usuarios")}className="boton-dashboard">
                  Gestionar usuarios
                </button>
              </div>

              <div className="tarjeta">
                <h3>🎲 Control de sorteo</h3>
                <p>Revisa participantes, reglas y asignaciones.</p>
                <button onClick={() => setPantalla("sorteo")}className="boton-dashboard">
                  Abrir control
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pantalla === "participante" && (
        <div className="dashboard-theme">
          <header className="encabezado">
            <h2>🎁 Persona a par</h2>
            <button onClick={cerrarSesion} className="boton-secundario">
              Cerrar sesión
            </button>
          </header>

          <div className="contenido">
            <div className="bienvenida">
              <span>Tu aventura comienza aquí</span>
              <h1>¡Bienvenido, _-----_!</h1>
              <p>
                Mensaje de bienvenida
                mas cosas
              </p>
              
            </div>

            <div className="tarjetas">
              <div className="tarjeta">
                <h3>🎁 Mi amigo secreto</h3>
                <p>
                  CUando el evento incie podras ver a tu par.
                </p>
                <button onClick={() => setPantalla("revelacion")}className="boton-dashboard">
                  Ver mi amigo secreto
                </button>
              </div>

              <div className="tarjeta">
                <h3>💝 Mi Wishlist</h3>
                <p>
                  Comienza con yu carta a santa
                </p>
                <button onClick={() => setPantalla("wishlist")}className="boton-dashboard">
                  Editar wishlist
                </button>
              </div>

              <div className="tarjeta">
                <h3>📜 Reglas del evento</h3>
                <p>
                  Reglas para el juego.
                </p>
                <button onClick={() => setPantalla("reglas")}className="boton-dashboard">
                  Ver reglas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pantalla === "eventos" && (
        <EventosAdmin volver={() => setPantalla("admin")} />
      )}
      {pantalla === "usuarios" && (
        <UsuariosAdmin volver={() => setPantalla("admin")} />
      )}
      {pantalla === "sorteo" && (
        <ControlSorteo volver={() => setPantalla("admin")} />
      )}
      {pantalla === "wishlist" && (
        <Wishlist volver={() => setPantalla("participante")} />
      )}

      {pantalla === "reglas" && (
        <Reglas volver={() => setPantalla("participante")} />
      )}

      {pantalla === "revelacion" && (
        <MiAmigoSecreto volver={() => setPantalla("participante")} />
      )}
      
    </div>
  );
}

export default App;