import supabase from "./supabase.js";
import { verificarSesion, verificarAdministrador } from "./authHelper.js";

function responder(datos, estado = 200) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

export default async (request, context) => {
  const metodo = request.method;

  if (metodo === "GET") {
    const acceso = await verificarSesion(request);
    if (acceso.error) return acceso.error;
  } else if (metodo === "POST" || metodo === "DELETE") {
    const acceso = await verificarAdministrador(request);
    if (acceso.error) return acceso.error;
  } else {
    return responder({ error: "Método no permitido." }, 405);
  }


  if (metodo === "GET") {
    const { data, error } = await supabase
      .from("reglas")
      .select("*")
      .order("creado_en", { ascending: false });

    if (error) {
      return responder({ error: "No se pudieron consultar las reglas: " + error.message }, 500);
    }

    return responder(data);
  }


  if (metodo === "POST") {
    let cuerpo;
    try {
      cuerpo = await request.json();
    } catch {
      return responder({ error: "El cuerpo JSON no es válido." }, 400);
    }

    const { eventoId, tipo, origenId, destinoId } = cuerpo;

    // Validación de campos obligatorios
    if (!eventoId || !tipo || !origenId || !destinoId) {
      return responder({ error: "Debes completar todos los campos de la regla." }, 400);
    }

    if (!["mutua", "direccional", "manual"].includes(tipo)) {
      return responder({ error: "El tipo de regla no es válido." }, 400);
    }

    if (origenId === destinoId) {
      return responder({ error: "Una persona no puede tener una regla consigo misma." }, 400);
    }

    const { data: participaciones, error: errorParticipaciones } = await supabase
      .from("participaciones")
      .select("usuario_id, estado")
      .eq("evento_id", eventoId)
      .in("usuario_id", [origenId, destinoId]);

    if (errorParticipaciones) {
      return responder({ error: "No se pudieron comprobar las participaciones." }, 500);
    }

    const origenValido = participaciones?.some(p => p.usuario_id === origenId && p.estado === "activo");
    const destinoValido = participaciones?.some(p => p.usuario_id === destinoId && p.estado === "activo");

    if (!origenValido || !destinoValido) {
      return responder({ error: "Ambas personas deben participar activamente en el evento seleccionado." }, 400);
    }

    const { data, error } = await supabase
      .from("reglas")
      .insert({
        evento_id: eventoId,
        tipo,
        origen_id: origenId,
        destino_id: destinoId
      })
      .select()
      .single();

    if (error) {
      return responder({ error: "No se pudo guardar la regla: " + error.message }, 500);
    }

    return responder({ mensaje: "Regla guardada correctamente.", regla: data }, 201);
  }

  if (metodo === "DELETE") {
    let cuerpo;
    try {
      cuerpo = await request.json();
    } catch {
      return responder({ error: "El cuerpo JSON no es válido." }, 400);
    }

    if (!cuerpo.id) {
      return responder({ error: "Debes indicar el ID de la regla." }, 400);
    }

    const { data, error } = await supabase
      .from("reglas")
      .delete()
      .eq("id", cuerpo.id)
      .select()
      .maybeSingle();

    if (error) {
      return responder({ error: "No se pudo eliminar la regla: " + error.message }, 500);
    }

    if (!data) {
      return responder({ error: "No se encontró la regla indicada." }, 404);
    }

    return responder({ mensaje: "Regla eliminada correctamente." }, 200);
  }

  return responder({ error: "Método no permitido." }, 405);
};
