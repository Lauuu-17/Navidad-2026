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

    if (!ejecutarEmparejamiento) {
      const { data: existente } = await supabase
        .from("sorteos")
        .select("id, estado")
        .eq("evento_id", eventoId)
        .in("estado", ["pendiente", "generado", "revision", "publicado"])
        .maybeSingle();

      if (existente) return responder({ error: "Este evento ya tiene un sorteo activo.", sorteo: existente }, 409);

      const { data, error } = await supabase
        .from("sorteos")
        .insert({ evento_id: eventoId, estado: "pendiente" })
        .select().single();

      if (error) return responder({ error: "No se pudo crear el sorteo base." }, 500);
      return responder(data, 201);
    }

    const { data: sorteoActivo } = await supabase
      .from("sorteos")
      .select("id, estado")
      .eq("evento_id", eventoId)
      .eq("estado", "pendiente")
      .maybeSingle();

    if (!sorteoActivo) return responder({ error: "No hay un sorteo pendiente base para este evento." }, 404);

    const { data: participantes } = await supabase
      .from("participaciones")
      .select("usuario_id")
      .eq("evento_id", eventoId)
      .eq("estado", "activo");

    if (!participantes || participantes.length < 2) {
      return responder({ error: "Se requieren mínimo 2 participantes activos en la base de datos." }, 400);
    }

    const { data: reglas } = await supabase
      .from("reglas")
      .select("tipo, origen_id, destino_id")
      .eq("evento_id", eventoId);

    const listaIds = participantes.map(p => p.usuario_id);
    let asignacionesFinales = [];
    let exito = false;
    let intentos = 0;

    while (!exito && intentos < 500) {
      intentos++;
      let disponibles = [...listaIds];
      let mapeoTemporal = [];
      let esValido = true;

      // Aplicar primero parejas manuales si existen
      if (reglas) {
        const manuales = reglas.filter(r => r.tipo === "manual");
        for (let m of manuales) {
          if (listaIds.includes(m.origen_id) && disponibles.includes(m.destino_id)) {
            mapeoTemporal.push({ participante_id: m.origen_id, destinatario_id: m.destino_id });
            disponibles = disponibles.filter(id => id !== m.destino_id);
          }
        }
      }

      for (let dador of listaIds) {
        if (mapeoTemporal.some(m => m.participante_id === dador)) continue; // ya asignado manualmente

        let opciones = disponibles.filter(receptor => {
          if (dador === receptor) return false; // Regla fija: no auto-asignarse

          if (reglas) {
            const romperRegla = reglas.some(r => {
              if (r.tipo === "direccional" && r.origen_id === dador && r.destino_id === receptor) return true;
              if (r.tipo === "mutua" && ((r.origen_id === dador && r.destino_id === receptor) || (r.origen_id === receptor && r.destino_id === dador))) return true;
              return false;
            });
            if (romperRegla) return false;
          }
          return true;
        });

        if (opciones.length === 0) {
          esValido = false;
          break;
        }

        const eleccion = opciones[Math.floor(Math.random() * opciones.length)];
        mapeoTemporal.push({ participante_id: dador, destinatario_id: eleccion });
        disponibles = disponibles.filter(id => id !== eleccion);
      }

      if (esValido && disponibles.length === 0) {
        asignacionesFinales = mapeoTemporal;
        exito = true;
      }
    }

    if (!exito) {
      return responder({ error: "Las reglas configuradas hacen imposible generar combinaciones válidas. Modifica tus exclusiones." }, 422);
    }

    const filasAInsertar = asignacionesFinales.map(asig => ({
      sorteo_id: sorteoActivo.id,
      participante_id: asig.participante_id,
      destinatario_id: asig.destinatario_id
    }));

    const { error: errorAsignaciones } = await supabase
      .from("asignaciones")
      .insert(filasAInsertar);

    if (errorAsignaciones) {
      return responder({ error: "Error al guardar las asignaciones: " + errorAsignaciones.message }, 500);
    }

    await supabase
      .from("sorteos")
      .update({ estado: "publicado", publicado_en: new Date().toISOString() })
      .eq("id", sorteoActivo.id);

    return responder({ mensaje: "Sorteo generado y guardado exitosamente en la base de datos.", parejasCount: asignacionesFinales.length });
  }

  return responder({ error: "Método no permitido." }, 405);
};
