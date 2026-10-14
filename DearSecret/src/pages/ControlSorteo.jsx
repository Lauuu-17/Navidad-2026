import { useEffect, useState } from "react";
import { obtenerDatos, enviarDatos } from "../services/api";

function ControlSorteo({ usuarios, eventos, volver }) {
  const [eventoId, setEventoId] = useState(
    eventos.length > 0 ? String(eventos[0].id) : ""
  );

  const [estadoSorteo, setEstadoSorteo] = useState("No iniciado");
  const [asignadosIds, setAsignadosIds] = useState([]);
  
  const [sorteos, setSorteos] = useState([]);
  const [cargandoSorteos, setCargandoSorteos] = useState(false);
  const [guardandoSorteo, setGuardandoSorteo] = useState(false);

  const participantes = usuarios.filter(
    (persona) => String(persona.eventoId) === String(eventoId)
  );

  async function cargarSorteos() {
    try {
      setCargandoSorteos(true);
      const datos = await obtenerDatos("sorteo");
      setSorteos(datos);
      
      sincronizarEstadoConDB(eventoId, datos);
    } catch (error) {
      console.error("Error al cargar sorteos: " + error.message);
    } finally {
      setCargandoSorteos(false);
    }
  }

  useEffect(() => {
    cargarSorteos();
  }, []);

  function sincronizarEstadoConDB(idDelEvento, listaSorteos) {
    const sorteoExistente = listaSorteos.find(
      (s) => String(s.evento_id) === String(idDelEvento)
    );

    if (sorteoExistente) {
      if (sorteoExistente.estado === "pendiente") {
        setEstadoSorteo("Pendiente de revisión");
        setAsignadosIds(participantes.map((persona) => persona.id));
      } else if (sorteoExistente.estado === "publicado") {
        setEstadoSorteo("Publicado");
        setAsignadosIds(participantes.map((persona) => persona.id));
      } else {
        setEstadoSorteo("No iniciado");
        setAsignadosIds([]);
      }
    } else {
      setEstadoSorteo("No iniciado");
      setAsignadosIds([]);
    }
  }

  async function crearSorteo() {
    if (!eventoId) {
      alert("Selecciona un evento válido.");
      return;
    }

    try {
      setGuardandoSorteo(true);
      const nuevoSorteo = await enviarDatos("sorteo", {
        eventoId: eventoId
      });

      const listaActualizada = [nuevoSorteo, ...sorteos];
      setSorteos(listaActualizada);

      alert("¡Sorteo creado con éxito en Supabase!");
      setEstadoSorteo("Pendiente de revisión");
      setAsignadosIds(participantes.map((persona) => persona.id));

    } catch (error) {
      alert("No se pudo crear el sorteo en la base de datos: " + error.message);
    } finally {
      setGuardandoSorteo(false);
    }
  }

  function cambiarEvento(nuevoEventoId) {
    setEventoId(nuevoEventoId);
    sincronizarEstadoConDB(nuevoEventoId, sorteos);
  }

  function iniciarSorteo() {
    if (participantes.length < 2) {
      alert("Se necesitan al menos 2 participantes para iniciar.");
      return;
    }
    setAsignadosIds(participantes.map((persona) => persona.id));
    setEstadoSorteo("Pendiente de revisión");
  }

  async function reiniciarSorteo() {
    if (!eventoId) return;

    const confirmar = window.confirm("¿Estás seguro de que deseas eliminar el sorteo actual de Supabase? Esto borrará todas las parejas asignadas y permitirá crear un sorteo nuevo.");
    if (!confirmar) return;

    try {
      setCargandoSorteos(true);
      
      await eliminarDatos("sorteo", {
        eventoId: eventoId
      });

      setAsignadosIds([]);
      setEstadoSorteo("No iniciado");
      
      const datosActualizados = await obtenerDatos("sorteo");
      setSorteos(datosActualizados);

      alert("🎉 Base de datos limpia.");
    } catch (error) {
      alert("No se pudo reiniciar el sorteo en el servidor: " + error.message);
    } finally {
      setCargandoSorteos(false);
    }
  }


  async function publicarSorteo() {
    if (!eventoId) return;

    try {
      setCargandoSorteos(true);
      await enviarDatos("sorteo", {
        eventoId: eventoId,
        ejecutarEmparejamiento: true
      });
      setEstadoSorteo("Publicado");
    } catch (error) {
      alert("Error al procesar el sorteo oficial: " + error.message);
    } finally {
      setCargandoSorteos(false);
    }
  }


  const eventoActual = eventos.find(
    (evento) => String(evento.id) === String(eventoId)
  );

  const asignados = participantes.filter(
    (persona) => asignadosIds.includes(persona.id)
  ).length;

  return (
    <div className="contenido">
      <button className="boton-secundario" onClick={volver}>
        ← Volver al panel
      </button>

      <div className="titulo-seccion">
        <div>
          <h1>Control de sorteo</h1>
          <p>Supervisa a los participantes.</p>
        </div>
        <span className="estado-sorteo">{estadoSorteo}</span>
      </div>

      <div className="formulario-evento">
        <label>Seleccionar evento</label>
        <select
          value={eventoId}
          onChange={(e) => cambiarEvento(e.target.value)}
        >
          {eventos.length === 0 && (
            <option value="">No hay eventos creados</option>
          )}
          {eventos.map((evento) => (
            <option key={evento.id} value={evento.id}>
              {evento.nombre}
            </option>
          ))}
        </select>

        {eventoActual && (
          <p>
            Fecha: {eventoActual.fecha} · Presupuesto: S/{" "}
            {eventoActual.minimo} - S/ {eventoActual.maximo}
          </p>
        )}
      </div>

      <div className="resumen-sorteo">
        <div className="resumen-card">
          <span>Participantes</span>
          <strong>{participantes.length}</strong>
        </div>
        <div className="resumen-card">
          <span>Asignados</span>
          <strong>{asignados}</strong>
        </div>
        <div className="resumen-card">
          <span>Pendientes</span>
          <strong>{participantes.length - asignados}</strong>
        </div>
      </div>

      <div className="control-sorteo">
        <h2>Participantes del evento</h2>
        {cargandoSorteos ? (
          <p>🔄 Validando registros en Supabase...</p>
        ) : participantes.length === 0 ? (
          <p>
            No hay participantes asignados a este evento. Ve a Usuarios y
            asigna las personas.
          </p>
        ) : (
          <div className="lista-participantes">
            {participantes.map((persona) => (
              <div className="participante-sorteo" key={persona.id}>
                <div>
                  <strong>{persona.nombre}</strong>
                  <p>@{persona.usuario}</p>
                </div>
                {asignadosIds.includes(persona.id) ? (
                  <span className="estado-asignado">
                    ✓ Procesado
                  </span>
                ) : (
                  <span className="estado-pendiente">
                    Pendiente
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="acciones-sorteo">
        {estadoSorteo === "No iniciado" && (
          <>
            <button
              className="boton-secundario"
              onClick={iniciarSorteo}
              disabled={participantes.length < 2}
            >
              🎲 Ejecutar prueba local
            </button>

            <button 
              onClick={crearSorteo} 
              disabled={participantes.length < 2 || guardandoSorteo}
            >
              {guardandoSorteo ? "Creando..." : "Crear sorteo oficial"}
            </button>
          </>
        )}

        {estadoSorteo === "Pendiente de revisión" && (
          <>
            <button
              className="boton-secundario"
              onClick={reiniciarSorteo}
            >
              ↻ Reiniciar vista
            </button>

            <button onClick={publicarSorteo}>
              ✓ Aprobar y Publicar
            </button>
          </>
        )}

        {estadoSorteo === "Publicado" && (
          <div className="sorteo-publicado">
            ¡Sorteo oficial publicado! Las parejas ya se encuentran disponibles en los paneles.
          </div>
        )}
      </div>
    </div>
  );
}

export default ControlSorteo;
