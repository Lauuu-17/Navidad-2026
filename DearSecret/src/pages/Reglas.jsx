import { useEffect, useState } from "react";
import { obtenerDatos } from "../services/api";

function Reglas({ eventoId, volver }) {
  const [detallesEvento, setDetallesEvento] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    async function cargarInformacionEvento() {
      if (!eventoId) return;
      try {
        setCargando(true);
        const datos = await obtenerDatos(`eventos`);
        
        const eventoActual = datos.find((e) => String(e.id) === String(eventoId));
        if (eventoActual) {
          setDetallesEvento({
            nombre: eventoActual.nombre,
            descripcion: eventoActual.descripcion,
            presupuesto_min: eventoActual.presupuesto_min,
            presupuesto_max: eventoActual.presupuesto_max,
            fecha: eventoActual.fecha
          });
        }
      } catch (error) {
        console.error("Error al cargar detalles del evento:", error.message);
      } finally {
        setCargando(false);
      }
    }

    cargarInformacionEvento();
  }, [eventoId]);

  return (
    <div className="contenido">
      <button className="boton-secundario" onClick={volver}>
        ← Volver
      </button>

      <div className="titulo-seccion">
        <div>
          <h1>📜 Reglas del evento</h1>
          <p>Condiciones y pautas que debes tener en cuenta durante el intercambio.</p>
        </div>
      </div>

      {cargando ? (
        <p>🔄 Leyendo pautas del servidor...</p>
      ) : (
        <div className="reglas-card">
          <h2>{detallesEvento?.nombre || "Cargando evento..."}</h2>

          <h3>📢 Mensaje y notas del Organizador</h3>
          <p className="nota-organizador-box">
            {detallesEvento?.descripcion || "Cada participante recibirá una persona asignada al iniciar el sorteo."}
          </p>

          <h3>💰 Presupuesto Acordado</h3>
          <p>
            {detallesEvento 
              ? `El valor recomendado del regalo es entre S/ ${Number(detallesEvento.presupuesto_min).toFixed(2)} y S/ ${Number(detallesEvento.presupuesto_max).toFixed(2)}.`
              : "El valor del regalo se definirá pronto."}
          </p>

          <h3>📅 Fecha de Entrega</h3>
          <p>
            {detallesEvento?.fecha 
              ? `El intercambio presencial se realizará el día ${detallesEvento.fecha}.`
              : "La fecha se definirá pronto."}
          </p>

          <h3>🤫 Mantén el secreto</h3>
          <p>
            No reveles públicamente quién te fue asignado. La idea es mantener la magia de la sorpresa hasta el momento indicado.
          </p>

          <h3>💝 Wishlist</h3>
          <p>
            Recuerda rellenar tu wishlist para darle pistas clave a tu amigo secreto sobre tus gustos personales.
          </p>
        </div>
      )}
    </div>
  );
}

export default Reglas;
