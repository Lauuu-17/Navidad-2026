import supabase from "./supabase.js";
import { verificarSesion, verificarAdministrador} from "./authHelper.js";

export default async (request, context) => {
  const metodo = request.method;

  if (metodo === "GET") {
    const { data, error } = await supabase
      .from("reglas")
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

      if (
        !datos.eventoId ||
        !datos.origenId ||
        !datos.destinoId ||
        !["mutua", "direccional", "manual"].includes(datos.tipo)
      ) {
        return new Response(
          JSON.stringify({ error: "Los datos de la regla no son válidos." }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      if (datos.origenId === datos.destinoId) {
        return new Response(
          JSON.stringify({ error: "Una persona no puede asignarse a sí misma." }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      const { data: participantes, error: errorParticipantes } =
        await supabase
          .from("participaciones")
          .select("usuario_id")
          .eq("evento_id", datos.eventoId)
          .in("usuario_id", [datos.origenId, datos.destinoId]);

      if (errorParticipantes) {
        return new Response(
          JSON.stringify({ error: errorParticipantes.message }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      if (!participantes || participantes.length !== 2) {
        return new Response(
          JSON.stringify({
            error: "Ambos usuarios deben participar en el evento seleccionado."
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      const { data, error } = await supabase
        .from("reglas")
        .insert([{
          evento_id: datos.eventoId,
          tipo: datos.tipo,
          origen_id: datos.origenId,
          destino_id: datos.destinoId
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
        JSON.stringify({ error: "No se pudo procesar la regla." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }

  if (metodo === "DELETE") {
    try {
      const datos = await request.json();

      const { error } = await supabase
        .from("reglas")
        .delete()
        .eq("id", datos.id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(
        JSON.stringify({ mensaje: "Regla eliminada." }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "No se pudo eliminar la regla." }),
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