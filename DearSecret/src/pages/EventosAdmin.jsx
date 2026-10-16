import { useState } from "react";
import { enviarDatos } from "../services/api";

function EventosAdmin({ eventos, setEventos, volver }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [idEdicion, setIdEdicion] = useState(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [minimo, setMinimo] = useState("30");
  const [maximo, setMaximo] = useState("60");
  const [guardando, setGuardando] = useState(false);

  function abrirEditar(evento) {
    setIdEdicion(evento.id);
    setNombre(evento.nombre);
    setDescripcion(evento.descripcion);
    setFecha(evento.fecha);
    setMinimo(String(evento.minimo));
    setMaximo(String(evento.maximo));
    setMostrarFormulario(true);
  }

  function abrirCrear() {
    setIdEdicion(null);
    setNombre("");
    setDescripcion("");
    setFecha("");
    setMinimo("30");
    setMaximo("60");
    setMostrarFormulario(true);
  }

  async function guardarEvento(e) {
    e.preventDefault();

    if (Number(minimo) > Number(maximo)) {
      alert("El presupuesto mínimo no puede superar al máximo.");
      return;
    }

    try {
      setGuardando(true);
      
      const respuesta = await enviarDatos("eventos", {
        id: idEdicion,
        nombre: nombre,
        descripcion: descripcion,
        fecha: fecha,
        minimo: Number(minimo),
        maximo: Number(maximo)
      });

      const eventoConvertido = {
        id: respuesta.id,
        nombre: respuesta.nombre,
        descripcion: respuesta.descripcion || "",
        fecha: respuesta.fecha,
        minimo: respuesta.presupuesto_min,
        maximo: respuesta.presupuesto_max,
        estado: respuesta.estado
      };

      if (idEdicion) {
        setEventos((anteriores) =>
          anteriores.map((ev) => (ev.id === idEdicion ? eventoConvertido : ev))
        );
        alert("Reglas del evento actualizadas correctamente.");
      } else {
        setEventos((anteriores) => [eventoConvertido, ...anteriores]);
        alert("Evento guardado correctamente.");
      }

      setMostrarFormulario(false);
      setIdEdicion(null);
    } catch (error) {
      alert("No se pudo procesar el evento: " + error.message);
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
          <h1>Eventos e Instrucciones</h1>
          <p>Configura las reglas de intercambio que verán los participantes.</p>
        </div>

        <button onClick={abrirCrear}>+ Crear evento</button>
      </div>

      {mostrarFormulario && (
        <div className="formulario-evento">
          <h2>{idEdicion ? "✏️ Modificar Reglas e Instrucciones" : "🎁 Crear nuevo evento"}</h2>

          <form onSubmit={guardarEvento}>
            <label>Nombre del evento</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Navidad 2026"
              required
            />

            <label>📜 Instrucciones o Reglas específicas para el Participante</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Escribe aquí las pautas del intercambio, ideas de entrega o notas del organizador..."
              required
            />

            <label>Fecha del intercambio</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />

            <div className="campos-dinero">
              <div>
                <label>Presupuesto mínimo (S/)</label>
                <input type="number" min="0" value={minimo} onChange={(e) => setMinimo(e.target.value)} required />
              </div>
              <div>
                <label>Presupuesto máximo (S/)</label>
                <input type="number" min="0" value={maximo} onChange={(e) => setMaximo(e.target.value)} required />
              </div>
            </div>

            <div className="acciones-formulario">
              <button type="button" className="boton-secundario" onClick={() => setMostrarFormulario(false)}>
                Cancelar
              </button>
              <button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="lista-eventos">
        {eventos.map((evento) => (
          <div className="evento-card" key={evento.id} onClick={() => abrirEditar(evento)}>
            <div className="evento-icono">🎁</div>
            <div className="evento-info">
              <h2>{evento.nombre}</h2>
              <p style={{ fontStyle: "italic" }}>{evento.descripcion || "Sin instrucciones añadidas."}</p>
              <div className="datos-evento" style={{ marginTop: "10px" }}>
                <span>📅 {evento.fecha}</span>
                <span>💰 S/ {evento.minimo} - S/ {evento.maximo}</span>
              </div>
              <button className="boton-tabla" style={{ marginTop: "15px", width: "100%" }}>
                ⚙️ Editar Reglas / Pautas
              </button>
            </div>
            <span className="estado-evento">{evento.estado}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EventosAdmin;
