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
        const datos = await obtenerDatos(`eventos?id=${eventoId}`);
        if (datos) {
          setDetallesEvento(datos);
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
          <p>Condiciones que debes tener en cuenta durante el intercambio.</p>
        </div>
      </div>

      <div className="reglas-card">
        <h2>{detallesEvento?.nombre || "Ángel Secreto 2026"}</h2>

        <h3>🎁 Sobre el intercambio</h3>
        <p>Cada participante recibirá una persona a quien deberá preparar un regalo.</p>

        <h3>💰 Presupuesto</h3>
        <p>
          {detallesEvento 
            ? `El valor recomendado del regalo es entre S/ ${Number(detallesEvento.presupuesto_min).toFixed(2)} y S/ ${Number(detallesEvento.presupuesto_max).toFixed(2)}.`
            : "El valor recomendado del regalo se definirá pronto por el administrador."}
        </p>

        <h3>📅 Fecha</h3>
        <p>
          {detallesEvento?.fecha 
            ? `El intercambio se realizará el día ${detallesEvento.fecha}.`
            : "El intercambio se realizará en la fecha acordada por el organizador."}
        </p>

        <h3>🤫 Mantén el secreto</h3>
        <p>
          No reveles públicamente quién te fue asignado. La idea es mantener la magia de la sorpresa hasta el momento
          indicado.
        </p>

        <h3>💝 Wishlist</h3>
        <p>
          Puedes actualizar tu wishlist en cualquier momento para ayudar a la persona que te tenga como amigo
          secreto.
        </p>
      </div>
    </div>
  );
}

export default Reglas;
