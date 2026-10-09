import { useEffect, useState } from "react";
import { obtenerDatos,enviarDatos} from "../services/api";
function ReglasAdmin({ usuarios, eventos, volver }) {
  const [eventoId, setEventoId] = useState(
    eventos.length > 0 ? String(eventos[0].id) : ""
  );

  const [reglas, setReglas] = useState([]);

  const [tipoRegla, setTipoRegla] = useState("mutua");
  const [usuarioOrigen, setUsuarioOrigen] = useState("");
  const [usuarioDestino, setUsuarioDestino] = useState("");

  const participantes = usuarios.filter(
    (usuario) => usuario.eventoId === Number(eventoId)
  );

  function agregarRegla(e) {
    e.preventDefault();

    if (!usuarioOrigen || !usuarioDestino) {
      alert("Selecciona los dos participantes.");
      return;
    }

    if (usuarioOrigen === usuarioDestino) {
      alert("Una persona no puede tener una regla consigo misma.");
      return;
    }

    const origen = participantes.find(
      (usuario) => usuario.id === Number(usuarioOrigen)
    );

    const destino = participantes.find(
      (usuario) => usuario.id === Number(usuarioDestino)
    );

    if (!origen || !destino) {
      return;
    }

    const nuevaRegla = {
      id: Date.now(),
      eventoId: Number(eventoId),
      tipo: tipoRegla,
      origenId: origen.id,
      origenNombre: origen.nombre,
      destinoId: destino.id,
      destinoNombre: destino.nombre
    };

    setReglas([...reglas, nuevaRegla]);

    setUsuarioOrigen("");
    setUsuarioDestino("");
  }

  function eliminarRegla(id) {
    const nuevasReglas = reglas.filter(
      (regla) => regla.id !== id
    );

    setReglas(nuevasReglas);
  }

  function cambiarEvento(nuevoEvento) {
    setEventoId(nuevoEvento);
    setUsuarioOrigen("");
    setUsuarioDestino("");
  }

  return (
    <div className="contenido">
      <button className="boton-secundario" onClick={volver}>
        ← Volver al panel
      </button>

      <div className="titulo-seccion">
        <div>
          <h1>⚙️ Reglas del sorteo</h1>
          <p>
            Configura las restricciones que utilizará el sistema
            para generar las asignaciones (TryHack Me).
          </p>
        </div>
      </div>

      <div className="formulario-evento">
        <label>Evento</label>

        <select
          value={eventoId}
          onChange={(e) => cambiarEvento(e.target.value)}
        >
          {eventos.length === 0 && (
            <option value="">No hay eventos</option>
          )}

          {eventos.map((evento) => (
            <option key={evento.id} value={evento.id}>
              {evento.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="reglas-admin">
        <div className="reglas-info">
          <h2>Reglas básicas</h2>

          <div className="regla-fija">
            <span>🚫</span>
            <div>
              <strong>No asignarse a sí mismo</strong>
              <p>
                Esta regla se aplica automáticamente a todos los
                participantes.
              </p>
            </div>
          </div>
        </div>

        <div className="formulario-evento">
          <h2>Agregar restricción</h2>

          <form onSubmit={agregarRegla}>
            <label>Tipo de regla</label>

            <select
              value={tipoRegla}
              onChange={(e) => setTipoRegla(e.target.value)}
            >
              <option value="mutua">
                🚫 Exclusión mutua
              </option>

              <option value="direccional">
                ➡️ Exclusión direccional
              </option>

              <option value="manual">
                🎯 Pareja manual
              </option>
            </select>

            <label>Participante A</label>

            <select
              value={usuarioOrigen}
              onChange={(e) => setUsuarioOrigen(e.target.value)}
            >
              <option value="">
                Seleccionar participante
              </option>

              {participantes.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nombre}
                </option>
              ))}
            </select>

            <label>Participante B</label>

            <select
              value={usuarioDestino}
              onChange={(e) => setUsuarioDestino(e.target.value)}
            >
              <option value="">
                Seleccionar participante
              </option>

              {participantes.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nombre}
                </option>
              ))}
            </select>

            <div className="descripcion-regla">
              {tipoRegla === "mutua" && (
                <p>
                  A no podrá regalarle a B y B tampoco podrá
                  regalarle a A.
                </p>
              )}

              {tipoRegla === "direccional" && (
                <p>
                  A no podrá regalarle a B, pero B sí podrá
                  regalarle a A.
                </p>
              )}

              {tipoRegla === "manual" && (
                <p>
                  A regalará obligatoriamente a B. Esta pareja
                  quedará fijada antes del sorteo automático.
                </p>
              )}
            </div>

            <button type="submit">
              + Agregar regla
            </button>
          </form>
        </div>
      </div>

      <div className="control-sorteo">
        <h2>Reglas configuradas</h2>

        {reglas.length === 0 ? (
          <p>
            No hay restricciones personalizadas para este evento.
          </p>
        ) : (
          <div className="lista-reglas">
            {reglas.map((regla) => (
              <div className="regla-item" key={regla.id}>
                <div>
                  {regla.tipo === "mutua" && (
                    <strong>
                      🚫 Exclusión mutua
                    </strong>
                  )}

                  {regla.tipo === "direccional" && (
                    <strong>
                      ➡️ Exclusión direccional
                    </strong>
                  )}

                  {regla.tipo === "manual" && (
                    <strong>
                      🎯 Pareja manual
                    </strong>
                  )}

                  <p>
                    {regla.origenNombre} →{" "}
                    {regla.destinoNombre}
                  </p>

                  {regla.tipo === "mutua" && (
                    <small>
                      También se bloquea:
                      {" "}
                      {regla.destinoNombre} →{" "}
                      {regla.origenNombre}
                    </small>
                  )}
                </div>

                <button
                  className="boton-tabla"
                  onClick={() => eliminarRegla(regla.id)}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReglasAdmin;