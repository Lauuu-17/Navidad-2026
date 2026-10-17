import { useEffect, useState } from "react";
import { obtenerDatos, enviarDatos } from "../services/api";

function Wishlist({ usuarioId, eventoId, volver }) {
  const [regalosList, setRegalosList] = useState([]);
  const [caricaturasList, setCaricaturasList] = useState([]);
  const [enlacesList, setEnlacesList] = useState([]); // Nuevo estado de lista para enlaces
  
  const [inputRegalo, setInputRegalo] = useState("");
  const [inputCaricatura, setInputCaricatura] = useState("");
  const [inputEnlace, setInputEnlace] = useState(""); // Input temporal para el link activo
  const [inputDescripcion, setInputDescripcion] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  async function cargarWishlistExistente() {
    if (!eventoId) return;

    try {
      setCargandoHistorial(true);
      const datos = await obtenerDatos(`wishlist?eventoId=${encodeURIComponent(eventoId)}`);

      if (datos) {
        try { setRegalosList(datos.regalo ? JSON.parse(datos.regalo) : []); } catch { setRegalosList(datos.regalo ? [datos.regalo] : []); }
        try { setCaricaturasList(datos.caricatura ? JSON.parse(datos.caricatura) : []); } catch { setCaricaturasList(datos.caricatura ? [datos.caricatura] : []); }
        // Deserializamos la lista de enlaces de forma segura
        try { setEnlacesList(datos.enlace ? JSON.parse(datos.enlace) : []); } catch { setEnlacesList(datos.enlace ? [datos.enlace] : []); }

        setInputDescripcion(datos.descripcion || "");
      }
    } catch (error) {
      console.log("Sin registro previo en la base de datos:", error.message);
    } finally {
      setCargandoHistorial(false);
    }
  }

  useEffect(() => {
    cargarWishlistExistente();
  }, [eventoId]);

  async function sincronizarConBackend(nuevaListaRegalos, nuevaListaCaricaturas, nuevaListaEnlaces, descActual) {
    if (!eventoId) return;
    try {
      setGuardando(true);
      await enviarDatos("wishlist", {
        eventoId: eventoId,
        regalo: JSON.stringify(nuevaListaRegalos),
        caricatura: JSON.stringify(nuevaListaCaricaturas),
        enlace: JSON.stringify(nuevaListaEnlaces), // Guardamos los links como un arreglo JSON estructurado
        descripcion: descActual
      });
    } catch (error) {
      alert("Error al sincronizar con el servidor: " + error.message);
    } finally {
      setGuardando(false);
    }
  }

  async function agregarRegalo(e) {
    e.preventDefault();
    if (!inputRegalo.trim()) return;
    const actualizada = [...regalosList, inputRegalo.trim()];
    setRegalosList(actualizada);
    setInputRegalo("");
    await sincronizarConBackend(actualizada, caricaturasList, enlacesList, inputDescripcion);
  }

  async function agregarCaricatura(e) {
    e.preventDefault();
    if (!inputCaricatura.trim()) return;
    const actualizada = [...caricaturasList, inputCaricatura.trim()];
    setCaricaturasList(actualizada);
    setInputCaricatura("");
    await sincronizarConBackend(regalosList, actualizada, enlacesList, inputDescripcion);
  }

  async function agregarEnlace(e) {
    e.preventDefault();
    if (!inputEnlace.trim()) return;
    
    // Validación rápida de URL
    if (!inputEnlace.startsWith("http://") && !inputEnlace.startsWith("https://")) {
      alert("Por favor, introduce un enlace válido que inicie con http:// o https://");
      return;
    }

    const actualizada = [...enlacesList, inputEnlace.trim()];
    setEnlacesList(actualizada);
    setInputEnlace("");
    await sincronizarConBackend(regalosList, caricaturasList, actualizada, inputDescripcion);
  }

  async function actualizarCamposTexto(e) {
    e.preventDefault();
    await sincronizarConBackend(regalosList, caricaturasList, enlacesList, inputDescripcion);
    alert("Descripción o notas guardadas con éxito.");
  }

  async function eliminarRegaloItem(indexAEliminar) {
    const actualizada = regalosList.filter((_, index) => index !== indexAEliminar);
    setRegalosList(actualizada);
    await sincronizarConBackend(actualizada, caricaturasList, enlacesList, inputDescripcion);
  }

  async function eliminarCaricaturaItem(indexAEliminar) {
    const actualizada = caricaturasList.filter((_, index) => index !== indexAEliminar);
    setCaricaturasList(actualizada);
    await sincronizarConBackend(regalosList, actualizada, enlacesList, inputDescripcion);
  }

  async function eliminarEnlaceItem(indexAEliminar) {
    const actualizada = enlacesList.filter((_, index) => index !== indexAEliminar);
    setEnlacesList(actualizada);
    await sincronizarConBackend(regalosList, caricaturasList, actualizada, inputDescripcion);
  }

  return (
    <div className="contenido">
      <button className="boton-secundario" onClick={volver}>← Volver</button>

      <div className="titulo-seccion">
        <div>
          <h1>💝 Mi Wishlist</h1>
          <p>Añade múltiples opciones y administra tus gustos...</p>
        </div>
      </div>

      {cargandoHistorial ? (
        <p>🔄 Buscando tu lista de deseos...</p>
      ) : (
        <div className="wishlist-layout">
          <div className="wishlist-form" style={{ maxWidth: "100%", marginBottom: 0 }}>
            
            <div style={{ marginBottom: "20px" }}>
              <label>¿Qué tipo de regalo te gustaría recibir?</label>
              <div className="formulario-linea-input">
                <input placeholder="Ej. Ropa, libros, tazas..." value={inputRegalo} onChange={(e) => setInputRegalo(e.target.value)} disabled={!eventoId || guardando} />
                <button type="button" className="boton-agregar-inline" onClick={agregarRegalo} disabled={guardando}>+ Añadir</button>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label>Caricaturas, personajes o series favoritas</label>
              <div className="formulario-linea-input">
                <input placeholder="Ej. Spider-Man, Harry Potter..." value={inputCaricatura} onChange={(e) => setInputCaricatura(e.target.value)} disabled={!eventoId || guardando} />
                <button type="button" className="boton-agregar-inline" onClick={agregarCaricatura} disabled={guardando}>+ Añadir</button>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label>Links de productos específicos (puedes agregar varios)</label>
              <div className="formulario-linea-input">
                <input type="url" placeholder="https://tienda.com..." value={inputEnlace} onChange={(e) => setInputEnlace(e.target.value)} disabled={!eventoId || guardando} />
                <button type="button" className="boton-agregar-inline" onClick={agregarEnlace} disabled={guardando}>+ Añadir</button>
              </div>
            </div>

            <form onSubmit={actualizarCamposTexto}>
              <label>Descripción o notas adicionales</label>
              <textarea placeholder="Cuéntale detalles sobre tallas o preferencias a tu amigo secreto..." value={inputDescripcion} onChange={(e) => setInputDescripcion(e.target.value)} disabled={!eventoId} />
              <button type="submit" disabled={!eventoId || guardando}>{guardando ? "Guardando..." : "Guardar Notas"}</button>
            </form>
          </div>

          <div className="preview-block">
            <h2 style={{ fontSize: "1.15rem", marginBottom: "20px", color: "#655345" }}>📋 Resumen de mis Gustos</h2>

            <div className="preview-subbloque" style={{ paddingRight: "15px" }}>
              <h4>🎁 Ideas de Regalos sugeridos:</h4>
              {regalosList.length === 0 ? <p style={{ fontStyle: "italic", color: "#a39382", fontSize: "13px" }}>No has agregado opciones.</p> : (
                <div className="sublista-items">
                  {regalosList.map((item, index) => (
                    <div className="item-badge" key={index}><span>• {item}</span><button className="boton-eliminar-badge" onClick={() => eliminarRegaloItem(index)}>Borrar ✖</button></div>
                  ))}
                </div>
              )}
            </div>

            <div className="preview-subbloque" style={{ paddingRight: "15px" }}>
              <h4>🎬 Series, Caricaturas o Cómics:</h4>
              {caricaturasList.length === 0 ? <p style={{ fontStyle: "italic", color: "#a39382", fontSize: "13px" }}>No has agregado personajes.</p> : (
                <div className="sublista-items">
                  {caricaturasList.map((item, index) => (
                    <div className="item-badge" key={index}><span>⭐ {item}</span><button className="boton-eliminar-badge" onClick={() => eliminarCaricaturaItem(index)}>Borrar ✖</button></div>
                  ))}
                </div>
              )}
            </div>

            <div className="preview-subbloque" style={{ paddingRight: "15px" }}>
              <h4>🔗 Links de interés agregados:</h4>
              {enlacesList.length === 0 ? <p style={{ fontStyle: "italic", color: "#a39382", fontSize: "13px" }}>No has agregado enlaces.</p> : (
                <div className="sublista-items">
                  {enlacesList.map((link, index) => (
                    <div className="item-badge" key={index}>
                      <a href={link} target="_blank" rel="noopener noreferrer" className="preview-enlace" style={{maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", display: "inline-block", whiteSpace: "nowrap"}}>Ver link #{index + 1} ↗</a>
                      <button className="boton-eliminar-badge" onClick={() => eliminarEnlaceItem(index)}>Borrar ✖</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {inputDescripcion ? (
              <div className="preview-subbloque">
                <h4>📝 Comentarios adicionales:</h4>
                <p style={{ whiteSpace: "pre-line" }}>{inputDescripcion}</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default Wishlist;