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

  if (request.method === "GET") {
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
      return responder({
        error: "No se pudieron consultar las asignaciones."
      }, 500);
    }

    return responder(data);
  }

  if (request.method === "POST") {
    let cuerpo;

    try {
      cuerpo = await request.json();
    } catch {
      return responder({
        error: "El cuerpo JSON no es válido."
      }, 400);
    }

    const { sorteoId, participanteId, destinatarioId } = cuerpo;

    if (!sorteoId || !participanteId || !destinatarioId) {
      return responder({
        error: "Debes indicar el sorteo, el participante y el destinatario."
      }, 400);
    }

    if (participanteId === destinatarioId) {
      return responder({
        error: "Una persona no puede ser su propio amigo secreto."
      }, 400);
    }

    const { data: sorteo, error: errorSorteo } = await supabase
      .from("sorteos")
      .select("id, evento_id, estado")
      .eq("id", sorteoId)
      .maybeSingle();

    if (errorSorteo) {
      return responder({
        error: "No se pudo comprobar el sorteo."
      }, 500);
    }

    if (!sorteo) {
      return responder({
        error: "El sorteo no existe."
      }, 404);
    }

    if (sorteo.estado === "publicado" || sorteo.estado === "cancelado") {
      return responder({
        error: "No puedes modificar las asignaciones de este sorteo."
      }, 409);
    }

    const { data: participantes, error: errorParticipantes } = await supabase
      .from("participaciones")
      .select("usuario_id, estado")
      .eq("evento_id", sorteo.evento_id)
      .in("usuario_id", [participanteId, destinatarioId]);

    if (errorParticipantes) {
      return responder({
        error: "No se pudieron comprobar los participantes."
      }, 500);
    }

    const participanteValido = participantes?.some(
      p => p.usuario_id === participanteId && p.estado === "activo"
    );

    const destinatarioValido = sizeof = participantes?.some(
      p => p.usuario_id === destinatarioId && p.estado === "activo"
    );

    if (!participanteValido || !destinatarioValido) {
      return responder({
        error: "Ambas personas deben tener una participación activa en el evento."
      }, 400);
    }

    const { data, error } = await supabase
      .from("asignaciones")
      .insert({
        sorteo_id: sorteoId,
        participante_id: participanteId,
        destinatario_id: destinatarioId
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return responder({
          error: "El participante ya tiene una asignación o el destinatario ya fue asignado en este sorteo."
        }, 409);
      }

      return responder({
        error: "No se pudo guardar la asignación: " + error.message
      }, 500);
    }

    return responder({
      mensaje: "Asignación guardada correctamente.",
      asignacion: data
    }, 201);
  }

  return responder({
    error: "Método no permitido."
  }, 405);
};
