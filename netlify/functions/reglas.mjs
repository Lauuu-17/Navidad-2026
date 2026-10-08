let reglas = [];

export default async (request, context) => {
  const metodo = request.method;

  if (metodo === "GET") {
    return new Response(
      JSON.stringify(reglas),
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

    const nuevaRegla = {
      id: Date.now(),
      eventoId: datos.eventoId,
      tipo: datos.tipo,
      origenId: datos.origenId,
      destinoId: datos.destinoId
    };

    reglas.push(nuevaRegla);

    return new Response(
      JSON.stringify(nuevaRegla),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  if (metodo === "DELETE") {
    const datos = await request.json();

    reglas = reglas.filter(
      (regla) => regla.id !== Number(datos.id)
    );

    return new Response(
      JSON.stringify({
        mensaje: "Regla eliminada"
      }),
      {
        status: 200,
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