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

    // Si solo es para inicializar el registro sin mezclar
    if (!ejecutarEmparejamiento) {
      if (existente) return responder(existente, 200); 

      const { data, error } = await supabase
        .from("sorteos")
        .insert({ evento_id: eventoId, estado: "pendiente" })
        .select().single();

      if (error) return responder({ error: "No se pudo crear el sorteo base." }, 500);
      return responder(data, 201);
    }

    // --- ALGORITMO INTEGRADO DE ASIGNACIÓN AUTOMÁTICA EN BACKEND ---
    let sorteoId = existente?.id;
    if (!sorteoId) {
      const { data: nuevoSorteo } = await supabase
        .from("sorteos")
        .insert({ evento_id: eventoId, estado: "pendiente" })
        .select().single();
      sorteoId = nuevoSorteo.id;
    } else {
      // Limpiamos emparejamientos anteriores del sorteo para sobreescribir de forma limpia
      await supabase.from("asignaciones").delete().eq("sorteo_id", sorteoId);
    }

    // 1. Obtener participantes activos asociados al evento
    const { data: participaciones, error: errorParts } = await supabase
      .from("participaciones")
      .select("usuario_id")
      .eq("evento_id", eventoId)
      .eq("estado", "activo");

    if (errorParts || !participaciones || participaciones.length < 2) {
      return responder({ error: "Se necesitan al menos 2 participantes activos para realizar la distribución." }, 400);
    }

    const listaIds = participaciones.map(p => p.usuario_id);

    // 2. Obtener las reglas de restricción personalizadas de la DB
    const { data: reglasDB } = await supabase
      .from("reglas")
      .select("tipo, origen_id, destino_id")
      .eq("evento_id", eventoId);

    const reglas = reglasDB || [];

    // 3. Motor Backtracking con límite para resolver combinaciones válidas
    let asignacionFinal = null;
    let intentosMaximos = 300;

    while (intentosMaximos > 0 && !asignacionFinal) {
      intentosMaximos--;
      
      // Barajado aleatorio eficiente (Fisher-Yates) para simular la aleatoriedad del sorteo
      let candidatos = [...listaIds];
      for (let i = candidatos.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidatos[i], candidatos[j]] = [candidatos[j], candidatos[i]];
      }

      let asignacionTemporal = new Map();
      let valido = true;

      // Validación secuencial de emparejamientos uno a uno
      for (let i = 0; i < listaIds.length; i++) {
        const emisor = listaIds[i];
        const receptor = candidatos[i];

        // Regla básica número 1: Nadie puede regalarse a sí mismo
        if (emisor === receptor) {
          valido = false;
          break;
        }

        // Evaluar restricciones dinámicas de las tablas
        for (const r of reglas) {
          if (r.tipo === "manual" && r.origen_id === emisor && r.destino_id !== receptor) {
            valido = false; break;
          }
          if (r.tipo === "direccional" && r.origen_id === emisor && r.destino_id === receptor) {
            valido = false; break;
          }
          if (r.tipo === "mutua") {
            if (r.origen_id === emisor && r.destino_id === receptor) { valido = false; break; }
            if (r.destino_id === emisor && r.origen_id === receptor) { valido = false; break; }
          }
        }

        if (!valido) break;
        asignacionTemporal.set(emisor, receptor);
      }

      if (valido) {
        asignacionFinal = asignacionTemporal;
      }
    }

    if (!asignacionFinal) {
      return responder({ 
        error: "Las reglas restrictivas configuradas hacen matemáticamente imposible un emparejamiento válido entre los participantes actuales." 
      }, 422);
    }

    // 4. Preparar las filas estructuradas para cargarse en masa (Bulk Insert)
    const filasAsignacion = [];
    for (let [emisor, receptor] of asignacionFinal.entries()) {
      filasAsignacion.push({
        sorteo_id: sorteoId,
        participante_id: emisor,
        destinatario_id: receptor
      });
    }

    const { error: errorIns } = await supabase
      .from("asignaciones")
      .insert(filasAsignacion);

    if (errorIns) {
      return responder({ error: "Fallo crítico al insertar las asignaciones generadas en Supabase: " + errorIns.message }, 500);
    }
    
    // 5. Publicar oficialmente el sorteo de forma definitiva
    await supabase
      .from("sorteos")
      .update({ estado: "publicado", publicado_en: new Date().toISOString() })
      .eq("id", sorteoId);

    return responder({ mensaje: "Sorteo generado por backend y guardado exitosamente.", estado: "Publicado" });
  }


  return responder({ error: "Método no permitido." }, 405);
};
