import { useEffect, useState } from "react";
import { obtenerDatos, enviarDatos } from "../services/api";

function Wishlist({ usuarioId, eventoId, volver }) {
  const [wishlist, setWishlist] = useState({
    regalo: "",
    caricatura: "",
    enlace: "",
    descripcion: ""
  });
  const [guardando, setGuardando] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  // Cargar datos al montar el componente
  async function cargarWishlistExistente() {
    if (!eventoId) return;

    try {
      setCargandoHistorial(true);
      const datos = await obtenerDatos(
        `wishlist?eventoId=${encodeURIComponent(eventoId)}`
      );

      if (datos) {
        setWishlist({
          regalo: datos.regalo || "",
          caricatura: datos.caricatura || "",
          enlace: datos.enlace || "",
          descripcion: datos.descripcion || ""
        });
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

  function cambiarDato(e) {
    setWishlist({
      ...wishlist,
      [e.target.name]: e.target.value
    });
  }

  // Guardar la Wishlist completa
  async function guardarWishlist(e) {
    if (e) e.preventDefault();

    if (!eventoId) {
      alert("No puedes modificar tu lista de deseos porque no estás vinculado a ningún evento activo.");
      return;
    }

    try {
      setGuardando(true);
      await enviarDatos("wishlist", {
        eventoId: eventoId,
        regalo: wishlist.regalo,
        caricatura: wishlist.caricatura,
        enlace: wishlist.enlace,
        descripcion: wishlist.descripcion
      });
      alert("Lista de deseos guardada correctamente.");
    } catch (error) {
      alert("No se pudo guardar la lista: " + error.message);
    } finally {
      setGuardando(false);
    }
  }

  // Función estrella: Borrar un ítem individualmente en el servidor
  async function borrarItemIndividual(campo) {
    const confirmacion = window.confirm(`¿Estás seguro de que deseas limpiar este campo?`);
    if (!confirmacion) return;

    try {
      setGuardando(true);
      
      // 1. Clonamos el estado actual y vaciamos el campo seleccionado
      const wishlistActualizada = {
        ...wishlist,
        [campo]: ""
      };

      // 2. Persistimos el cambio de inmediato en Supabase enviando la cadena limpia
      await enviarDatos("wishlist", {
        eventoId: eventoId,
        regalo: wishlistActualizada.regalo,
        caricatura: wishlistActualizada.caricatura,
        enlace: wishlistActualizada.enlace,
        descripcion: wishlistActualizada.descripcion
      });

      // 3. Sincronizamos la UI local
      setWishlist(wishlistActualizada);
      alert("Campo removido con éxito.");
    } catch (error) {
      alert("No se pudo eliminar el ítem: " + error.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="contenido">
      <button className="boton-secundario" onClick={volver}>
        ← Volver
      </button>

      <div className="titulo-seccion">
        <div>
          <h1>💝 Mi Wishlist</h1>
          <p>Cuéntale a tu amigo secreto qué cosas te gustan.</p>
        </div>
      </div>

      {cargandoHistorial ? (
        <p>🔄 Buscando tu lista de deseos...</p>
      ) : (
        <div className="wishlist-layout">
          
          {/* COLUMNA IZQUIERDA: FORMULARIO */}
          <div className="wishlist-form" style={{ maxWidth: "100%", marginBottom: 0 }}>
            <form onSubmit={guardarWishlist}>
              <label>¿Qué tipo de regalo te gustaría recibir?</label>
              <input
                name="regalo"
                placeholder="Ej. ropa, libros..."
                value={wishlist.regalo}
                onChange={cambiarDato}
                disabled={!eventoId}
              />

              <label>Caricatura, personaje o serie favorita</label>
              <input
                name="caricatura"
                placeholder="Ej. Spider-Man"
                value={wishlist.caricatura}
                onChange={cambiarDato}
                disabled={!eventoId}
              />

              <label>Link de algún producto</label>
              <input
                name="enlace"
                type="url"
                placeholder="https://..."
                value={wishlist.enlace}
                onChange={cambiarDato}
                disabled={!eventoId}
              />

              <label>Descripción</label>
              <textarea
                name="descripcion"
                placeholder="Cuéntale algo más a tu amigo secreto..."
                value={wishlist.descripcion}
                onChange={cambiarDato}
                disabled={!eventoId}
              />

              <button type="submit" disabled={!eventoId || guardando}>
                {!eventoId 
                  ? "Modo Lectura (Sin evento activo)" 
                  : guardando 
                    ? "Guardando..." 
                    : "Guardar wishlist"}
              </button>
            </form>
          </div>

          {/* COLUMNA DERECHA: REGISTROS ACTUALES (SUBBLOQUES) */}
          <div className="preview-block">
            <h2 style={{ fontSize: "1.15rem", marginBottom: "20px", color: "#655345" }}>
              📋 Resumen Guardado
            </h2>

            {/* Subbloque: Tipo de Regalo */}
            {wishlist.regalo ? (
              <div className="preview-subbloque">
                <h4>Tipo de regalo:</h4>
                <p>{wishlist.regalo}</p>
                <button 
                  className="boton-borrar-item" 
                  title="Borrar este ítem"
                  onClick={() => borrarItemIndividual("regalo")}
                >
                  🗑️
                </button>
              </div>
            ) : null}

            {/* Subbloque: Caricatura */}
            {wishlist.caricatura ? (
              <div className="preview-subbloque">
                <h4>Caricatura o Personaje:</h4>
                <p>{wishlist.caricatura}</p>
                <button 
                  className="boton-borrar-item" 
                  title="Borrar este ítem"
                  onClick={() => borrarItemIndividual("caricatura")}
                >
                  🗑️
                </button>
              </div>
            ) : null}

            {/* Subbloque: Enlace */}
            {wishlist.enlace ? (
              <div className="preview-subbloque">
                <h4>Link de producto:</h4>
                <p>
                  <a href={wishlist.enlace} target="_blank" rel="noopener noreferrer" className="preview-enlace">
                    Ver producto sugerido ↗
                  </a>
                </p>
                <button 
                  className="boton-borrar-item" 
                  title="Borrar este ítem"
                  onClick={() => borrarItemIndividual("enlace")}
                >
                  🗑️
                </button>
              </div>
            ) : null}

            {/* Subbloque: Descripción */}
            {wishlist.descripcion ? (
              <div className="preview-subbloque">
                <h4>Descripción adicional:</h4>
                <p>{wishlist.descripcion}</p>
                <button 
                  className="boton-borrar-item" 
                  title="Borrar este ítem"
                  onClick={() => borrarItemIndividual("descripcion")}
                >
                  🗑️
                </button>
              </div>
            ) : null}

            {/* Estado vacío por si el usuario no tiene nada escrito */}
            {!wishlist.regalo && !wishlist.caricatura && !wishlist.enlace && !wishlist.descripcion && (
              <p style={{ color: "#a39382", textAlign: "center", fontStyle: "italic", padding: "20px 0" }}>
                Tu Wishlist está vacía. Completa el formulario de la izquierda para agregar tus gustos.
              </p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default Wishlist;
