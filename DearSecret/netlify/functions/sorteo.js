import supabase from "./supabase.js";
import { verificarAdministrador } from "./authHelper.js";

function responder(datos, estado = 200) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

export default async (request, context) => {
  const acceso = await verificarAdministrador(request);

  if (acceso.error) {
    return acceso.error;
  }

  if (request.method !== "GET" && request.method !== "POST") {
    return responder({ error: "Método no permitido." }, 405);
  }

  if (request.method === "GET") {
    const { data, error } = await supabase
      .from("sorteos")
      .select("*")
      .order("creado_en", { ascending: false });

    if (error) {
      return responder({ error: "No se pudieron consultar los sorteos." }, 500);
    }

    return responder(data);
  }
  if (request.method === "POST") {
    let cuerpo;

    try {
      cuerpo = await request.json();
    } catch {
      return responder({ error: "El cuerpo JSON no es válido." }, 400);
    }

    const eventoId = cuerpo.eventoId;

    if (!eventoId) {
      return responder({ error: "Debes indicar el evento." }, 400);
    }

    const { data: evento, error: errorEvento } = await supabase
      .from("eventos")
      .select("id")
      .eq("id", eventoId)
      .maybeSingle();

    if (errorEvento) {
      return responder({ error: "No se pudo comprobar el evento." }, 500);
    }

    if (!evento) {
      return responder({ error: "El evento indicado no existe." }, 404);
    }

    const { data: existente, error: errorExistente } = await supabase
      .from("sorteos")
      .select("id, estado")
      .eq("evento_id", eventoId)
      .in("estado", ["pendiente", "generado", "revision", "publicado"])
      .limit(1);

    if (errorExistente) {
      return responder({ error: "No se pudo comprobar si ya existe un sorteo." }, 500);
    }

    if (existente && existente.length > 0) {
      return responder({
        error: "Este evento ya tiene un sorteo activo o publicado.",
        sorteo: existente[0]
      }, 409);
    }

    const { count, error: errorConteo } = await supabase
      .from("participaciones")
      .select("id", { count: "exact", head: true })
      .eq("evento_id", eventoId)
      .eq("estado", "activo");

    if (errorConteo) {
      return responder({ error: "No se pudo validar el conteo de participantes: " + errorConteo.message }, 500);
    }

    if (count === null || count < 2) {
      return responder({
        error: "Se necesitan al menos dos participantes activos registrados en este evento dentro de la base de datos."
      }, 400);
    }

    const { data, error } = await supabase
      .from("sorteos")
      .insert({
        evento_id: eventoId,
        estado: "pendiente"
      })
      .select()
      .single();

    if (error) {
      return responder({ error: "No se pudo crear el sorteo en el servidor." }, 500);
    }

    return responder(data, 201);
  }

  return responder({ error: "Método no permitido." }, 405);
};
