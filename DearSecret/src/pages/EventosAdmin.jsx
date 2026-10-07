import { useState } from "react";

function EventosAdmin({ volver }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [eventos, setEventos] = useState([
    {
      id: 1,
      nombre: "Intercambio de Navidad 2026",
      descripcion: "Intercambio de regalos entre amigos.",
      fecha: "24/12/2026",
      minimo: "30",
      maximo: "60",
      estado: "Preparación"
    }
  ]);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [minimo, setMinimo] = useState("");
  const [maximo, setMaximo] = useState("");

  function crearEvento(e) {
    e.preventDefault();

    const nuevoEvento = {
      id: Date.now(),
      nombre: nombre,
      descripcion: descripcion,
      fecha: fecha,
      minimo: minimo,
      maximo: maximo,
      estado: "Preparación"
    };

    setEventos([...eventos, nuevoEvento]);

    setNombre("");
    setDescripcion("");
    setFecha("");
    setMinimo("");
    setMaximo("");

    setMostrarFormulario(false);
  }

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
          <h1>Eventos</h1>
          <p>
            Crea y administra los eventos de Ángel Secreto.
          </p>
        </div>

        <button
          onClick={() => setMostrarFormulario(true)}
        >
          + Crear evento
        </button>
      </div>

      {mostrarFormulario && (
        <div className="formulario-evento">

          <h2>Crear nuevo evento</h2>

          <form onSubmit={crearEvento}>

            <label>Nombre del evento</label>
            <input
              type="text"
              placeholder="Ej. Intercambio Navidad 2026"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />

            <label>Descripción</label>
            <textarea
              placeholder="Describe brevemente el evento"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />

            <label>Fecha del evento</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />

            <div className="campos-dinero">

              <div>
                <label>Presupuesto mínimo</label>
                <input
                  type="number"
                  min="0"
                  placeholder="30"
                  value={minimo}
                  onChange={(e) => setMinimo(e.target.value)}
                  required
                />
              </div>

              <div>
                <label>Presupuesto máximo</label>
                <input
                  type="number"
                  min="0"
                  placeholder="60"
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

              <button type="submit">
                Crear evento
              </button>

            </div>

          </form>
        </div>
      )}

      <div className="lista-eventos">

        {eventos.map((evento) => (

          <div className="evento-card" key={evento.id}>

            <div className="evento-icono">
              🎁
            </div>

            <div className="evento-info">

              <span className="estado-evento">
                {evento.estado}
              </span>

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

            <button>
              Gestionar
            </button>

          </div>

        ))}

      </div>

    </div>
  );
}

export default EventosAdmin;