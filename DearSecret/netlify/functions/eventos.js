import supabase from "./supabase.js";
import { verificarSesion,verificarAdministrador} from "./authHelper.js";

export default async (request, context) => {
  const metodo = request.method;
  if (request.method === "GET") {
    const acceso = await verificarSesion(request);

    if (acceso.error) {
      return acceso.error;
    }
  } else if (request.method === "POST") {
    const acceso = await verificarAdministrador(request);

    if (acceso.error) {
      return acceso.error;
    }
  } else {
    return new Response(
      JSON.stringify({ error: "Método no permitido." }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  if (metodo === "GET") {
    const { data, error } = await supabase
      .from("eventos")
      .select("*")
      .order("creado_en", { ascending: false });

    if (error) {
      return new Response(
        JSON.stringify({
          error: error.message
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  if (metodo === "POST" || metodo === "PUT") {
    const datos = await request.json();

    const datosEvento = {
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      fecha: datos.fecha,
      presupuesto_min: datos.minimo,
      presupuesto_max: datos.maximo,
      estado: datos.estado || "Preparación"
    };

    if (datos.id) {
      datosEvento.id = datos.id;
    }

    const { data, error } = await supabase
      .from("eventos")
      .upsert(datosEvento, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify(data), {
      status: datos.id ? 200 : 201,
      headers: { "Content-Type": "application/json" }
    });
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