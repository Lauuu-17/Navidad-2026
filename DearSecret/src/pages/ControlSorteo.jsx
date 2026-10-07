import { useState } from "react";

function ControlSorteo({ usuarios, eventos, volver }) {
  const [eventoId, setEventoId] = useState(
    eventos.length > 0 ? String(eventos[0].id) : ""
  );

  const [estadoSorteo, setEstadoSorteo] = useState("No iniciado");
  const [asignadosIds, setAsignadosIds] = useState([]);

  const participantes = usuarios.filter(
    (persona) => persona.eventoId === Number(eventoId)
  );

  function cambiarEvento(nuevoEventoId) {
    setEventoId(nuevoEventoId);
    setAsignadosIds([]);
    setEstadoSorteo("No iniciado");
  }

  function iniciarSorteo() {
    if (participantes.length < 2) {
      alert("INiciar con 2 participantes.");
      return;
    }

    setAsignadosIds(participantes.map((persona) => persona.id));
    setEstadoSorteo("Pendiente de revisión");
  }

  function reiniciarSorteo() {
    setAsignadosIds([]);
    setEstadoSorteo("No iniciado");
  }

  function publicarSorteo() {
    setEstadoSorteo("Publicado");
  }

  const eventoActual = eventos.find(
    (evento) => evento.id === Number(eventoId)
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

        {participantes.length === 0 ? (
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
                    ✓ Procesado (simulación)
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
          <button
            onClick={iniciarSorteo}
            disabled={participantes.length < 2}
          >
            🎲 Ejecutar prueba de sorteo
          </button>
        )}

        {estadoSorteo === "Pendiente de revisión" && (
          <>
            <button
              className="boton-secundario"
              onClick={reiniciarSorteo}
            >
              ↻ Reiniciar prueba
            </button>

            <button onClick={publicarSorteo}>
              ✓ Aprobar prueba
            </button>
          </>
        )}

        {estadoSorteo === "Publicado" && (
          <div className="sorteo-publicado">
            La prueba fue aprobada. Todavía no se ha publicado un sorteo
            real ni se han generado parejas.
          </div>
        )}
      </div>
    </div>
  );
}

export default ControlSorteo;