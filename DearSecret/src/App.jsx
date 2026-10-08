import { useEffect, useState } from "react";
import "./styles/global2.css";
import EventosAdmin from "./pages/EventosAdmin";
import UsuariosAdmin from "./pages/UsuariosAdmin";
import ControlSorteo from "./pages/ControlSorteo";
import Wishlist from "./pages/Wishlist";
import Reglas from "./pages/Reglas";
import MiAmigoSecreto from "./pages/MiAmigoSecreto";
import ReglasAdmin from "./pages/ReglasAdmin";
import { obtenerDatos } from "./services/api";

function App() {
  const [usuario, setUsuario] = useState(""); 
  const [contrasena, setContrasena] = useState("");
  const [pantalla, setPantalla] = useState("login");
  const [rol, setRol] = useState("");
  
  const [usuarios, setUsuarios] = useState([
    { id: 1, nombre: "Fernando", usuario: "fernando", eventoId: 1 },
    { id: 2, nombre: "Laura", usuario: "laura", eventoId: 1 },
    { id: 3, nombre: "Erica", usuario: "erica", eventoId: 1 }
  ]);

  const [eventos, setEventos] = useState([
    {
      id: 1,
      nombre: "Intercambio de Navidad 2026",
      descripcion: "Intercambio de regalos entre amigos.",
      fecha: "2026-12-24",
      minimo: "30",
      maximo: "60",
      estado: "Preparación"
    }
  ]);
  const [cargandoEventos, setCargandoEventos] = useState(true);
  const [errorEventos, setErrorEventos] = useState("");

  async function cargarEventos() {
    try {
      setCargandoEventos(true);
      setErrorEventos("");

      const datos = await obtenerDatos("eventos");

      const eventosConvertidos = datos.map((evento) => ({
        id: evento.id,
        nombre: evento.nombre,
        descripcion: evento.descripcion || "",
        fecha: evento.fecha,
        minimo: evento.presupuesto_min,
        maximo: evento.presupuesto_max,
        estado: evento.estado
      }));

      setEventos(eventosConvertidos);
    } catch (error) {
      setErrorEventos(error.message);
    } finally {
      setCargandoEventos(false);
    }
  }

  useEffect(() => {
    cargarEventos();
  }, []);

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
            <p className="subtitulo">TITULO</p>

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
            <p className="nota">Texto prueba.</p>
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
                <button onClick={() => setPantalla("eventos")} className="boton-dashboard">
                  Gestionar eventos
                </button>
              </div>

              <div className="tarjeta">
                <h3>👥 Usuarios</h3>
                <p>Crea cuenta y asigna</p>
                <button onClick={() => setPantalla("usuarios")} className="boton-dashboard">
                  Gestionar usuarios
                </button>
              </div>

              <div className="tarjeta">
                <h3>🎲 Control de sorteo</h3>
                <p>Revisa participantes, reglas y asignaciones.</p>
                <button onClick={() => setPantalla("sorteo")} className="boton-dashboard">
                  Abrir control
                </button>
                <button onClick={() => setPantalla("reglasAdmin")} className="boton-dashboard">
                  Reglas del sorteo
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
              <p>Mensaje de bienvenida mas cosas</p>
            </div>

            <div className="tarjetas">
              <div className="tarjeta">
                <h3>🎁 Mi amigo secreto</h3>
                <p>Cuando el evento inicie podrás ver a tu par.</p>
                <button onClick={() => setPantalla("revelacion")} className="boton-dashboard">
                  Ver mi amigo secreto
                </button>
              </div>

              <div className="tarjeta">
                <h3>💝 Mi Wishlist</h3>
                <p>Comienza con tu carta a santa</p>
                <button onClick={() => setPantalla("wishlist")} className="boton-dashboard">
                  Editar wishlist
                </button>
              </div>

              <div className="tarjeta">
                <h3>📜 Reglas del evento</h3>
                <p>Reglas para el juego.</p>
                <button onClick={() => setPantalla("reglas")} className="boton-dashboard">
                  Ver reglas
                </button>

              </div>
            </div>
          </div>
        </div>
      )}

      {pantalla === "eventos" && (
        <div className="dashboard-theme">
          <div className="contenido">
            {cargandoEventos && <p> Cargando eventos...</p>}
            
            {errorEventos && (
              <div style={{ color: "red", padding: "10px", border: "1px solid red" }}>
                ⚠️ Error al cargar eventos: {errorEventos}
              </div>
            )}

            {!cargandoEventos && !errorEventos && (
              <EventosAdmin
                eventos={eventos}
                setEventos={setEventos}
                volver={() => setPantalla("admin")}
              />
            )}
          </div>
        </div>
      )}


      {pantalla === "usuarios" && (
        <UsuariosAdmin
          usuarios={usuarios}
          setUsuarios={setUsuarios}
          eventos={eventos}
          volver={() => setPantalla("admin")}
        />
      )}

      {pantalla === "sorteo" && (
        <ControlSorteo
          usuarios={usuarios}
          eventos={eventos}
          volver={() => setPantalla("admin")}
        />
      )}

      {pantalla === "reglasAdmin" && (
        <ReglasAdmin
          usuarios={usuarios}
          eventos={eventos}
          volver={() => setPantalla(rol === "admin" ? "admin" : "participante")}
        />
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
