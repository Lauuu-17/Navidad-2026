import supabase from "./supabase.js";
import { verificarAdministrador } from "./authHelper.js";
export default async (request, context) => {
  const metodo = request.method;

  if (metodo === "GET") {
    const url = new URL(request.url);
    const sorteoId = url.searchParams.get("sorteoId");

    let consulta = supabase
      .from("asignaciones")
      .select("*");

    if (sorteoId) {
      consulta = consulta.eq("sorteo_id", sorteoId);
    }

    const { data, error } = await consulta;

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
        !datos.sorteoId ||
        !datos.participanteId ||
        !datos.destinatarioId
      ) {
        return new Response(
          JSON.stringify({
            error: "Faltan datos para crear la asignación."
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      if (datos.participanteId === datos.destinatarioId) {
        return new Response(
          JSON.stringify({
            error: "Un participante no puede regalarse a sí mismo."
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      const { data: sorteo, error: errorSorteo } = await supabase
        .from("sorteos")
        .select("id, evento_id, estado")
        .eq("id", datos.sorteoId)
        .maybeSingle();

      if (errorSorteo) {
        return new Response(JSON.stringify({ error: errorSorteo.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (!sorteo) {
        return new Response(
          JSON.stringify({ error: "El sorteo no existe." }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      if (sorteo.estado === "publicado" || sorteo.estado === "cancelado") {
        return new Response(
          JSON.stringify({
            error: "No se pueden modificar las asignaciones de este sorteo."
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      const { data: participantes, error: errorParticipantes } =
        await supabase
          .from("participaciones")
          .select("usuario_id")
          .eq("evento_id", sorteo.evento_id)
          .in("usuario_id", [
            datos.participanteId,
            datos.destinatarioId
          ]);

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
            error: "Ambas personas deben estar inscritas en el evento."
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      const { data, error } = await supabase
        .from("asignaciones")
        .insert([{
          sorteo_id: datos.sorteoId,
          participante_id: datos.participanteId,
          destinatario_id: datos.destinatarioId
        }])
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "No se pudo guardar la asignación." }),
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