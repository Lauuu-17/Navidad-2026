import { useEffect, useState } from "react";
import { obtenerDatos, enviarDatos } from "../services/api";

function Wishlist({ usuarioId, eventoId, volver }) {
  const [wishlist, setWishlist] = useState({
    regalo: "",
    color: "",
    caricatura: "",
    enlace: "",
    imagen: "",
    descripcion: ""
  });
  const [guardando, setGuardando] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  useEffect(() => {
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
            color: datos.color || "",
            caricatura: datos.caricatura || "",
            enlace: datos.enlace || "",
            imagen: datos.imagen || "",
            descripcion: datos.descripcion || ""
          });
        }
      } catch (error) {
        console.log("Sin registro previo en la base de datos:", error.message);
      } finally {
        setCargandoHistorial(false);
      }
    }

    cargarWishlistExistente();
  }, [eventoId]);

  function cambiarDato(e) {
    setWishlist({
      ...wishlist,
      [e.target.name]: e.target.value
    });
  }

  async function guardarWishlist(e) {
    e.preventDefault();

    if (!eventoId) {
      alert("No puedes modificar tu lista de deseos porque no estás vinculado a ningún evento activo.");
      return;
    }

    try {
      setGuardando(true);

      await enviarDatos("wishlist", {
        eventoId: eventoId,
        regalo: wishlist.regalo,
        color: wishlist.color,
        caricatura: wishlist.caricatura,
        enlace: wishlist.enlace,
        imagen: wishlist.imagen,
        descripcion: wishlist.descripcion
      });

      alert("Lista de deseos guardada correctamente.");
    } catch (error) {
      alert("No se pudo guardar la lista: " + error.message);
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

      <div className="wishlist-form">
        {cargandoHistorial ? (
          <p>🔄 Buscando tu lista de deseos...</p>
        ) : (
          <form onSubmit={guardarWishlist}>
            <label>¿Qué tipo de regalo te gustaría recibir?</label>
            <input
              name="regalo"
              placeholder="Ej. ropa, libros..."
              value={wishlist.regalo}
              onChange={cambiarDato}
              disabled={!eventoId}
            />

            <label>Color favorito</label>
            <input
              name="color"
              placeholder="Ej. verde"
              value={wishlist.color}
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

            <label>Link de una imagen</label>
            <input
              name="imagen"
              type="url"
              placeholder="https://..."
              value={wishlist.imagen}
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
        )}
      </div>
    </div>
  );
}

export default Wishlist;
