let eventos = [
  {
    id: 1,
    nombre: "Intercambio de Navidad 2026",
    descripcion: "Intercambio de regalos entre amigos.",
    fecha: "2026-12-24",
    minimo: 30,
    maximo: 60,
    estado: "Preparación"
  }
];

export default async (request, context) => {
  const metodo = request.method;

  if (metodo === "GET") {
    return new Response(
      JSON.stringify(eventos),
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

    const nuevoEvento = {
      id: Date.now(),
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      fecha: datos.fecha,
      minimo: datos.minimo,
      maximo: datos.maximo,
      estado: "Preparación"
    };

    eventos.push(nuevoEvento);

    return new Response(
      JSON.stringify(nuevoEvento),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  return new Response(
    JSON.stringify({ mensaje: "Método no permitido" }),
    {
      status: 405,
      headers: { "Content-Type": "application/json" }
    }
  );
};
