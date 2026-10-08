let wishlists = [];

export default async (request, context) => {
  const metodo = request.method;

  if (metodo === "GET") {
    return new Response(
      JSON.stringify(wishlists),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  if (metodo === "POST") {
    const datos = await request.json();

    const nuevaWishlist = {
      id: Date.now(),
      usuarioId: datos.usuarioId,
      eventoId: datos.eventoId,
      regalo: datos.regalo,
      color: datos.color,
      caricatura: datos.caricatura,
      enlace: datos.enlace,
      imagen: datos.imagen,
      descripcion: datos.descripcion
    };

    wishlists.push(nuevaWishlist);

    return new Response(
      JSON.stringify(nuevaWishlist),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  return new Response(
    JSON.stringify({
      mensaje: "Método no permitido"
    }),
    {
      status: 405,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
};