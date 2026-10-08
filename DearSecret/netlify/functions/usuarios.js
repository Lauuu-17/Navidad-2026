import supabase from "./supabase.js";

export default async (request, context) => {
  const metodo = request.method;

  if (metodo === "GET") {
    const { data, error } = await supabase
      .from("usuarios")
      .select(`
        id,
        nombre,
        username,
        rol,
        participaciones (
          evento_id,
          estado
        )
      `)
      .order("creado_en", { ascending: false });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const resultado = data.map((usuario) => ({
      id: usuario.id,
      nombre: usuario.nombre,
      usuario: usuario.username,
      rol: usuario.rol,
      eventos: usuario.participaciones.map((p) => ({
        eventoId: p.evento_id,
        estado: p.estado
      }))
    }));

    return new Response(
      JSON.stringify(resultado),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  if (metodo === "POST") {
    try {
      const datos = await request.json();

      if (!datos.nombre || !datos.usuario) {
        return new Response(
          JSON.stringify({
            error: "El nombre y el usuario son obligatorios."
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }

      const { data: existente, error: errorBusqueda } =
        await supabase
          .from("usuarios")
          .select("id")
          .eq("username", datos.usuario)
          .maybeSingle();

      if (errorBusqueda) {
        return new Response(
          JSON.stringify({ error: errorBusqueda.message }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }

      if (existente) {
        return new Response(
          JSON.stringify({
            error: "Ese nombre de usuario ya existe."
          }),
          {
            status: 409,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }

      const { data: nuevoUsuario, error: errorUsuario } =
        await supabase
          .from("usuarios")
          .insert([
            {
              nombre: datos.nombre,
              username: datos.usuario,
              rol: "participante"
            }
          ])
          .select()
          .single();

      if (errorUsuario) {
        return new Response(
          JSON.stringify({ error: errorUsuario.message }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }

      if (datos.eventoId) {
        const { error: errorParticipacion } = await supabase
          .from("participaciones")
          .insert([
            {
              usuario_id: nuevoUsuario.id,
              evento_id: datos.eventoId,
              estado: "activo"
            }
          ]);

        if (errorParticipacion) {
          await supabase
            .from("usuarios")
            .delete()
            .eq("id", nuevoUsuario.id);

          return new Response(
            JSON.stringify({
              error: errorParticipacion.message
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json"
              }
            }
          );
        }
      }

      return new Response(
        JSON.stringify({
          id: nuevoUsuario.id,
          nombre: nuevoUsuario.nombre,
          usuario: nuevoUsuario.username,
          rol: nuevoUsuario.rol,
          eventoId: datos.eventoId || null
        }),
        {
          status: 201,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "No se pudo procesar la solicitud."
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
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