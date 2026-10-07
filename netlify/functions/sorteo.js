let sorteos = [];

export default async (request, context) => {
  const metodo = request.method;

  if (metodo === "GET") {
    return new Response(
      JSON.stringify(sorteos),
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

    const nuevoSorteo = {
      id: Date.now(),
      eventoId: datos.eventoId,
      estado: "Pendiente de revisión",
      asignaciones: []
    };

    sorteos.push(nuevoSorteo);

    return new Response(
      JSON.stringify(nuevoSorteo),
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