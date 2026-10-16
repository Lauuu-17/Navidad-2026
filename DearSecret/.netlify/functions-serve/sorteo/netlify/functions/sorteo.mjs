
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
    const { data: existente } = await supabase_default.from("sorteos").select("id, estado").eq("evento_id", eventoId).maybeSingle();
    if (!ejecutarEmparejamiento) {
      if (existente) return responder(existente, 200);
      const { data, error } = await supabase_default.from("sorteos").insert({ evento_id: eventoId, estado: "pendiente" }).select().single();
      if (error) return responder({ error: "No se pudo crear el sorteo base." }, 500);
      return responder(data, 201);
    }
    let sorteoId = existente?.id;
    if (!sorteoId) {
      const { data: nuevoSorteo } = await supabase_default.from("sorteos").insert({ evento_id: eventoId, estado: "pendiente" }).select().single();
      sorteoId = nuevoSorteo.id;
    } else {
      await supabase_default.from("asignaciones").delete().eq("sorteo_id", sorteoId);
    }
    await supabase_default.from("sorteos").update({ estado: "publicado", publicado_en: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", sorteoId);
    return responder({ mensaje: "Sorteo generado y guardado exitosamente.", estado: "Publicado" });
  }
  return responder({ error: "M\xE9todo no permitido." }, 405);
};
export {
  sorteo_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvc3VwYWJhc2UuanMiLCAibmV0bGlmeS9mdW5jdGlvbnMvYXV0aEhlbHBlci5qcyIsICJuZXRsaWZ5L2Z1bmN0aW9ucy9zb3J0ZW8uanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gXCJAc3VwYWJhc2Uvc3VwYWJhc2UtanNcIjtcclxuXHJcbmNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KFxyXG4gIHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTCxcclxuICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZXHJcbik7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzdXBhYmFzZTsiLCAiXHJcbmltcG9ydCBzdXBhYmFzZSBmcm9tIFwiLi9zdXBhYmFzZS5qc1wiO1xyXG5cclxuZnVuY3Rpb24gcmVzcHVlc3RhRXJyb3IobWVuc2FqZSwgZXN0YWRvKSB7XHJcbiAgcmV0dXJuIG5ldyBSZXNwb25zZShcclxuICAgIEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IG1lbnNhamUgfSksXHJcbiAgICB7XHJcbiAgICAgIHN0YXR1czogZXN0YWRvLFxyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2ZXJpZmljYXJTZXNpb24ocmVxdWVzdCkge1xyXG4gIGNvbnN0IGF1dG9yaXphY2lvbiA9IHJlcXVlc3QuaGVhZGVycy5nZXQoXCJhdXRob3JpemF0aW9uXCIpO1xyXG5cclxuICBpZiAoIWF1dG9yaXphY2lvbiB8fCAhYXV0b3JpemFjaW9uLnN0YXJ0c1dpdGgoXCJCZWFyZXIgXCIpKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBlcnJvcjogcmVzcHVlc3RhRXJyb3IoXCJEZWJlcyBpbmljaWFyIHNlc2lcdTAwRjNuLlwiLCA0MDEpXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgY29uc3QgdG9rZW4gPSBhdXRvcml6YWNpb24uc3Vic3RyaW5nKDcpLnRyaW0oKTtcclxuXHJcbiAgaWYgKCF0b2tlbikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZXJyb3I6IHJlc3B1ZXN0YUVycm9yKFwiVG9rZW4gZGUgYWNjZXNvIHZhY1x1MDBFRG8uXCIsIDQwMSlcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5hdXRoLmdldFVzZXIodG9rZW4pO1xyXG5cclxuICBpZiAoZXJyb3IgfHwgIWRhdGEudXNlcikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZXJyb3I6IHJlc3B1ZXN0YUVycm9yKFwiTGEgc2VzaVx1MDBGM24gbm8gZXMgdlx1MDBFMWxpZGEgbyBoYSBleHBpcmFkby5cIiwgNDAxKVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHsgZGF0YTogcGVyZmlsLCBlcnJvcjogZXJyb3JQZXJmaWwgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAuZnJvbShcInVzdWFyaW9zXCIpXHJcbiAgICAuc2VsZWN0KFwiaWQsIG5vbWJyZSwgdXNlcm5hbWUsIHJvbCwgYXV0aF91c2VyX2lkXCIpXHJcbiAgICAuZXEoXCJhdXRoX3VzZXJfaWRcIiwgZGF0YS51c2VyLmlkKVxyXG4gICAgLm1heWJlU2luZ2xlKCk7XHJcblxyXG4gIGlmIChlcnJvclBlcmZpbCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZXJyb3I6IHJlc3B1ZXN0YUVycm9yKFwiTm8gc2UgcHVkbyB2ZXJpZmljYXIgZWwgcGVyZmlsLlwiLCA1MDApXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgaWYgKCFwZXJmaWwpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGVycm9yOiByZXNwdWVzdGFFcnJvcihcIkxhIGN1ZW50YSBubyB0aWVuZSB1biBwZXJmaWwgYXNvY2lhZG8uXCIsIDQwMylcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgdXNlcjogZGF0YS51c2VyLFxyXG4gICAgcGVyZmlsXHJcbiAgfTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHZlcmlmaWNhckFkbWluaXN0cmFkb3IocmVxdWVzdCkge1xyXG4gIGNvbnN0IHJlc3VsdGFkbyA9IGF3YWl0IHZlcmlmaWNhclNlc2lvbihyZXF1ZXN0KTtcclxuXHJcbiAgaWYgKHJlc3VsdGFkby5lcnJvcikge1xyXG4gICAgcmV0dXJuIHJlc3VsdGFkbztcclxuICB9XHJcblxyXG4gIGlmIChyZXN1bHRhZG8ucGVyZmlsLnJvbCAhPT0gXCJhZG1pblwiKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBlcnJvcjogcmVzcHVlc3RhRXJyb3IoXHJcbiAgICAgICAgXCJObyB0aWVuZXMgcGVybWlzb3MgcGFyYSByZWFsaXphciBlc3RhIG9wZXJhY2lcdTAwRjNuLlwiLFxyXG4gICAgICAgIDQwM1xyXG4gICAgICApXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJlc3VsdGFkbztcclxufSIsICJpbXBvcnQgc3VwYWJhc2UgZnJvbSBcIi4vc3VwYWJhc2UuanNcIjtcclxuaW1wb3J0IHsgdmVyaWZpY2FyQWRtaW5pc3RyYWRvciB9IGZyb20gXCIuL2F1dGhIZWxwZXIuanNcIjtcclxuXHJcbmZ1bmN0aW9uIHJlc3BvbmRlcihkYXRvcywgZXN0YWRvID0gMjAwKSB7XHJcbiAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeShkYXRvcyksIHtcclxuICAgIHN0YXR1czogZXN0YWRvLFxyXG4gICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIChyZXF1ZXN0LCBjb250ZXh0KSA9PiB7XHJcbiAgY29uc3QgYWNjZXNvID0gYXdhaXQgdmVyaWZpY2FyQWRtaW5pc3RyYWRvcihyZXF1ZXN0KTtcclxuICBpZiAoYWNjZXNvLmVycm9yKSByZXR1cm4gYWNjZXNvLmVycm9yO1xyXG5cclxuICBjb25zdCBtZXRvZG8gPSByZXF1ZXN0Lm1ldGhvZDtcclxuICBcclxuICBpZiAobWV0b2RvICE9PSBcIkdFVFwiICYmIG1ldG9kbyAhPT0gXCJQT1NUXCIgJiYgbWV0b2RvICE9PSBcIkRFTEVURVwiKSB7XHJcbiAgICByZXR1cm4gcmVzcG9uZGVyKHsgZXJyb3I6IFwiTVx1MDBFOXRvZG8gbm8gcGVybWl0aWRvLlwiIH0sIDQwNSk7XHJcbiAgfVxyXG4gIGlmIChtZXRvZG8gPT09IFwiREVMRVRFXCIpIHtcclxuICAgIGxldCBjdWVycG87XHJcbiAgICB0cnkgeyBjdWVycG8gPSBhd2FpdCByZXF1ZXN0Lmpzb24oKTsgfSBjYXRjaCB7IHJldHVybiByZXNwb25kZXIoeyBlcnJvcjogXCJKU09OIG5vIHZcdTAwRTFsaWRvLlwiIH0sIDQwMCk7IH1cclxuXHJcbiAgICBjb25zdCB7IGV2ZW50b0lkIH0gPSBjdWVycG87XHJcbiAgICBpZiAoIWV2ZW50b0lkKSByZXR1cm4gcmVzcG9uZGVyKHsgZXJyb3I6IFwiRGViZXMgaW5kaWNhciBlbCBldmVudG8gYSByZWluaWNpYXIuXCIgfSwgNDAwKTtcclxuXHJcbiAgICBjb25zdCB7IGRhdGE6IHNvcnRlbywgZXJyb3I6IGVycm9yQnVzcXVlZGEgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgIC5mcm9tKFwic29ydGVvc1wiKVxyXG4gICAgICAuc2VsZWN0KFwiaWRcIilcclxuICAgICAgLmVxKFwiZXZlbnRvX2lkXCIsIGV2ZW50b0lkKVxyXG4gICAgICAubWF5YmVTaW5nbGUoKTtcclxuXHJcbiAgICBpZiAoZXJyb3JCdXNxdWVkYSkgcmV0dXJuIHJlc3BvbmRlcih7IGVycm9yOiBcIkVycm9yIGFsIGJ1c2NhciBlbCBzb3J0ZW8uXCIgfSwgNTAwKTtcclxuICAgIFxyXG4gICAgaWYgKCFzb3J0ZW8pIHtcclxuICAgICAgcmV0dXJuIHJlc3BvbmRlcih7IG1lbnNhamU6IFwiTm8gaGF5IG5pbmdcdTAwRkFuIHNvcnRlbyBhY3Rpdm8gcXVlIHJlcXVpZXJhIHNlciBlbGltaW5hZG8uXCIgfSwgMjAwKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB7IGVycm9yOiBlcnJvckFzaWduYWNpb25lcyB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgLmZyb20oXCJhc2lnbmFjaW9uZXNcIilcclxuICAgICAgLmRlbGV0ZSgpXHJcbiAgICAgIC5lcShcInNvcnRlb19pZFwiLCBzb3J0ZW8uaWQpO1xyXG5cclxuICAgIGlmIChlcnJvckFzaWduYWNpb25lcykgcmV0dXJuIHJlc3BvbmRlcih7IGVycm9yOiBcIk5vIHNlIHB1ZGllcm9uIGxpbXBpYXIgbGFzIGFzaWduYWNpb25lcyB2aWVqYXMuXCIgfSwgNTAwKTtcclxuXHJcbiAgICBjb25zdCB7IGVycm9yOiBlcnJvclNvcnRlbyB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgLmZyb20oXCJzb3J0ZW9zXCIpXHJcbiAgICAgIC5kZWxldGUoKVxyXG4gICAgICAuZXEoXCJpZFwiLCBzb3J0ZW8uaWQpO1xyXG5cclxuICAgIGlmIChlcnJvclNvcnRlbykgcmV0dXJuIHJlc3BvbmRlcih7IGVycm9yOiBcIk5vIHNlIHB1ZG8gZWxpbWluYXIgZWwgc29ydGVvIHByaW5jaXBhbC5cIiB9LCA1MDApO1xyXG5cclxuICAgIHJldHVybiByZXNwb25kZXIoeyBtZW5zYWplOiBcIkVsIHNvcnRlbyB5IHN1cyBlbXBhcmVqYW1pZW50b3MgZnVlcm9uIGVsaW1pbmFkb3MgY29uIFx1MDBFOXhpdG8gZGUgU3VwYWJhc2UuXCIgfSwgMjAwKTtcclxuICB9XHJcbiAgaWYgKG1ldG9kbyA9PT0gXCJHRVRcIikge1xyXG4gICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgLmZyb20oXCJzb3J0ZW9zXCIpXHJcbiAgICAgIC5zZWxlY3QoXCIqXCIpXHJcbiAgICAgIC5vcmRlcihcImNyZWFkb19lblwiLCB7IGFzY2VuZGluZzogZmFsc2UgfSk7XHJcblxyXG4gICAgaWYgKGVycm9yKSByZXR1cm4gcmVzcG9uZGVyKHsgZXJyb3I6IFwiTm8gc2UgcHVkaWVyb24gY29uc3VsdGFyIGxvcyBzb3J0ZW9zLlwiIH0sIDUwMCk7XHJcbiAgICByZXR1cm4gcmVzcG9uZGVyKGRhdGEpO1xyXG4gIH1cclxuXHJcbmlmIChtZXRvZG8gPT09IFwiUE9TVFwiKSB7XHJcbiAgbGV0IGN1ZXJwbztcclxuICB0cnkgeyBjdWVycG8gPSBhd2FpdCByZXF1ZXN0Lmpzb24oKTsgfSBjYXRjaCB7IHJldHVybiByZXNwb25kZXIoeyBlcnJvcjogXCJKU09OIG5vIHZcdTAwRTFsaWRvLlwiIH0sIDQwMCk7IH1cclxuXHJcbiAgY29uc3QgeyBldmVudG9JZCwgZWplY3V0YXJFbXBhcmVqYW1pZW50byB9ID0gY3VlcnBvO1xyXG4gIGlmICghZXZlbnRvSWQpIHJldHVybiByZXNwb25kZXIoeyBlcnJvcjogXCJEZWJlcyBpbmRpY2FyIGVsIGV2ZW50by5cIiB9LCA0MDApO1xyXG5cclxuICBjb25zdCB7IGRhdGE6IGV4aXN0ZW50ZSB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgIC5mcm9tKFwic29ydGVvc1wiKVxyXG4gICAgLnNlbGVjdChcImlkLCBlc3RhZG9cIilcclxuICAgIC5lcShcImV2ZW50b19pZFwiLCBldmVudG9JZClcclxuICAgIC5tYXliZVNpbmdsZSgpO1xyXG5cclxuICBpZiAoIWVqZWN1dGFyRW1wYXJlamFtaWVudG8pIHtcclxuICAgIGlmIChleGlzdGVudGUpIHJldHVybiByZXNwb25kZXIoZXhpc3RlbnRlLCAyMDApOyBcclxuXHJcbiAgICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAuZnJvbShcInNvcnRlb3NcIilcclxuICAgICAgLmluc2VydCh7IGV2ZW50b19pZDogZXZlbnRvSWQsIGVzdGFkbzogXCJwZW5kaWVudGVcIiB9KVxyXG4gICAgICAuc2VsZWN0KCkuc2luZ2xlKCk7XHJcblxyXG4gICAgaWYgKGVycm9yKSByZXR1cm4gcmVzcG9uZGVyKHsgZXJyb3I6IFwiTm8gc2UgcHVkbyBjcmVhciBlbCBzb3J0ZW8gYmFzZS5cIiB9LCA1MDApO1xyXG4gICAgcmV0dXJuIHJlc3BvbmRlcihkYXRhLCAyMDEpO1xyXG4gIH1cclxuXHJcbiAgbGV0IHNvcnRlb0lkID0gZXhpc3RlbnRlPy5pZDtcclxuICBpZiAoIXNvcnRlb0lkKSB7XHJcbiAgICBjb25zdCB7IGRhdGE6IG51ZXZvU29ydGVvIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAuZnJvbShcInNvcnRlb3NcIilcclxuICAgICAgLmluc2VydCh7IGV2ZW50b19pZDogZXZlbnRvSWQsIGVzdGFkbzogXCJwZW5kaWVudGVcIiB9KVxyXG4gICAgICAuc2VsZWN0KCkuc2luZ2xlKCk7XHJcbiAgICBzb3J0ZW9JZCA9IG51ZXZvU29ydGVvLmlkO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBhd2FpdCBzdXBhYmFzZS5mcm9tKFwiYXNpZ25hY2lvbmVzXCIpLmRlbGV0ZSgpLmVxKFwic29ydGVvX2lkXCIsIHNvcnRlb0lkKTtcclxuICB9XHJcbiAgXHJcbiAgYXdhaXQgc3VwYWJhc2VcclxuICAgIC5mcm9tKFwic29ydGVvc1wiKVxyXG4gICAgLnVwZGF0ZSh7IGVzdGFkbzogXCJwdWJsaWNhZG9cIiwgcHVibGljYWRvX2VuOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgfSlcclxuICAgIC5lcShcImlkXCIsIHNvcnRlb0lkKTtcclxuXHJcbiAgcmV0dXJuIHJlc3BvbmRlcih7IG1lbnNhamU6IFwiU29ydGVvIGdlbmVyYWRvIHkgZ3VhcmRhZG8gZXhpdG9zYW1lbnRlLlwiLCBlc3RhZG86IFwiUHVibGljYWRvXCIgfSk7XHJcbn1cclxuXHJcbiAgcmV0dXJuIHJlc3BvbmRlcih7IGVy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STtBQUFBLEVBQ3ZCO0FBRUYsTUFBSSxXQUFXLFFBQVE7QUFDckIsUUFBSTtBQUNKLFFBQUk7QUFBRSxlQUFTLE1BQU0sUUFBUSxLQUFLO0FBQUEsSUFBRyxRQUFRO0FBQUUsYUFBTyxVQUFVLEVBQUUsT0FBTyxxQkFBa0IsR0FBRyxHQUFHO0FBQUEsSUFBRztBQUVwRyxVQUFNLEVBQUUsVUFBVSx1QkFBdUIsSUFBSTtBQUM3QyxRQUFJLENBQUMsU0FBVSxRQUFPLFVBQVUsRUFBRSxPQUFPLDJCQUEyQixHQUFHLEdBQUc7QUFFMUUsVUFBTSxFQUFFLE1BQU0sVUFBVSxJQUFJLE1BQU0saUJBQy9CLEtBQUssU0FBUyxFQUNkLE9BQU8sWUFBWSxFQUNuQixHQUFHLGFBQWEsUUFBUSxFQUN4QixZQUFZO0FBRWYsUUFBSSxDQUFDLHdCQUF3QjtBQUMzQixVQUFJLFVBQVcsUUFBTyxVQUFVLFdBQVcsR0FBRztBQUU5QyxZQUFNLEVBQUUsTUFBTSxNQUFNLElBQUksTUFBTSxpQkFDM0IsS0FBSyxTQUFTLEVBQ2QsT0FBTyxFQUFFLFdBQVcsVUFBVSxRQUFRLFlBQVksQ0FBQyxFQUNuRCxPQUFPLEVBQUUsT0FBTztBQUVuQixVQUFJLE1BQU8sUUFBTyxVQUFVLEVBQUUsT0FBTyxtQ0FBbUMsR0FBRyxHQUFHO0FBQzlFLGFBQU8sVUFBVSxNQUFNLEdBQUc7QUFBQSxJQUM1QjtBQUVBLFFBQUksV0FBVyxXQUFXO0FBQzFCLFFBQUksQ0FBQyxVQUFVO0FBQ2IsWUFBTSxFQUFFLE1BQU0sWUFBWSxJQUFJLE1BQU0saUJBQ2pDLEtBQUssU0FBUyxFQUNkLE9BQU8sRUFBRSxXQUFXLFVBQVUsUUFBUSxZQUFZLENBQUMsRUFDbkQsT0FBTyxFQUFFLE9BQU87QUFDbkIsaUJBQVcsWUFBWTtBQUFBLElBQ3pCLE9BQU87QUFDTCxZQUFNLGlCQUFTLEtBQUssY0FBYyxFQUFFLE9BQU8sRUFBRSxHQUFHLGFBQWEsUUFBUTtBQUFBLElBQ3ZFO0FBRUEsVUFBTSxpQkFDSCxLQUFLLFNBQVMsRUFDZCxPQUFPLEVBQUUsUUFBUSxhQUFhLGVBQWMsb0JBQUksS0FBSyxHQUFFLFlBQVksRUFBRSxDQUFDLEVBQ3RFLEdBQUcsTUFBTSxRQUFRO0FBRXBCLFdBQU8sVUFBVSxFQUFFLFNBQVMsNENBQTRDLFFBQVEsWUFBWSxDQUFDO0FBQUEsRUFDL0Y7QUFFRSxTQUFPLFVBQVUsRUFBRSxPQUFPLDBCQUF1QixHQUFHLEdBQUc7QUFDekQ7IiwKICAibmFtZXMiOiBbXQp9Cg==
