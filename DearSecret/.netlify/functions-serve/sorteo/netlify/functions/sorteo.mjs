
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// netlify/functions/supabase.js
import { createClient } from "@supabase/supabase-js";
var supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
var supabase_default = supabase;

// netlify/functions/authHelper.js
function respuestaError(mensaje, estado) {
  return new Response(
    JSON.stringify({ error: mensaje }),
    {
      status: estado,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}
async function verificarSesion(request) {
  const autorizacion = request.headers.get("authorization");
  if (!autorizacion || !autorizacion.startsWith("Bearer ")) {
    return {
      error: respuestaError("Debes iniciar sesi\xF3n.", 401)
    };
  }
  const token = autorizacion.substring(7).trim();
  if (!token) {
    return {
      error: respuestaError("Token de acceso vac\xEDo.", 401)
    };
  }
  const { data, error } = await supabase_default.auth.getUser(token);
  if (error || !data.user) {
    return {
      error: respuestaError("La sesi\xF3n no es v\xE1lida o ha expirado.", 401)
    };
  }
  const { data: perfil, error: errorPerfil } = await supabase_default.from("usuarios").select("id, nombre, username, rol, auth_user_id").eq("auth_user_id", data.user.id).maybeSingle();
  if (errorPerfil) {
    return {
      error: respuestaError("No se pudo verificar el perfil.", 500)
    };
  }
  if (!perfil) {
    return {
      error: respuestaError("La cuenta no tiene un perfil asociado.", 403)
    };
  }
  return {
    user: data.user,
    perfil
  };
}
async function verificarAdministrador(request) {
  const resultado = await verificarSesion(request);
  if (resultado.error) {
    return resultado;
  }
  if (resultado.perfil.rol !== "admin") {
    return {
      error: respuestaError(
        "No tienes permisos para realizar esta operaci\xF3n.",
        403
      )
    };
  }
  return resultado;
}

// netlify/functions/sorteo.js
function responder(datos, estado = 200) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { "Content-Type": "application/json" }
  });
}
var sorteo_default = async (request, context) => {
  const acceso = await verificarAdministrador(request);
  if (acceso.error) return acceso.error;
  const metodo = request.method;
  if (metodo !== "GET" && metodo !== "POST" && metodo !== "DELETE") {
    return responder({ error: "M\xE9todo no permitido." }, 405);
  }
  if (metodo === "DELETE") {
    let cuerpo;
    try {
      cuerpo = await request.json();
    } catch {
      return responder({ error: "JSON no v\xE1lido." }, 400);
    }
    const { eventoId } = cuerpo;
    if (!eventoId) return responder({ error: "Debes indicar el evento a reiniciar." }, 400);
    const { data: sorteo, error: errorBusqueda } = await supabase_default.from("sorteos").select("id").eq("evento_id", eventoId).maybeSingle();
    if (errorBusqueda) return responder({ error: "Error al buscar el sorteo." }, 500);
    if (!sorteo) {
      return responder({ mensaje: "No hay ning\xFAn sorteo activo que requiera ser eliminado." }, 200);
    }
    const { error: errorAsignaciones } = await supabase_default.from("asignaciones").delete().eq("sorteo_id", sorteo.id);
    if (errorAsignaciones) return responder({ error: "No se pudieron limpiar las asignaciones viejas." }, 500);
    const { error: errorSorteo } = await supabase_default.from("sorteos").delete().eq("id", sorteo.id);
    if (errorSorteo) return responder({ error: "No se pudo eliminar el sorteo principal." }, 500);
    return responder({ mensaje: "El sorteo y sus emparejamientos fueron eliminados con \xE9xito de Supabase." }, 200);
  }
  if (metodo === "GET") {
    const { data, error } = await supabase_default.from("sorteos").select("*").order("creado_en", { ascending: false });
    if (error) return responder({ error: "No se pudieron consultar los sorteos." }, 500);
    return responder(data);
  }
  if (metodo === "POST") {
    let cuerpo;
    try {
      cuerpo = await request.json();
    } catch {
      return responder({ error: "JSON no v\xE1lido." }, 400);
    }
    const { eventoId, ejecutarEmparejamiento } = cuerpo;
    if (!eventoId) return responder({ error: "Debes indicar el evento." }, 400);
    if (!ejecutarEmparejamiento) {
      const { data: existente } = await supabase_default.from("sorteos").select("id, estado").eq("evento_id", eventoId).in("estado", ["pendiente", "generado", "revision", "publicado"]).maybeSingle();
      if (existente) return responder({ error: "Este evento ya tiene un sorteo activo.", sorteo: existente }, 409);
      const { data, error } = await supabase_default.from("sorteos").insert({ evento_id: eventoId, estado: "pendiente" }).select().single();
      if (error) return responder({ error: "No se pudo crear el sorteo base." }, 500);
      return responder(data, 201);
    }
    const { data: sorteoActivo } = await supabase_default.from("sorteos").select("id, estado").eq("evento_id", eventoId).eq("estado", "pendiente").maybeSingle();
    if (!sorteoActivo) return responder({ error: "No hay un sorteo pendiente base para este evento." }, 404);
    const { data: participantes } = await supabase_default.from("participaciones").select("usuario_id").eq("evento_id", eventoId).eq("estado", "activo");
    if (!participantes || participantes.length < 2) {
      return responder({ error: "Se requieren m\xEDnimo 2 participantes activos en la base de datos." }, 400);
    }
    const { data: reglas } = await supabase_default.from("reglas").select("tipo, origen_id, destino_id").eq("evento_id", eventoId);
    const listaIds = participantes.map((p) => p.usuario_id);
    let asignacionesFinales = [];
    let exito = false;
    let intentos = 0;
    while (!exito && intentos < 500) {
      intentos++;
      let disponibles = [...listaIds];
      let mapeoTemporal = [];
      let esValido = true;
      if (reglas) {
        const manuales = reglas.filter((r) => r.tipo === "manual");
        for (let m of manuales) {
          if (listaIds.includes(m.origen_id) && disponibles.includes(m.destino_id)) {
            mapeoTemporal.push({ participante_id: m.origen_id, destinatario_id: m.destino_id });
            disponibles = disponibles.filter((id) => id !== m.destino_id);
          }
        }
      }
      for (let dador of listaIds) {
        if (mapeoTemporal.some((m) => m.participante_id === dador)) continue;
        let opciones = disponibles.filter((receptor) => {
          if (dador === receptor) return false;
          if (reglas) {
            const romperRegla = reglas.some((r) => {
              if (r.tipo === "direccional" && r.origen_id === dador && r.destino_id === receptor) return true;
              if (r.tipo === "mutua" && (r.origen_id === dador && r.destino_id === receptor || r.origen_id === receptor && r.destino_id === dador)) return true;
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
        disponibles = disponibles.filter((id) => id !== eleccion);
      }
      if (esValido && disponibles.length === 0) {
        asignacionesFinales = mapeoTemporal;
        exito = true;
      }
    }
    if (!exito) {
      return responder({ error: "Las reglas configuradas hacen imposible generar combinaciones v\xE1lidas. Modifica tus exclusiones." }, 422);
    }
    const filasAInsertar = asignacionesFinales.map((asig) => ({
      sorteo_id: sorteoActivo.id,
      participante_id: asig.participante_id,
      destinatario_id: asig.destinatario_id
    }));
    const { error: errorAsignaciones } = await supabase_default.from("asignaciones").insert(filasAInsertar);
    if (errorAsignaciones) {
      return responder({ error: "Error al guardar las asignaciones: " + errorAsignaciones.message }, 500);
    }
    await supabase_default.from("sorteos").update({ estado: "publicado", publicado_en: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", sorteoActivo.id);
    return responder({ mensaje: "Sorteo generado y guardado exitosamente en la base de datos.", parejasCount: asignacionesFinales.length });
  }
  return responder({ error: "M\xE9todo no permitido." }, 405);
};
export {
  sorteo_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvc3VwYWJhc2UuanMiLCAibmV0bGlmeS9mdW5jdGlvbnMvYXV0aEhlbHBlci5qcyIsICJuZXRsaWZ5L2Z1bmN0aW9ucy9zb3J0ZW8uanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gXCJAc3VwYWJhc2Uvc3VwYWJhc2UtanNcIjtcclxuXHJcbmNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KFxyXG4gIHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTCxcclxuICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZXHJcbik7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzdXBhYmFzZTsiLCAiXHJcbmltcG9ydCBzdXBhYmFzZSBmcm9tIFwiLi9zdXBhYmFzZS5qc1wiO1xyXG5cclxuZnVuY3Rpb24gcmVzcHVlc3RhRXJyb3IobWVuc2FqZSwgZXN0YWRvKSB7XHJcbiAgcmV0dXJuIG5ldyBSZXNwb25zZShcclxuICAgIEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IG1lbnNhamUgfSksXHJcbiAgICB7XHJcbiAgICAgIHN0YXR1czogZXN0YWRvLFxyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2ZXJpZmljYXJTZXNpb24ocmVxdWVzdCkge1xyXG4gIGNvbnN0IGF1dG9yaXphY2lvbiA9IHJlcXVlc3QuaGVhZGVycy5nZXQoXCJhdXRob3JpemF0aW9uXCIpO1xyXG5cclxuICBpZiAoIWF1dG9yaXphY2lvbiB8fCAhYXV0b3JpemFjaW9uLnN0YXJ0c1dpdGgoXCJCZWFyZXIgXCIpKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBlcnJvcjogcmVzcHVlc3RhRXJyb3IoXCJEZWJlcyBpbmljaWFyIHNlc2lcdTAwRjNuLlwiLCA0MDEpXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgY29uc3QgdG9rZW4gPSBhdXRvcml6YWNpb24uc3Vic3RyaW5nKDcpLnRyaW0oKTtcclxuXHJcbiAgaWYgKCF0b2tlbikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZXJyb3I6IHJlc3B1ZXN0YUVycm9yKFwiVG9rZW4gZGUgYWNjZXNvIHZhY1x1MDBFRG8uXCIsIDQwMSlcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5hdXRoLmdldFVzZXIodG9rZW4pO1xyXG5cclxuICBpZiAoZXJyb3IgfHwgIWRhdGEudXNlcikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZXJyb3I6IHJlc3B1ZXN0YUVycm9yKFwiTGEgc2VzaVx1MDBGM24gbm8gZXMgdlx1MDBFMWxpZGEgbyBoYSBleHBpcmFkby5cIiwgNDAxKVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHsgZGF0YTogcGVyZmlsLCBlcnJvcjogZXJyb3JQZXJmaWwgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAuZnJvbShcInVzdWFyaW9zXCIpXHJcbiAgICAuc2VsZWN0KFwiaWQsIG5vbWJyZSwgdXNlcm5hbWUsIHJvbCwgYXV0aF91c2VyX2lkXCIpXHJcbiAgICAuZXEoXCJhdXRoX3VzZXJfaWRcIiwgZGF0YS51c2VyLmlkKVxyXG4gICAgLm1heWJlU2luZ2xlKCk7XHJcblxyXG4gIGlmIChlcnJvclBlcmZpbCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZXJyb3I6IHJlc3B1ZXN0YUVycm9yKFwiTm8gc2UgcHVkbyB2ZXJpZmljYXIgZWwgcGVyZmlsLlwiLCA1MDApXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgaWYgKCFwZXJmaWwpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGVycm9yOiByZXNwdWVzdGFFcnJvcihcIkxhIGN1ZW50YSBubyB0aWVuZSB1biBwZXJmaWwgYXNvY2lhZG8uXCIsIDQwMylcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgdXNlcjogZGF0YS51c2VyLFxyXG4gICAgcGVyZmlsXHJcbiAgfTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHZlcmlmaWNhckFkbWluaXN0cmFkb3IocmVxdWVzdCkge1xyXG4gIGNvbnN0IHJlc3VsdGFkbyA9IGF3YWl0IHZlcmlmaWNhclNlc2lvbihyZXF1ZXN0KTtcclxuXHJcbiAgaWYgKHJlc3VsdGFkby5lcnJvcikge1xyXG4gICAgcmV0dXJuIHJlc3VsdGFkbztcclxuICB9XHJcblxyXG4gIGlmIChyZXN1bHRhZG8ucGVyZmlsLnJvbCAhPT0gXCJhZG1pblwiKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBlcnJvcjogcmVzcHVlc3RhRXJyb3IoXHJcbiAgICAgICAgXCJObyB0aWVuZXMgcGVybWlzb3MgcGFyYSByZWFsaXphciBlc3RhIG9wZXJhY2lcdTAwRjNuLlwiLFxyXG4gICAgICAgIDQwM1xyXG4gICAgICApXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJlc3VsdGFkbztcclxufSIsICJpbXBvcnQgc3VwYWJhc2UgZnJvbSBcIi4vc3VwYWJhc2UuanNcIjtcclxuaW1wb3J0IHsgdmVyaWZpY2FyQWRtaW5pc3RyYWRvciB9IGZyb20gXCIuL2F1dGhIZWxwZXIuanNcIjtcclxuXHJcbmZ1bmN0aW9uIHJlc3BvbmRlcihkYXRvcywgZXN0YWRvID0gMjAwKSB7XHJcbiAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeShkYXRvcyksIHtcclxuICAgIHN0YXR1czogZXN0YWRvLFxyXG4gICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIChyZXF1ZXN0LCBjb250ZXh0KSA9PiB7XHJcbiAgY29uc3QgYWNjZXNvID0gYXdhaXQgdmVyaWZpY2FyQWRtaW5pc3RyYWRvcihyZXF1ZXN0KTtcclxuICBpZiAoYWNjZXNvLmVycm9yKSByZXR1cm4gYWNjZXNvLmVycm9yO1xyXG5cclxuICBjb25zdCBtZXRvZG8gPSByZXF1ZXN0Lm1ldGhvZDtcclxuICBcclxuICBpZiAobWV0b2RvICE9PSBcIkdFVFwiICYmIG1ldG9kbyAhPT0gXCJQT1NUXCIgJiYgbWV0b2RvICE9PSBcIkRFTEVURVwiKSB7XHJcbiAgICByZXR1cm4gcmVzcG9uZGVyKHsgZXJyb3I6IFwiTVx1MDBFOXRvZG8gbm8gcGVybWl0aWRvLlwiIH0sIDQwNSk7XHJcbiAgfVxyXG4gIGlmIChtZXRvZG8gPT09IFwiREVMRVRFXCIpIHtcclxuICAgIGxldCBjdWVycG87XHJcbiAgICB0cnkgeyBjdWVycG8gPSBhd2FpdCByZXF1ZXN0Lmpzb24oKTsgfSBjYXRjaCB7IHJldHVybiByZXNwb25kZXIoeyBlcnJvcjogXCJKU09OIG5vIHZcdTAwRTFsaWRvLlwiIH0sIDQwMCk7IH1cclxuXHJcbiAgICBjb25zdCB7IGV2ZW50b0lkIH0gPSBjdWVycG87XHJcbiAgICBpZiAoIWV2ZW50b0lkKSByZXR1cm4gcmVzcG9uZGVyKHsgZXJyb3I6IFwiRGViZXMgaW5kaWNhciBlbCBldmVudG8gYSByZWluaWNpYXIuXCIgfSwgNDAwKTtcclxuXHJcbiAgICAvLyAxLiBCdXNjYXIgc2kgaGF5IGFsZ1x1MDBGQW4gc29ydGVvIGxpZ2FkbyBhIGVzZSBldmVudG9cclxuICAgIGNvbnN0IHsgZGF0YTogc29ydGVvLCBlcnJvcjogZXJyb3JCdXNxdWVkYSB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgLmZyb20oXCJzb3J0ZW9zXCIpXHJcbiAgICAgIC5zZWxlY3QoXCJpZFwiKVxyXG4gICAgICAuZXEoXCJldmVudG9faWRcIiwgZXZlbnRvSWQpXHJcbiAgICAgIC5tYXliZVNpbmdsZSgpO1xyXG5cclxuICAgIGlmIChlcnJvckJ1c3F1ZWRhKSByZXR1cm4gcmVzcG9uZGVyKHsgZXJyb3I6IFwiRXJyb3IgYWwgYnVzY2FyIGVsIHNvcnRlby5cIiB9LCA1MDApO1xyXG4gICAgXHJcbiAgICBpZiAoIXNvcnRlbykge1xyXG4gICAgICByZXR1cm4gcmVzcG9uZGVyKHsgbWVuc2FqZTogXCJObyBoYXkgbmluZ1x1MDBGQW4gc29ydGVvIGFjdGl2byBxdWUgcmVxdWllcmEgc2VyIGVsaW1pbmFkby5cIiB9LCAyMDApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHsgZXJyb3I6IGVycm9yQXNpZ25hY2lvbmVzIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAuZnJvbShcImFzaWduYWNpb25lc1wiKVxyXG4gICAgICAuZGVsZXRlKClcclxuICAgICAgLmVxKFwic29ydGVvX2lkXCIsIHNvcnRlby5pZCk7XHJcblxyXG4gICAgaWYgKGVycm9yQXNpZ25hY2lvbmVzKSByZXR1cm4gcmVzcG9uZGVyKHsgZXJyb3I6IFwiTm8gc2UgcHVkaWVyb24gbGltcGlhciBsYXMgYXNpZ25hY2lvbmVzIHZpZWphcy5cIiB9LCA1MDApO1xyXG5cclxuICAgIGNvbnN0IHsgZXJyb3I6IGVycm9yU29ydGVvIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAuZnJvbShcInNvcnRlb3NcIilcclxuICAgICAgLmRlbGV0ZSgpXHJcbiAgICAgIC5lcShcImlkXCIsIHNvcnRlby5pZCk7XHJcblxyXG4gICAgaWYgKGVycm9yU29ydGVvKSByZXR1cm4gcmVzcG9uZGVyKHsgZXJyb3I6IFwiTm8gc2UgcHVkbyBlbGltaW5hciBlbCBzb3J0ZW8gcHJpbmNpcGFsLlwiIH0sIDUwMCk7XHJcblxyXG4gICAgcmV0dXJuIHJlc3BvbmRlcih7IG1lbnNhamU6IFwiRWwgc29ydGVvIHkgc3VzIGVtcGFyZWphbWllbnRvcyBmdWVyb24gZWxpbWluYWRvcyBjb24gXHUwMEU5eGl0byBkZSBTdXBhYmFzZS5cIiB9LCAyMDApO1xyXG4gIH1cclxuICBpZiAobWV0b2RvID09PSBcIkdFVFwiKSB7XHJcbiAgICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAuZnJvbShcInNvcnRlb3NcIilcclxuICAgICAgLnNlbGVjdChcIipcIilcclxuICAgICAgLm9yZGVyKFwiY3JlYWRvX2VuXCIsIHsgYXNjZW5kaW5nOiBmYWxzZSB9KTtcclxuXHJcbiAgICBpZiAoZXJyb3IpIHJldHVybiByZXNwb25kZXIoeyBlcnJvcjogXCJObyBzZSBwdWRpZXJvbiBjb25zdWx0YXIgbG9zIHNvcnRlb3MuXCIgfSwgNTAwKTtcclxuICAgIHJldHVybiByZXNwb25kZXIoZGF0YSk7XHJcbiAgfVxyXG5cclxuICBpZiAobWV0b2RvID09PSBcIlBPU1RcIikge1xyXG4gICAgbGV0IGN1ZXJwbztcclxuICAgIHRyeSB7IGN1ZXJwbyA9IGF3YWl0IHJlcXVlc3QuanNvbigpOyB9IGNhdGNoIHsgcmV0dXJuIHJlc3BvbmRlcih7IGVycm9yOiBcIkpTT04gbm8gdlx1MDBFMWxpZG8uXCIgfSwgNDAwKTsgfVxyXG5cclxuICAgIGNvbnN0IHsgZXZlbnRvSWQsIGVqZWN1dGFyRW1wYXJlamFtaWVudG8gfSA9IGN1ZXJwbztcclxuICAgIGlmICghZXZlbnRvSWQpIHJldHVybiByZXNwb25kZXIoeyBlcnJvcjogXCJEZWJlcyBpbmRpY2FyIGVsIGV2ZW50by5cIiB9LCA0MDApO1xyXG5cclxuICAgIGlmICghZWplY3V0YXJFbXBhcmVqYW1pZW50bykge1xyXG4gICAgICBjb25zdCB7IGRhdGE6IGV4aXN0ZW50ZSB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgICAuZnJvbShcInNvcnRlb3NcIilcclxuICAgICAgICAuc2VsZWN0KFwiaWQsIGVzdGFkb1wiKVxyXG4gICAgICAgIC5lcShcImV2ZW50b19pZFwiLCBldmVudG9JZClcclxuICAgICAgICAuaW4oXCJlc3RhZG9cIiwgW1wicGVuZGllbnRlXCIsIFwiZ2VuZXJhZG9cIiwgXCJyZXZpc2lvblwiLCBcInB1YmxpY2Fkb1wiXSlcclxuICAgICAgICAubWF5YmVTaW5nbGUoKTtcclxuXHJcbiAgICAgIGlmIChleGlzdGVudGUpIHJldHVybiByZXNwb25kZXIoeyBlcnJvcjogXCJFc3RlIGV2ZW50byB5YSB0aWVuZSB1biBzb3J0ZW8gYWN0aXZvLlwiLCBzb3J0ZW86IGV4aXN0ZW50ZSB9LCA0MDkpO1xyXG5cclxuICAgICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgICAuZnJvbShcInNvcnRlb3NcIilcclxuICAgICAgICAuaW5zZXJ0KHsgZXZlbnRvX2lkOiBldmVudG9JZCwgZXN0YWRvOiBcInBlbmRpZW50ZVwiIH0pXHJcbiAgICAgICAgLnNlbGVjdCgpLnNpbmdsZSgpO1xyXG5cclxuICAgICAgaWYgKGVycm9yKSByZXR1cm4gcmVzcG9uZGVyKHsgZXJyb3I6IFwiTm8gc2UgcHVkbyBjcmVhciBlbCBzb3J0ZW8gYmFzZS5cIiB9LCA1MDApO1xyXG4gICAgICByZXR1cm4gcmVzcG9uZGVyKGRhdGEsIDIwMSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgeyBkYXRhOiBzb3J0ZW9BY3Rpdm8gfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgIC5mcm9tKFwic29ydGVvc1wiKVxyXG4gICAgICAuc2VsZWN0KFwiaWQsIGVzdGFkb1wiKVxyXG4gICAgICAuZXEoXCJldmVudG9faWRcIiwgZXZlbnRvSWQpXHJcbiAgICAgIC5lcShcImVzdGFkb1wiLCBcInBlbmRpZW50ZVwiKVxyXG4gICAgICAubWF5YmVTaW5nbGUoKTtcclxuXHJcbiAgICBpZiAoIXNvcnRlb0FjdGl2bykgcmV0dXJuIHJlc3BvbmRlcih7IGVycm9yOiBcIk5vIGhheSB1biBzb3J0ZW8gcGVuZGllbnRlIGJhc2UgcGFyYSBlc3RlIGV2ZW50by5cIiB9LCA0MDQpO1xyXG5cclxuICAgIGNvbnN0IHsgZGF0YTogcGFydGljaXBhbnRlcyB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgLmZyb20oXCJwYXJ0aWNpcGFjaW9uZXNcIilcclxuICAgICAgLnNlbGVjdChcInVzdWFyaW9faWRcIilcclxuICAgICAgLmVxKFwiZXZlbnRvX2lkXCIsIGV2ZW50b0lkKVxyXG4gICAgICAuZXEoXCJlc3RhZG9cIiwgXCJhY3Rpdm9cIik7XHJcblxyXG4gICAgaWYgKCFwYXJ0aWNpcGFudGVzIHx8IHBhcnRpY2lwYW50ZXMubGVuZ3RoIDwgMikge1xyXG4gICAgICByZXR1cm4gcmVzcG9uZGVyKHsgZXJyb3I6IFwiU2UgcmVxdWllcmVuIG1cdTAwRURuaW1vIDIgcGFydGljaXBhbnRlcyBhY3Rpdm9zIGVuIGxhIGJhc2UgZGUgZGF0b3MuXCIgfSwgNDAwKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB7IGRhdGE6IHJlZ2xhcyB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgLmZyb20oXCJyZWdsYXNcIilcclxuICAgICAgLnNlbGVjdChcInRpcG8sIG9yaWdlbl9pZCwgZGVzdGlub19pZFwiKVxyXG4gICAgICAuZXEoXCJldmVudG9faWRcIiwgZXZlbnRvSWQpO1xyXG5cclxuICAgIGNvbnN0IGxpc3RhSWRzID0gcGFydGljaXBhbnRlcy5tYXAocCA9PiBwLnVzdWFyaW9faWQpO1xyXG4gICAgbGV0IGFzaWduYWNpb25lc0ZpbmFsZXMgPSBbXTtcclxuICAgIGxldCBleGl0byA9IGZhbHNlO1xyXG4gICAgbGV0IGludGVudG9zID0gMDtcclxuXHJcbiAgICB3aGlsZSAoIWV4aXRvICYmIGludGVudG9zIDwgNTAwKSB7XHJcbiAgICAgIGludGVudG9zKys7XHJcbiAgICAgIGxldCBkaXNwb25pYmxlcyA9IFsuLi5saXN0YUlkc107XHJcbiAgICAgIGxldCBtYXBlb1RlbXBvcmFsID0gW107XHJcbiAgICAgIGxldCBlc1ZhbGlkbyA9IHRydWU7XHJcblxyXG4gICAgICAgIGlmIChyZWdsYXMpIHtcclxuICAgICAgICBjb25zdCBtYW51YWxlcyA9IHJlZ2xhcy5maWx0ZXIociA9PiByLnRpcG8gPT09IFwibWFudWFsXCIpO1xyXG4gICAgICAgIGZvciAobGV0IG0gb2YgbWFudWFsZXMpIHtcclxuICAgICAgICAgIGlmIChsaXN0YUlkcy5pbmNsdWRlcyhtLm9yaWdlbl9pZCkgJiYgZGlzcG9uaWJsZXMuaW5jbHVkZXMobS5kZXN0aW5vX2lkKSkge1xyXG4gICAgICAgICAgICBtYXBlb1RlbXBvcmFsLnB1c2goeyBwYXJ0aWNpcGFudGVfaWQ6IG0ub3JpZ2VuX2lkLCBkZXN0aW5hdGFyaW9faWQ6IG0uZGVzdGlub19pZCB9KTtcclxuICAgICAgICAgICAgZGlzcG9uaWJsZXMgPSBkaXNwb25pYmxlcy5maWx0ZXIoaWQgPT4gaWQgIT09IG0uZGVzdGlub19pZCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBmb3IgKGxldCBkYWRvciBvZiBsaXN0YUlkcykge1xyXG4gICAgICAgIGlmIChtYXBlb1RlbXBvcmFsLnNvbWUobSA9PiBtLnBhcnRpY2lwYW50ZV9pZCA9PT0gZGFkb3IpKSBjb250aW51ZTsgLy8geWEgYXNpZ25hZG8gbWFudWFsbWVudGVcclxuXHJcbiAgICAgICAgbGV0IG9wY2lvbmVzID0gZGlzcG9uaWJsZXMuZmlsdGVyKHJlY2VwdG9yID0+IHtcclxuICAgICAgICAgIGlmIChkYWRvciA9PT0gcmVjZXB0b3IpIHJldHVybiBmYWxzZTsgLy8gUmVnbGEgZmlqYTogbm8gYXV0by1hc2lnbmFyc2VcclxuXHJcbiAgICAgICAgICBpZiAocmVnbGFzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJvbXBlclJlZ2xhID0gcmVnbGFzLnNvbWUociA9PiB7XHJcbiAgICAgICAgICAgICAgaWYgKHIudGlwbyA9PT0gXCJkaXJlY2Npb25hbFwiICYmIHIub3JpZ2VuX2lkID09PSBkYWRvciAmJiByLmRlc3Rpbm9faWQgPT09IHJlY2VwdG9yKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICBpZiAoci50aXBvID09PSBcIm11dHVhXCIgJiYgKChyLm9yaWdlbl9pZCA9PT0gZGFkb3IgJiYgci5kZXN0aW5vX2lkID09PSByZWNlcHRvcikgfHwgKHIub3JpZ2VuX2lkID09PSByZWNlcHRvciAmJiByLmRlc3Rpbm9faWQgPT09IGRhZG9yKSkpIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGlmIChyb21wZXJSZWdsYSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmIChvcGNpb25lcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgIGVzVmFsaWRvID0gZmFsc2U7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGVsZWNjaW9uID0gb3BjaW9uZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogb3BjaW9uZXMubGVuZ3RoKV07XHJcbiAgICAgICAgbWFwZW9UZW1wb3JhbC5wdXNoKHsgcGFydGljaXBhbnRlX2lkOiBkYWRvciwgZGVzdGluYXRhcmlvX2lkOiBlbGVjY2lvbiB9KTtcclxuICAgICAgICBkaXNwb25pYmxlcyA9IGRpc3BvbmlibGVzLmZpbHRlcihpZCA9PiBpZCAhPT0gZWxlY2Npb24pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZXNWYWxpZG8gJiYgZGlzcG9uaWJsZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYXNpZ25hY2lvbmVzRmluYWxlcyA9IG1hcGVvVGVtcG9yYWw7XHJcbiAgICAgICAgZXhpdG8gPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFleGl0bykge1xyXG4gICAgICByZXR1cm4gcmVzcG9uZGVyKHsgZXJyb3I6IFwiTGFzIHJlZ2xhcyBjb25maWd1cmFkYXMgaGFjZW4gaW1wb3NpYmxlIGdlbmVyYXIgY29tYmluYWNpb25lcyB2XHUwMEUxbGlkYXMuIE1vZGlmaWNhIHR1cyBleGNsdXNpb25lcy5cIiB9LCA0MjIpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZpbGFzQUluc2VydGFyID0gYXNpZ25hY2lvbmVzRmluYWxlcy5tYXAoYXNpZyA9PiAoe1xyXG4gICAgICBzb3J0ZW9faWQ6IHNvcnRlb0FjdGl2by5pZCxcclxuICAgICAgcGFydGljaXBhbnRlX2lkOiBhc2lnLnBhcnRpY2lwYW50ZV9pZCxcclxuICAgICAgZGVzdGluYXRhcmlvX2lkOiBhc2lnLmRlc3RpbmF0YXJpb19pZFxyXG4gICAgfSkpO1xyXG5cclxuICAgIGNvbnN0IHsgZXJyb3I6IGVycm9yQXNpZ25hY2lvbmVzIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAuZnJvbShcImFzaWduYWNpb25lc1wiKVxyXG4gICAgICAuaW5zZXJ0KGZpbGFzQUluc2VydGFyKTtcclxuXHJcbiAgICBpZiAoZXJyb3JBc2lnbmFjaW9uZXMpIHtcclxuICAgICAgcmV0dXJuIHJlc3BvbmRlcih7IGVycm9yOiBcIkVycm9yIGFsIGd1YXJkYXIgbGFzIGFzaWduYWNpb25lczogXCIgKyBlcnJvckFzaWduYWNpb25lcy5tZXNzYWdlIH0sIDUwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXdhaXQgc3VwYWJhc2VcclxuICAgICAgLmZyb20oXCJzb3J0ZW9zXCIpXHJcbiAgICAgIC51cGRhdGUoeyBlc3RhZG86IFwicHVibGljYWRvXCIsIHB1YmxpY2Fkb19lbjogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH0pXHJcbiAgICAgIC5lcShcImlkXCIsIHNvcnRlb0FjdGl2by5pZCk7XHJcblxyXG4gICAgcmV0dXJuIHJlc3BvbmRlcih7IG1lbnNhamU6IFwiU29ydGVvIGdlbmVyYWRvIHkgZ3VhcmRhZG8gZXhpdG9zYW1lbnRlIGVuIGxhIGJhc2UgZGUgZGF0b3MuXCIsIHBhcmVqYXNDb3VudDogYXNpZ25hY2lvbmVzRmluYWxlcy5sZW5ndGggfSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcmVzcG9uZGVyKHsgZXJyb3I6IFwiTVx1MDBFOXRvZG8gbm8gcGVybWl0aWRvLlwiIH0sIDQwNSk7XHJcbn07XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7QUFBQSxTQUFTLG9CQUFvQjtBQUU3QixJQUFNLFdBQVc7QUFBQSxFQUNmLFFBQVEsSUFBSTtBQUFBLEVBQ1osUUFBUSxJQUFJO0FBQ2Q7QUFFQSxJQUFPLG1CQUFROzs7QUNKZixTQUFTLGVBQWUsU0FBUyxRQUFRO0FBQ3ZDLFNBQU8sSUFBSTtBQUFBLElBQ1QsS0FBSyxVQUFVLEVBQUUsT0FBTyxRQUFRLENBQUM7QUFBQSxJQUNqQztBQUFBLE1BQ0UsUUFBUTtBQUFBLE1BQ1IsU0FBUztBQUFBLFFBQ1AsZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGO0FBRUEsZUFBc0IsZ0JBQWdCLFNBQVM7QUFDN0MsUUFBTSxlQUFlLFFBQVEsUUFBUSxJQUFJLGVBQWU7QUFFeEQsTUFBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsV0FBVyxTQUFTLEdBQUc7QUFDeEQsV0FBTztBQUFBLE1BQ0wsT0FBTyxlQUFlLDRCQUF5QixHQUFHO0FBQUEsSUFDcEQ7QUFBQSxFQUNGO0FBRUEsUUFBTSxRQUFRLGFBQWEsVUFBVSxDQUFDLEVBQUUsS0FBSztBQUU3QyxNQUFJLENBQUMsT0FBTztBQUNWLFdBQU87QUFBQSxNQUNMLE9BQU8sZUFBZSw2QkFBMEIsR0FBRztBQUFBLElBQ3JEO0FBQUEsRUFDRjtBQUVBLFFBQU0sRUFBRSxNQUFNLE1BQU0sSUFBSSxNQUFNLGlCQUFTLEtBQUssUUFBUSxLQUFLO0FBRXpELE1BQUksU0FBUyxDQUFDLEtBQUssTUFBTTtBQUN2QixXQUFPO0FBQUEsTUFDTCxPQUFPLGVBQWUsK0NBQXlDLEdBQUc7QUFBQSxJQUNwRTtBQUFBLEVBQ0Y7QUFFQSxRQUFNLEVBQUUsTUFBTSxRQUFRLE9BQU8sWUFBWSxJQUFJLE1BQU0saUJBQ2hELEtBQUssVUFBVSxFQUNmLE9BQU8seUNBQXlD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
