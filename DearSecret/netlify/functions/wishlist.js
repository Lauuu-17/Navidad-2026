import supabase from "./supabase.js";

export default async (request, context) => {
  const metodo = request.method;

  if (metodo === "GET") {
    const { data, error } = await supabase
      .from("wishlists")
      .select("*")
      .order("actualizado_en", { ascending: false });

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
      let participacionId = datos.participacionId;
      if (!participacionId && datos.usuarioId && datos.eventoId) {
        const { data: participacion, error: errorParticipacion } =
          await supabase
            .from("participaciones")
            .select("id")
            .eq("usuario_id", datos.usuarioId)
            .eq("evento_id", datos.eventoId)
            .maybeSingle();

        if (errorParticipacion) {
          return new Response(
            JSON.stringify({ error: errorParticipacion.message }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        if (!participacion) {
          return new Response(
            JSON.stringify({
              error: "El usuario no está inscrito en ese evento."
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        participacionId = participacion.id;
      }

      if (!participacionId) {
        return new Response(
          JSON.stringify({
            error: "Debes indicar la participación de la lista."
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      const { data, error } = await supabase
        .from("wishlists")
        .upsert(
          {
            participacion_id: participacionId,
            regalo: datos.regalo || "",
            color: datos.color || "",
            caricatura: datos.caricatura || "",
            enlace: datos.enlace || "",
            imagen: datos.imagen || "",
            descripcion: datos.descripcion || "",
            actualizado_en: new Date().toISOString()
          },
          { onConflict: "participacion_id" }
        )
        .select()
        .single();

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
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "No se pudo guardar la lista." }),
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