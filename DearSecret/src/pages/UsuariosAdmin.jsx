import { useState } from "react";
import { enviarDatos } from "../services/api";
import supabaseCliente from "../services/supabaseCliente";

function UsuariosAdmin({ usuarios, setUsuarios, eventos, volver }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [eventoId, setEventoId] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function crearUsuario(e) {
    e.preventDefault();

    if (!nombre.trim() || !usuario.trim()) {
      alert("Completa el nombre y el nombre de usuario.");
      return;
    }

    const usuarioExiste = usuarios.some(
      (persona) => persona.usuario?.toLowerCase() === usuario.trim().toLowerCase()
    );

    if (usuarioExiste) {
      alert("Ese nombre de usuario ya existe.");
      return;
    }

    try {
      setGuardando(true);
        const { data: authData, error: authError } = await supabaseCliente.auth.signUp({
        email: `${usuario.trim().toLowerCase()}@dearsecret.local`,
        password: contrasena
      });

      if (authError) throw authError;

      const nuevoUsuario = await enviarDatos("usuarios", {
        id: authData.user.id,
        nombre: nombre.trim(),
        username: usuario.trim().toLowerCase(),
        rol: "participante",
        eventoId: eventoId === "" ? null : eventoId
      });

      const usuarioConvertido = {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        usuario: nuevoUsuario.username,
        rol: nuevoUsuario.rol,
        eventoId: nuevoUsuario.eventoId || ""
      };

      setUsuarios((anteriores) => [...anteriores, usuarioConvertido]);
      alert("Usuario registrado correctamente en el sistema.");

      setNombre("");
      setUsuario("");
      setContrasena("");
      setEventoId("");
      setMostrarFormulario(false);

    } catch (error) {
      alert("No se pudo registrar en la base de datos: " + error.message);
    } finally {
      setGuardando(false);
    }
  }

  function asignarEvento(idUsuario, nuevoEventoId) {
    const usuariosActualizados = usuarios.map((persona) => {
      if (persona.id === idUsuario) {
        return {
          ...persona,
          eventoId: nuevoEventoId === "" ? null : nuevoEventoId
        };
      }
      return persona;
    });

    setUsuarios(usuariosActualizados);
  }

  return (
    <div className="contenido">
      <button className="boton-secundario" onClick={volver}>
        ← Volver al panel
      </button>

      <div className="titulo-seccion">
        <div>
          <h1>Usuarios</h1>
          <p>Crea cuentas y administra participantes.</p>
        </div>

        <button onClick={() => setMostrarFormulario(true)}>
          + Crear usuario
        </button>
      </div>

      {mostrarFormulario && (
        <div className="formulario-evento">
          <h2>Crear nuevo usuario</h2>

          <form onSubmit={crearUsuario}>
            <label>Nombre del participante</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre completo"
              required
            />

            <label>Nombre de usuario</label>
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ej. fernando"
              required
            />

            <label>Contraseña inicial (temporal)</label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="Contraseña inicial"
              required
            />

            <label>Asignar a un evento</label>
            <select
              value={eventoId}
              onChange={(e) => setEventoId(e.target.value)}
            >
              <option value="">Sin asignar</option>

              {eventos.map((evento) => (
                <option key={evento.id} value={evento.id}>
                  {evento.nombre}
                </option>
              ))}
            </select>

            <div className="acciones-formulario">
              <button
                type="button"
                className="boton-secundario"
                onClick={() => setMostrarFormulario(false)}
              >
                Cancelar
              </button>

              <button type="submit" disabled={guardando}>
                {guardando ? "Creando..." : "Crear usuario"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="tabla-contenedor">
        <table className="tabla-usuarios">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Evento</th>
              <th>Asignación</th>
              <th>Acción</th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((persona) => {
              const eventoAsignado = eventos.find(
                (evento) => String(evento.id) === String(persona.eventoId)
              );

              return (
                <tr key={persona.id}>
                  <td>{persona.nombre}</td>
                  <td>{persona.usuario}</td>

                  <td>
                    {eventoAsignado
                      ? eventoAsignado.nombre
                      : "Sin asignar"}
                  </td>

                  <td>
                    <span
                      className={
                        eventoAsignado
                          ? "estado-activo"
                          : "estado-pendiente"
                      }
                    >
                      {eventoAsignado ? "Asignado" : "Pendiente"}
                    </span>
                  </td>

                  <td>
                    <select
                      value={persona.eventoId ?? ""}
                      onChange={(e) =>
                        asignarEvento(persona.id, e.target.value)
                      }
                    >
                      <option value="">Sin asignar</option>

                      {eventos.map((evento) => (
                        <option key={evento.id} value={evento.id}>
                          {evento.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {usuarios.length === 0 && (
        <p>Todavía no hay usuarios registrados.</p>
      )}
    </div>
  );
}

export default UsuariosAdmin;
