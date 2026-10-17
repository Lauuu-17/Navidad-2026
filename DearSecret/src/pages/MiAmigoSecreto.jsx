import { useEffect, useState } from "react";
import { obtenerDatos } from "../services/api";

function MiAmigoSecreto({ usuarioId, eventoId, volver }) {
  const [asignacion, setAsignacion] = useState(null);
  const [sorteoPublicado, setSorteoPublicado] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    async function verificarAsignacion() {
      if (!usuarioId || !eventoId) return;

      try {
        setCargando(true);
        const datos = await obtenerDatos(`asignaciones?participanteId=${usuarioId}&eventoId=${eventoId}`);
        
        if (datos && datos.destinatario_nombre) {
          setAsignacion({
            nombre: datos.destinatario_nombre,
            wishlist: datos.destinatario_wishlist
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
          <p>🔄 Abriendo tu sobre navideño...</p>
        </div>
      ) : !sorteoPublicado ? (
        <div className="secreto-bloqueado">
          <div className="secreto-icono">🎁</div>
          <h1>Tu amigo secreto todavía es secreto</h1>
          <p>El administrador todavía no ha publicado el resultado del sorteo.</p>
          <span>Cuando llegue el momento podrás descubrir a quién debes sorprender.</span>
        </div>
      ) : (
        <div className="secreto-revelado" style={{ maxWidth: "600px", margin: "0 auto" }}>
          <span>Tu misión secreta es regalarle a</span>
          <h1 style={{ fontSize: "2.5rem", color: "#655345", marginBottom: "30px" }}>
            {asignacion?.nombre}
          </h1>

          <div className="preview-block" style={{ textAlign: "left", background: "#fcfaf4", padding: "25px", borderRadius: "12px", border: "1px solid #dfd5c6" }}>
            <h3 style={{ fontSize: "1.2rem", color: "#b59b73", marginBottom: "15px", borderBottom: "2px dashed #dfd5c6", paddingBottom: "8px" }}>
              🪄 Carta a Santa de {asignacion?.nombre} (Wishlist)
            </h3>

            {/* Render de Regalos */}
            <div style={{ marginBottom: "15px" }}>
              <h4 style={{ margin: "5px 0", color: "#655345" }}>🎁 Ideas de Regalos sugeridos:</h4>
              {asignacion?.wishlist?.regalos && asignacion.wishlist.regalos.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "5px" }}>
                  {asignacion.wishlist.regalos.map((item, idx) => (
                    <span key={idx} className="item-badge" style={{ padding: "5px 10px", background: "#f0e6d2", borderRadius: "20px", fontSize: "13px" }}>
                      • {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontStyle: "italic", color: "#a39382", fontSize: "13px" }}>No especificó opciones generales.</p>
              )}
            </div>

            {/* Render de Caricaturas (Mapeado con la propiedad exacta de tu backend) */}
            <div style={{ marginBottom: "15px" }}>
              <h4 style={{ margin: "5px 0", color: "#655345" }}>🎬 Series o Personajes favoritos:</h4>
              {asignacion?.wishlist?.caricaturas && asignacion.wishlist.caricaturas.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "5px" }}>
                  {asignacion.wishlist.caricaturas.map((item, idx) => (
                    <span key={idx} className="item-badge" style={{ padding: "5px 10px", background: "#e8dfcc", borderRadius: "20px", fontSize: "13px" }}>
                      ⭐ {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontStyle: "italic", color: "#a39382", fontSize: "13px" }}>No especificó personajes favoritos.</p>
              )}
            </div>

            {/* Render de Múltiples Links (Mapeado con la propiedad exacta de tu backend) */}
            <div style={{ marginBottom: "15px" }}>
              <h4 style={{ margin: "5px 0", color: "#655345" }}>🔗 Links de productos sugeridos:</h4>
              {asignacion?.wishlist?.enlaces && asignacion.wishlist.enlaces.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "5px" }}>
                  {asignacion.wishlist.enlaces.map((link, idx) => (
                    <a 
                      key={idx} 
                      href={link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="preview-enlace" 
                      style={{ fontSize: "14px", color: "#b59b73", fontWeight: "bold", textDecoration: "underline" }}
                    >
                      🎁 Ver opción de producto #{idx + 1} para regalar ↗
                    </a>
                  ))}
                </div>
              ) : (
                <p style={{ fontStyle: "italic", color: "#a39382", fontSize: "13px" }}>No especificó enlaces externos.</p>
              )}
            </div>

            {/* Comentarios adicionales */}
            {asignacion?.wishlist?.descripcion && (
              <div style={{ marginBottom: "5px" }}>
                <h4 style={{ margin: "5px 0", color: "#655345" }}>📝 Notas adicionales:</h4>
                <p style={{ background: "#f5edd6", padding: "10px", borderRadius: "6px", fontSize: "13px", whiteSpace: "pre-line", color: "#302d32" }}>
                  {asignacion.wishlist.descripcion}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MiAmigoSecreto;
