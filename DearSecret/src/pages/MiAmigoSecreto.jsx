import { useEffect, useState } from "react";
import { obtenerDatos } from "../services/api";

// Recibimos 'usuarioId' y 'eventoId' desde App.jsx
function MiAmigoSecreto({ usuarioId, eventoId, volver }) {
  const [asignacion, setAsignacion] = useState(null);
  const [sorteoPublicado, setSorteoPublicado] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    async function verificarAsignacion() {
      if (!usuarioId || !eventoId) return;

      try {
        setCargando(true);
        // Consultamos al backend si existe un emparejamiento para este UUID de usuario
        const datos = await obtenerDatos(`asignaciones?participanteId=${usuarioId}&eventoId=${eventoId}`);
        
        if (datos && datos.destinatario_nombre) {
          setAsignacion({
            nombre: datos.destinatario_nombre,
            // Si la consulta te trae la wishlist del destinatario, la mapeamos aquí:
            descripcion: datos.destinatario_wishlist || "Revisa la Wishlist de esta persona para ver sus gustos."
          });
          setSorteoPublicado(true);
        } else {
          setSorteoPublicado(false);
        }
      } catch (error) {
        console.error("Error al traer amigo secreto:", error.message);
        setSorteoPublicado(false);
      } finally {
        setCargando(false);
      }
    }

    verificarAsignacion();
  }, [usuarioId, eventoId]);

  return (
    <div className="contenido">
      <button className="boton-secundario" onClick={volver}>
        ← Volver
      </button>

      {cargando ? (
        <div className="secreto-bloqueado">
          <p>🔄 Consultando el estado del sorteo...</p>
        </div>
      ) : !sorteoPublicado ? (
        <div className="secreto-bloqueado">
          <div className="secreto-icono">🎁</div>
          <h1>Tu amigo secreto todavía es secreto</h1>
          <p>El administrador todavía no ha publicado el resultado del sorteo.</p>
          <span>Cuando llegue el momento podrás descubrir a quién debes sorprender.</span>
        </div>
      ) : (
        <div className="secreto-revelado">
          <span>Tu misión es regalarle algo especial a</span>
          <h1>{asignacion?.nombre}</h1>
          <p>{asignacion?.descripcion}</p>
        </div>
      )}
    </div>
  );
}

export default MiAmigoSecreto;
