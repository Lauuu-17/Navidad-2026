import supabase from "./supabase.js";
import { verificarAdministrador } from "./authHelper.js";

export default async (request, context) => {
  const acceso = await verificarAdministrador(request);

  if (acceso.error) {
    return acceso.error;
  }

  if (request.method !== "GET" && request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método no permitido." }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  const metodo = request.method;

  if (metodo === "GET") {
    const { data, error } = await supabase
      .from("sorteos")
      .select("*")
      .order("creado_en", { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (metodo === "POST") {
    try {
      const datos = await request.json();

      if (!datos.eventoId) {
        return new Response(
          JSON.stringify({ error: "Debes indicar el evento." }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      const { data: evento, error: errorEvento } = await supabase
        .from("eventos")
        .select("id")
        .eq("id", datos.eventoId)
        .maybeSingle();

      if (errorEvento) {
        return new Response(JSON.stringify({ error: errorEvento.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (!evento) {
        return new Response(
          JSON.stringify({ error: "El evento no existe." }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      const { count, error: errorConteo } = await supabase
        .from("participaciones")
        .select("id", { count: "exact", head: true })
        .eq("evento_id", datos.eventoId)
        .eq("estado", "activo");

      if (errorConteo) {
        return new Response(JSON.stringify({ error: errorConteo.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (count < 2) {
        return new Response(
          JSON.stringify({
            error: "Se necesitan al menos dos participantes activos."
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      const { data, error } = await supabase
        .from("sorteos")
        .insert([{
          evento_id: datos.eventoId,
          estado: "pendiente"
        }])
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "No se pudo crear el sorteo." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }

  return new Response(
    JSON.stringify({ mensaje: "Método no permitido" }),
    {
      status: 405,
      headers: { "Content-Type": "application/json" }
    }
  );
};