import supabase from "./supabase.js";
import { verificarAdministrador } from "./authHelper.js";

function responder(datos, estado = 200) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { "Content-Type": "application/json" }
  });
}

export default async (request, context) => {
  const acceso = await verificarAdministrador(request);
  if (acceso.error) return acceso.error;

  const metodo = request.method;
  
  if (metodo !== "GET" && metodo !== "POST" && metodo !== "DELETE") {
    return responder({ error: "Método no permitido." }, 405);
  }
  if (metodo === "DELETE") {
    let cuerpo;
    try { cuerpo = await request.json(); } catch { return responder({ error: "JSON no válido." }, 400); }

    const { eventoId } = cuerpo;
    if (!eventoId) return responder({ error: "Debes indicar el evento a reiniciar." }, 400);

    const { data: sorteo, error: errorBusqueda } = await supabase
      .from("sorteos")
      .select("id")
      .eq("evento_id", eventoId)
      .maybeSingle();

    if (errorBusqueda) return responder({ error: "Error al buscar el sorteo." }, 500);
    
    if (!sorteo) {
      return responder({ mensaje: "No hay ningún sorteo activo que requiera ser eliminado." }, 200);
    }

    const { error: errorAsignaciones } = await supabase
      .from("asignaciones")
      .delete()
      .eq("sorteo_id", sorteo.id);

    if (errorAsignaciones) return responder({ error: "No se pudieron limpiar las asignaciones viejas." }, 500);

    const { error: errorSorteo } = await supabase
      .from("sorteos")
      .delete()
      .eq("id", sorteo.id);

    if (errorSorteo) return responder({ error: "No se pudo eliminar el sorteo principal." }, 500);

    return responder({ mensaje: "El sorteo y sus emparejamientos fueron eliminados con éxito de Supabase." }, 200);
  }
  if (metodo === "GET") {
    const { data, error } = await supabase
      .from("sorteos")
      .select("*")
      .order("creado_en", { ascending: false });

    if (error) return responder({ error: "No se pudieron consultar los sorteos." }, 500);
    return responder(data);
  }

if (metodo === "POST") {
  let cuerpo;
  try { cuerpo = await request.json(); } catch { return responder({ error: "JSON no válido." }, 400); }

  const { eventoId, ejecutarEmparejamiento } = cuerpo;
  if (!eventoId) return responder({ error: "Debes indicar el evento." }, 400);

  const { data: existente } = await supabase
    .from("sorteos")
    .select("id, estado")
    .eq("evento_id", eventoId)
    .maybeSingle();

  if (!ejecutarEmparejamiento) {
    if (existente) return responder(existente, 200); 

    const { data, error } = await supabase
      .from("sorteos")
      .insert({ evento_id: eventoId, estado: "pendiente" })
      .select().single();

    if (error) return responder({ error: "No se pudo crear el sorteo base." }, 500);
    return responder(data, 201);
  }

  let sorteoId = existente?.id;
  if (!sorteoId) {
    const { data: nuevoSorteo } = await supabase
      .from("sorteos")
      .insert({ evento_id: eventoId, estado: "pendiente" })
      .select().single();
    sorteoId = nuevoSorteo.id;
  } else {
    await supabase.from("asignaciones").delete().eq("sorteo_id", sorteoId);
  }
  
  await supabase
    .from("sorteos")
    .update({ estado: "publicado", publicado_en: new Date().toISOString() })
    .eq("id", sorteoId);

  return responder({ mensaje: "Sorteo generado y guardado exitosamente.", estado: "Publicado" });
}

  return responder({ error: "Método no permitido." }, 405);
};
