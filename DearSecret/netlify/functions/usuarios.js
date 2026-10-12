import supabase from "./supabase.js";
import { verificarAdministrador } from "./authHelper.js";

export default async (request, context) => {
  const acceso = await verificarAdministrador(request);

  if (acceso.error) {
    return acceso.error;
  }
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
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
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

    return new Response(JSON.stringify(resultado), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (metodo === "POST") {
    try {
      const datos = await request.json();
      const usuarioNombre = datos.nombre;
      const usuarioLogin = datos.usuario || datos.username; // Tolerante a ambos nombres

      if (!usuarioNombre || !usuarioLogin) {
        return new Response(JSON.stringify({ error: "El nombre y el usuario son obligatorios." }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const { data: existente, error: errorBusqueda } = await supabase
        .from("usuarios")
        .select("id")
        .eq("username", usuarioLogin)
        .maybeSingle();

      if (errorBusqueda) {
        return new Response(JSON.stringify({ error: errorBusqueda.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (existente) {
        return new Response(JSON.stringify({ error: "Ese nombre de usuario ya existe." }), {
          status: 409,
          headers: { "Content-Type": "application/json" }
        });
      }

      const { data: nuevoUsuario, error: errorUsuario } = await supabase
        .from("usuarios")
        .insert([{ nombre: usuarioNombre, username: usuarioLogin, rol: "participante" }])
        .select()
        .single();

      if (errorUsuario) {
        return new Response(JSON.stringify({ error: errorUsuario.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      const destinoEventoId = datos.eventoId || datos.evento_id;
      if (destinoEventoId) {
        const { error: errorParticipacion } = await supabase
          .from("participaciones")
          .insert([{ usuario_id: nuevoUsuario.id, evento_id: destinoEventoId, estado: "activo" }]);

        if (errorParticipacion) {
          await supabase.from("usuarios").delete().eq("id", nuevoUsuario.id);
          return new Response(JSON.stringify({ error: errorParticipacion.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
      }

      return new Response(
        JSON.stringify({
          id: nuevoUsuario.id,
          nombre: nuevoUsuario.nombre,
          usuario: nuevoUsuario.username,
          rol: nuevoUsuario.rol,
          eventoId: destinoEventoId || null
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      return new Response(JSON.stringify({ error: "No se pudo procesar la solicitud." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  if (metodo === "PUT") {
    try {
      const datos = await request.json();
      const usuarioId = datos.id;
      const destinoEventoId = datos.eventoId || datos.evento_id;

      if (!usuarioId) {
        return new Response(JSON.stringify({ error: "El ID del usuario es requerido para actualizar." }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      await supabase
        .from("participaciones")
        .delete()
        .eq("usuario_id", usuarioId);

      if (destinoEventoId) {
        const { error: errorInsertParticipacion } = await supabase
          .from("participaciones")
          .insert([{ usuario_id: usuarioId, evento_id: destinoEventoId, estado: "activo" }]);

        if (errorInsertParticipacion) {
          return new Response(JSON.stringify({ error: errorInsertParticipacion.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
      }

      return new Response(
        JSON.stringify({ mensaje: "Asignación de evento actualizada con éxito.", eventoId: destinoEventoId || null }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      return new Response(JSON.stringify({ error: "Error interno al procesar la actualización." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  return new Response(JSON.stringify({ mensaje: "Método no permitido" }), {
    status: 405,
    headers: { "Content-Type": "application/json" }
  });
};
