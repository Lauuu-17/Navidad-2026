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
import { iniciarSesion as autenticarUsuario, cerrarSesion as cerrarSesionSupabase } from "./services/authService";
import supabaseCliente from "./services/supabaseCliente";
import logoNavidad from "./assets/logo-navidad.png"; 


function App() {
  const [usuario, setUsuario] = useState(""); 
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [pantalla, setPantalla] = useState("login");
  const [rol, setRol] = useState("");
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);
  const [errorLogin, setErrorLogin] = useState("");
  const [cargandoLogin, setCargandoLogin] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [comprobandoSesion, setComprobandoSesion] = useState(true);
  const [guardandoRegla, setGuardandoRegla] = useState(false);

  const [eventos, setEventos] = useState([]);
  const [cargandoEventos, setCargandoEventos] = useState(true);
  const [errorEventos, setErrorEventos] = useState("");
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [errorUsuarios, setErrorUsuarios] = useState("");
  const [reglas, setReglas] = useState([]);
  const [cargandoReglas, setCargandoReglas] = useState(false);

  // Escuchador dinámico de sesión persistente activa
  useEffect(() => {
    async function cargarPerfilUsuario(sessionUser) {
      try {
        const { data: perfil, error: errorPerfil } = await supabaseCliente
          .from("usuarios")
          .select("id, rol, nombre, username")
          .eq("auth_user_id", sessionUser.id)
          .single();

        if (errorPerfil) throw errorPerfil;

        if (perfil) {
          const { data: userParts } = await supabaseCliente
            .from("participaciones")
            .select("evento_id, estado")
            .eq("usuario_id", perfil.id);

          const participacionActiva = userParts?.find((p) => p.estado === "activo") || userParts?.[0];

          const usuarioActual = {
            id: perfil.id, 
            nombre: perfil.nombre,
            usuario: perfil.username,
            rol: perfil.rol,
            eventoId: participacionActiva?.evento_id || ""
          };

          setUsuarioLogueado(usuarioActual);
          setRol(perfil.rol);
          setPantalla(perfil.rol === "admin" ? "admin" : "participante");
        }
      } catch (e) {
        console.error("Error al recuperar perfil:", e);
        setPantalla("login");
      } finally {
        setComprobandoSesion(false);
      }
    }

    // Escucha activamente si el token se refresca en segundo plano de manera infinita
    const { data: { subscription } } = supabaseCliente.auth.onAuthStateChange((event, session) => {
      if (session && session.user) {
        cargarPerfilUsuario(session.user);
      } else {
        setPantalla("login");
        setComprobandoSesion(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function cargarDatosSecuenciales() {
      if (rol === "admin") {
        try {
          setCargandoUsuarios(true);
          setErrorUsuarios("");
          
          const datosUsuarios = await obtenerDatos("usuarios");
          const usuariosConvertidos = datosUsuarios.map((u) => {
            let evId = "";
            if (u.participaciones && u.participaciones.length > 0) {
              evId = u.participaciones[0].evento_id;
            }
            return {
              id: u.id,
              nombre: u.nombre,
              usuario: u.username || u.usuario || "", 
              rol: u.rol || "participante",
              eventoId: evId 
            };
          });
          setUsuarios(usuariosConvertidos);
          
          await cargarEventos();

          await cargarReglas(usuariosConvertidos);
          
        } catch (error) {
          console.error("Error en carga inicial:", error);
          setErrorUsuarios(error.message);
        } finally {
          setCargandoUsuarios(false);
        }
      } else if (rol === "participante") {
        await cargarEventos();
        setUsuarioLogueado((prev) => {
          if (prev && prev.eventoId) {
            return { ...prev, eventoId: prev.eventoId };
          }
          return prev;
        });
      }


    }
    
    cargarDatosSecuenciales();
  }, [rol]);


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

  async function cargarUsuarios() {
    try {
      setCargandoUsuarios(true);
      setErrorUsuarios("");

      const datos = await obtenerDatos("usuarios");

      const usuariosConvertidos = datos.map((u) => {
        let evId = "";
        
        if (u.eventos && Array.isArray(u.eventos) && u.eventos.length > 0) {
          const activo = u.eventos.find(e => e.estado === "activo") || u.eventos[0];
          evId = activo.eventoId;
        } else if (u.participaciones && Array.isArray(u.participaciones) && u.participaciones.length > 0) {
          const activa = u.participaciones.find(p => p.estado === "activo") || u.participaciones[0];
          evId = activa.evento_id;
        }

        return {
          id: u.id,
          nombre: u.nombre,
          usuario: u.username || u.usuario || "", 
          rol: u.rol || "participante",
          eventoId: evId 
        };
      });

      setUsuarios(usuariosConvertidos);
    } catch (error) {
      console.error("Error en cargarUsuarios:", error);
      setErrorUsuarios(error.message);
    } finally {
      setCargandoUsuarios(false);
    }
  }

  async function cargarReglas(usuariosActualizados = null) {
    try {
      setCargandoReglas(true);
      const datos = await obtenerDatos("reglas");
      const listaUsuarios = usuariosActualizados || usuarios;

      const reglasConvertidas = datos.map((regla) => {
        const origen = listaUsuarios.find((u) => String(u.id) === String(regla.origen_id));
        const destino = listaUsuarios.find((u) => String(u.id) === String(regla.destino_id));

        return {
          id: regla.id,
          eventoId: regla.evento_id,
          tipo: regla.tipo,
          origenId: regla.origen_id,
          origenNombre: origen ? origen.nombre : "Cargando...",
          destinoId: regla.destino_id,
          destinoNombre: destino ? destino.nombre : "Cargando..."
        };
      });
      
      setReglas(reglasConvertidas);
    } catch (error) {
      console.error("Error al cargar las reglas: " + error.message);
    } finally {
      setCargandoReglas(false);
    }
  }


  async function iniciarSesion(e) {
    e.preventDefault();
    try {
      setCargandoLogin(true);
      setErrorLogin("");
      const perfil = await autenticarUsuario(usuario.trim(), contrasena);
      const participacionActiva = perfil.participaciones?.find((p) => p.estado === "activo");
      const usuarioActual = {
        id: perfil.id,
        nombre: perfil.nombre,
        usuario: perfil.username,
        rol: perfil.rol,
        eventoId: participacionActiva?.evento_id || ""
      };
      setUsuarioLogueado(usuarioActual);
      setRol(perfil.rol);
      setPantalla(perfil.rol === "admin" ? "admin" : "participante");
    } catch (error) {
      setErrorLogin(error.message || "No se pudo iniciar sesión.");
    } finally {
      setCargandoLogin(false);
    }
  }

  async function cerrarSesion() {
    try {
      await cerrarSesionSupabase();
    } catch (error) {
      console.error("Error al cerrar sesión en el servidor:", error);
    }
    setUsuario("");
    setContrasena("");
    setMostrarContrasena(false);
    setRol("");
    setUsuarioLogueado(null);
    setPantalla("login");
  }

  if (comprobandoSesion) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f7f0df" }}>
        <p style={{ fontSize: "16px", color: "#302d32", fontWeight: "600" }}>Cargando sesión segura...</p>
      </div>
    );
  }

  // LOGIN PANTALLA
  const esPantallaAdmin = ["admin", "eventos", "usuarios", "sorteo", "reglasAdmin"].includes(pantalla);

  return (
    <div className="app">
      {pantalla === "login" && (
        <div className="login-container">
          <div className="login-card">
            <img src={logoNavidad} alt="Logo Navideño" className="logo-imagen" />
            <h1>Merequetengue Navideño</h1>
            <form onSubmit={iniciarSesion}>
              <label>¿Quién eres?</label>
              <input type="text" value={usuario} onChange={(e) => setUsuario(e.target.value)} required />
              <label>Contraseña</label>
              <div className="input-contrasena-container">
                <input type={mostrarContrasena ? "text" : "password"} value={contrasena} onChange={(e) => setContrasena(e.target.value)} required />
                <button type="button" className="boton-mostrar-ocultar" onClick={() => setMostrarContrasena(!mostrarContrasena)}>
                  {mostrarContrasena ? "🙈" : "👁️"}
                </button>
              </div>
              {errorLogin && <p style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>⚠️ {errorLogin}</p>}
              <button type="submit" className="boton-login" disabled={cargandoLogin}>
                {cargandoLogin ? "Validando..." : "Iniciar sesión"}
              </button>
            </form>
            <p className="nota">Pórtate bien… el Grinch podría estar mirando</p>
          </div>
        </div>
      )}

      {/* DISEÑO MAESTRO UNIFICADO DE ADMINISTRACIÓN */}
      {esPantallaAdmin && (
        <div className="dashboard-theme">
          <header className="encabezado">
            <h2>Todo esta en tus manos</h2>
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                onClick={() => setPantalla("participante")} 
                className="boton-secundario"
                style={{ borderColor: "#b59b73", color: "#655345" }}
              >
                👁️ Ver Como Participante
              </button>
              <button onClick={cerrarSesion} className="boton-secundario">
                Cerrar sesión
              </button>
            </div>
          </header>

          <div className="contenido">
            {pantalla === "admin" && (
              <>
                <h1>Panel de administración</h1>
                <p>Bienvenida Grinch</p>
                <div className="tarjetas">
                  <div className="tarjeta">
                    <h3>📅 Eventos</h3>
                    <p>Crea eventos y configura todo</p>
                    <button onClick={() => setPantalla("eventos")} className="boton-dashboard">Gestionar eventos</button>
                  </div>
                  <div className="tarjeta">
                    <h3>👥 Usuarios</h3>
                    <p>Crea cuenta y asigna</p>
<button onClick={() => setPantalla("usuarios")} className="boton-dashboard">Gestionar usuarios</button>
                  </div>

                  <div className="tarjeta">
                    <h3>🎲 Control de sorteo</h3>
                    <p>Revisa participantes, reglas y asignaciones</p>
                    <button onClick={() => setPantalla("sorteo")} className="boton-dashboard">Abrir control</button>
                    <button onClick={() => setPantalla("reglasAdmin")} className="boton-dashboard">Reglas del sorteo</button>
                  </div>
                </div>
              </>
            )}

            {pantalla === "eventos" && (
              <>
                {cargandoEventos && <p>Cargando eventos...</p>}
                {errorEventos && (
                  <div style={{ color: "red", padding: "10px" }}>
                    ⚠️ Error: {errorEventos}
                  </div>
                )}
                {!cargandoEventos && !errorEventos && (
                  <EventosAdmin eventos={eventos} setEventos={setEventos} volver={() => setPantalla("admin")} />
                )}
              </>
            )}

            {pantalla === "usuarios" && (
              <>
                {cargandoUsuarios && <p>Cargando lista de usuarios...</p>}
                {errorUsuarios && (
                  <div style={{ color: "red", padding: "10px" }}>
                    ⚠️ Error: {errorUsuarios}
                  </div>
                )}
                {!cargandoUsuarios && !errorUsuarios && (
                  <UsuariosAdmin usuarios={usuarios} setUsuarios={setUsuarios} eventos={eventos} volver={() => setPantalla("admin")} />
                )}
              </>
            )}

            {pantalla === "sorteo" && (
              <ControlSorteo usuarios={usuarios} eventos={eventos} volver={() => setPantalla("admin")} />
            )}

            {pantalla === "reglasAdmin" && (
              <ReglasAdmin 
                usuarios={usuarios} 
                eventos={eventos} 
                reglas={reglas} 
                setReglas={setReglas} 
                guardandoRegla={guardandoRegla}
                setGuardandoRegla={setGuardandoRegla}
                volver={() => setPantalla("admin")} 
              />
            )}
          </div>
        </div>
      )}

      {/* PANTALLA: MENÚ PARTICIPANTE */}
      {pantalla === "participante" && (
        <div className="dashboard-theme">
          <header className="encabezado">
            <h2>Pasando Navidad desde 2016 🌟</h2>
            <div style={{ display: "flex", gap: "10px" }}>
              {rol === "admin" && (
                <button 
                  onClick={() => setPantalla("admin")} 
                  className="boton-dashboard" 
                  style={{ width: "auto", padding: "10px 20px", background: "#b59b73" }}
                >
                  ⚙️ Volver a Admin
                </button>
              )}
              <button onClick={cerrarSesion} className="boton-secundario">Cerrar sesión</button>
            </div>
          </header>

          <div className="contenido">
            <div className="bienvenida">
              <span>Listo para el</span>
              <h1>Merequetengue Navideño, {usuarioLogueado?.nombre || "Participante"}!</h1>
              <p>Recuerda que nuestro mejor regalo es pasarla juntos</p>
            </div>

            <div className="tarjetas">
              <div className="tarjeta">
                <h3>🎁 Mi amigo secreto</h3>
                <p>Cuando el evento inicie podrás ver quién es tu amigo secreto</p>
                <button onClick={() => setPantalla("revelacion")} className="boton-dashboard">Ver mi amigo secreto</button>
              </div>

              <div className="tarjeta">
                <h3>Wishlist 🪄</h3>
                <p>Comienza con tu carta a Santa</p>
                <button onClick={() => setPantalla("wishlist")} className="boton-dashboard">Editar Wishlist</button>
              </div>

              <div className="tarjeta">
                <h3>📜 Reglas del evento</h3>
                <p>Consulta las condiciones, fechas y más del intercambio.</p>
                <button onClick={() => setPantalla("reglas")} className="boton-dashboard">Ver reglas</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pantalla === "wishlist" && (
        <Wishlist usuarioId={usuarioLogueado?.id} eventoId={usuarioLogueado?.eventoId || ""} volver={() => setPantalla("participante")} />
      )}

      {pantalla === "reglas" && (
        <Reglas eventoId={usuarioLogueado?.eventoId || ""} volver={() => setPantalla("participante")} />
      )}

      {pantalla === "revelacion" && (
        <MiAmigoSecreto usuarioId={usuarioLogueado?.id} eventoId={usuarioLogueado?.eventoId || ""} volver={() => setPantalla("participante")} />
      )}
    </div>
  );
}

export default App;