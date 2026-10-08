let usuarios = [
  {
    id: 1,
    nombre: "Fernando",
    usuario: "fernando",
    eventoId: 1
  },
  {
    id: 2,
    nombre: "Laura",
    usuario: "laura",
    eventoId: 1
  },
  {
    id: 3,
    nombre: "Erica",
    usuario: "erica",
    eventoId: 1
  }
];

export default async (request, context) => {
  const metodo = request.method;

  if (metodo === "GET") {
    return new Response(
      JSON.stringify(usuarios),
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

    const nuevoUsuario = {
      id: Date.now(),
      nombre: datos.nombre,
      usuario: datos.usuario,
      eventoId: datos.eventoId || null
    };

    usuarios.push(nuevoUsuario);

    return new Response(
      JSON.stringify(nuevoUsuario),
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