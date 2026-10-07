import { useState } from "react";

function ControlSorteo({ volver }) {

  const [estadoSorteo, setEstadoSorteo] = useState("No iniciado");

  const [participantes, setParticipantes] = useState([
    {
      id: 1,
      nombre: "Fernando",
      asignado: false
    },
    {
      id: 2,
      nombre: "Laura",
      asignado: false
    },
    {
      id: 3,
      nombre: "Erica",
      asignado: false
    },
    {
      id: 4,
      nombre: "User4",
      asignado: false
    }
  ]);

  function iniciarSorteo() {
    const nuevosParticipantes = participantes.map((participante) => ({
      ...participante,
      asignado: true
    }));

    setParticipantes(nuevosParticipantes);
    setEstadoSorteo("Pendiente de revisión");
  }

  function reiniciarSorteo() {
    const nuevosParticipantes = participantes.map((participante) => ({
      ...participante,
      asignado: false
    }));

    setParticipantes(nuevosParticipantes);
    setEstadoSorteo("No iniciado");
  }

  function publicarSorteo() {
    setEstadoSorteo("Publicado");
  }

  const asignados = participantes.filter(
    (participante) => participante.asignado
  ).length;

  return (
    <div className="contenido">

      <button
        className="boton-secundario"
        onClick={volver}
      >
        ← Volver al panel
      </button>

      <div className="titulo-seccion">

        <div>
          <h1>Control de sorteo</h1>

          <p>
            Supervisa.
          </p>
        </div>

        <span className="estado-sorteo">
          {estadoSorteo}
        </span>

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
          <strong>
            {participantes.length - asignados}
          </strong>
        </div>

      </div>

      <div className="control-sorteo">

        <h2>Participantes</h2>

        <div className="lista-participantes">

          {participantes.map((participante) => (

            <div
              className="participante-sorteo"
              key={participante.id}
            >

              <div>
                <strong>{participante.nombre}</strong>
              </div>

              {participante.asignado ? (

                <span className="estado-asignado">
                  ✓ Asignado
                </span>

              ) : (

                <span className="estado-pendiente">
                  Pendiente
                </span>

              )}

            </div>

          ))}

        </div>

      </div>

      <div className="acciones-sorteo">

        {estadoSorteo === "No iniciado" && (

          <button onClick={iniciarSorteo}>
            🎲 Ejecutar sorteo
          </button>

        )}

        {estadoSorteo === "Pendiente de revisión" && (

          <>
            <button
              className="boton-secundario"
              onClick={reiniciarSorteo}
            >
              ↻ Realizar otro sorteo
            </button>

            <button onClick={publicarSorteo}>
              ✓ Aprobar y publicar
            </button>
          </>

        )}

        {estadoSorteo === "Publicado" && (

          <div className="sorteo-publicado">
            🎉 El sorteo ya fue publicado para los participantes.
          </div>

        )}

      </div>

    </div>
  );
}

export default ControlSorteo;