import { useState } from "react";

function Wishlist({ volver }) {

  const [wishlist, setWishlist] = useState({
    regalo: "",
    color: "",
    caricatura: "",
    enlace: "",
    imagen: "",
    descripcion: ""
  });

  function cambiarDato(e) {
    setWishlist({
      ...wishlist,
      [e.target.name]: e.target.value
    });
  }

  function guardarWishlist(e) {
    e.preventDefault();

    alert("Wishlist guardada correctamente.");
  }

  return (
    <div className="contenido">

      <button
        className="boton-secundario"
        onClick={volver}
      >
        ← Volver
      </button>

      <div className="titulo-seccion">

        <div>
          <h1>💝 Mi Wishlist</h1>

          <p>
            Cuéntale a tu amigo secreto qué cosas te gustan.
          </p>
        </div>

      </div>

      <div className="wishlist-form">

        <form onSubmit={guardarWishlist}>

          <label>
            ¿Qué tipo de regalo te gustaría recibir?
          </label>

          <input
            name="regalo"
            placeholder="Ej. ropa, libros..."
            value={wishlist.regalo}
            onChange={cambiarDato}
          />

          <label>
            Color favorito
          </label>

          <input
            name="color"
            placeholder="Ej. verde"
            value={wishlist.color}
            onChange={cambiarDato}
          />

          <label>
            Caricatura, personaje o serie favorita
          </label>

          <input
            name="caricatura"
            placeholder="Ej. Spider-Man"
            value={wishlist.caricatura}
            onChange={cambiarDato}
          />

          <label>
            Link de algún producto
          </label>

          <input
            name="enlace"
            type="url"
            placeholder="https://..."
            value={wishlist.enlace}
            onChange={cambiarDato}
          />

          <label>
            Link de una imagen
          </label>

          <input
            name="imagen"
            type="url"
            placeholder="https://..."
            value={wishlist.imagen}
            onChange={cambiarDato}
          />

          <label>
            Descripción
          </label>

          <textarea
            name="descripcion"
            placeholder="Cuéntale algo más a tu amigo secreto..."
            value={wishlist.descripcion}
            onChange={cambiarDato}
          />

          <button type="submit">
            Guardar wishlist
          </button>

        </form>

      </div>

    </div>
  );
}

export default Wishlist;