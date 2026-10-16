import { useState } from "react";
import { enviarDatos } from "../services/api";

function EventosAdmin({ eventos, setEventos, volver }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [idEdicion, setIdEdicion] = useState(null);

  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [minimo, setMinimo] = useState("30");
  const [maximo, setMaximo] = useState("60");
  const [guardando, setGuardando] = useState(false);

  const [msgOrganizador, setMsgOrganizador] = useState("");
  const [msgSecreto, setMsgSecreto] = useState("");
  const [msgWishlist, setMsgWishlist] = useState("");

  function abrirEditar(evento) {
    setIdEdicion(evento.id);
    setNombre(evento.nombre);
    setFecha(evento.fecha);
    setMinimo(String(evento.minimo));
    setMaximo(String(evento.maximo));

    try {
      const configDinamica = JSON.parse(evento.descripcion);
      setMsgOrganizador(configDinamica.organizador || "");
      setMsgSecreto(configDinamica.secreto || "");
      setMsgWishlist(configDinamica.wishlist || "");
    } catch {
      setMsgOrganizador(evento.descripcion || "");
      setMsgSecreto("No reveles públicamente quién te fue asignado. La idea es mantener la magia de la sorpresa hasta el momento indicado.");
      setMsgWishlist("Recuerda rellenar tu wishlist para darle pistas clave a tu amigo secreto sobre tus gustos personales.");
    }
    setMostrarFormulario(true);
  }

  function abrirCrear() {
    setIdEdicion(null);
    setNombre("");
    setFecha("");
    setMinimo("30");
    setMaximo("60");
    setMsgOrganizador("");
    setMsgSecreto("No reveles públicamente quién te fue asignado. La idea es mantener la magia de la sorpresa hasta el momento indicado.");
    setMsgWishlist("Recuerda rellenar tu wishlist para darle pistas clave a tu amigo secreto sobre tus gustos personales.");
    setMostrarFormulario(true);
  }

  async function guardarEvento(e) {
    e.preventDefault();

    if (Number(minimo) > Number(maximo)) {
      alert("El presupuesto mínimo no puede superar al máximo.");
      return;
    }

    const empaquetadoDescripcion = JSON.stringify({
      organizador: msgOrganizador,
      secreto: msgSecreto,
      wishlist: msgWishlist
    });

    try {
      setGuardando(true);
      
      const respuesta = await enviarDatos("eventos", {
        id: idEdicion,
        nombre: nombre,
        descripcion: empaquetadoDescripcion,
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
        alert("¡Estructura de pautas actualizada con éxito!");
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
          <h1>Editor Avanzado de Pautas</h1>
          <p>Personaliza dinámicamente cada bloque del panel que visualizan tus participantes.</p>
        </div>
        <button onClick={abrirCrear}>+ Crear evento</button>
      </div>

      {mostrarFormulario && (
        <div className="formulario-evento">
          <h2>{idEdicion ? "✏️ Personalizar Bloques Informativos" : "🎁 Crear nuevo evento"}</h2>

          <form onSubmit={guardarEvento}>
            <label>Nombre del evento</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />

            <label>📅 Fecha del intercambio</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />

            <div className="campos-dinero">
              <div>
                <label>Presupuesto mínimo (S/)</label>
                <input type="number" value={minimo} onChange={(e) => setMinimo(e.target.value)} required />
              </div>
              <div>
                <label>Presupuesto máximo (S/)</label>
                <input type="number" value={maximo} onChange={(e) => setMaximo(e.target.value)} required />
              </div>
            </div>

            <h3 style={{ marginTop: "20px", color: "#655345", fontSize: "15px" }}>✍️ Personalización de Tarjetas</h3>
            <hr style={{ borderColor: "#dfd5c6", marginBottom: "15px" }} />

            <label>📢 Tarjeta 1: Mensaje del Organizador</label>
            <textarea
              value={msgOrganizador}
              onChange={(e) => setMsgOrganizador(e.target.value)}
              placeholder="Notas generales, lugar de la fiesta, penalizaciones..."
              required
            />

            <label>🤫 Tarjeta 2: Pauta de Confidencialidad (Secreto)</label>
            <textarea
              value={msgSecreto}
              onChange={(e) => setMsgSecreto(e.target.value)}
              placeholder="Escribe las condiciones para mantener el anonimato..."
              required
            />

            <label>💝 Tarjeta 3: Instrucción de la Wishlist</label>
            <textarea
              value={msgWishlist}
              onChange={(e) => setMsgWishlist(e.target.value)}
              placeholder="Instrucciones sobre cómo rellenar los gustos..."
              required
            />

            <div className="acciones-formulario">
              <button type="button" className="boton-secundario" onClick={() => setMostrarFormulario(false)}>
                Cancelar
              </button>
              <button type="submit" disabled={guardando}>
                {guardando ? "Guardando Configuración..." : "Guardar Cambios Avanzados"}
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
              <p>Haz clic para gestionar los textos modulares del panel de usuarios.</p>
              <div className="datos-evento" style={{ marginTop: "10px" }}>
                <span>📅 {evento.fecha}</span>
                <span>💰 S/ {evento.minimo} - S/ {evento.maximo}</span>
              </div>
            </div>
            <span className="estado-evento">{evento.estado}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EventosAdmin;
