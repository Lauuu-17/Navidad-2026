import { useState } from "react";
import { enviarDatos } from "../services/api";

function EventosAdmin({ eventos, setEventos, volver }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [minimo, setMinimo] = useState("30");
  const [maximo, setMaximo] = useState("60");
   const [guardando, setGuardando] = useState(false);

  async function crearEvento(e) {
    e.preventDefault();

    if (Number(minimo) > Number(maximo)) {
      alert("El presupuesto mínimo no puede superar al máximo.");
      return;
    }

    try {
      setGuardando(true);
      const nuevoEvento = await enviarDatos("eventos", {
        nombre: nombre,
        descripcion: descripcion,
        fecha: fecha,
        minimo: Number(minimo),
        maximo: Number(maximo)
      });

      const eventoConvertido = {
        id: nuevoEvento.id,
        nombre: nuevoEvento.nombre,
        descripcion: nuevoEvento.descripcion || "",
        fecha: nuevoEvento.fecha,
        minimo: nuevoEvento.presupuesto_min,
        maximo: nuevoEvento.presupuesto_max,
        estado: nuevoEvento.estado
      };

      setEventos((anteriores) => [
        eventoConvertido,
        ...anteriores
      ]);

      alert("Evento guardado correctamente.");

      setNombre("");
      setDescripcion("");
      setFecha("");
      setMinimo("30");
      setMaximo("60");
      setMostrarFormulario(false);

    } catch (error) {
      alert("No se pudo guardar el evento: " + error.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="contenido">
      <button className="boton-secundario" onClick={volver}>
        ← Volver al panel
      </button>

      <div className="titulo-seccion">
        <div>
          <h1>Eventos</h1>
          <p>Crea y administra los intercambios de regalos.</p>
        </div>

        <button onClick={() => setMostrarFormulario(true)}>
          + Crear evento
        </button>
      </div>

      {mostrarFormulario && (
        <div className="formulario-evento">
          <h2>Crear nuevo evento</h2>

          <form onSubmit={crearEvento}>
            <label>Nombre del evento</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Navidad 2026"
              required
            />

            <label>Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción del intercambio"
            />

            <label>Fecha del intercambio</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />

            <div className="campos-dinero">
              <div>
                <label>Presupuesto mínimo (S/)</label>
                <input
                  type="number"
                  min="0"
                  value={minimo}
                  onChange={(e) => setMinimo(e.target.value)}
                  required
                />
              </div>

              <div>
                <label>Presupuesto máximo (S/)</label>
                <input
                  type="number"
                  min="0"
                  value={maximo}
                  onChange={(e) => setMaximo(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="acciones-formulario">
              <button
                type="button"
                className="boton-secundario"
                onClick={() => setMostrarFormulario(false)}
              >
                Cancelar
              </button>

              <button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar evento"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="lista-eventos">
        {eventos.map((evento) => (
          <div className="evento-card" key={evento.id}>
            <div className="evento-icono">🎁</div>

            <div className="evento-info">
              <h2>{evento.nombre}</h2>
              <p>{evento.descripcion}</p>

              <div className="datos-evento">
                <span>
                  📅 {evento.fecha}
                </span>

                <span>
                  💰 S/ {evento.minimo} - S/ {evento.maximo}
                </span>
              </div>
            </div>

            <span className="estado-evento">{evento.estado}</span>
          </div>
        ))}
      </div>

      {eventos.length === 0 && (
        <p>Todavía no has creado eventos.</p>
      )}
    </div>
  );
}

export default EventosAdmin;
