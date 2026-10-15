
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

// netlify/functions/asignaciones.js
function responder(datos, estado = 200) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
var asignaciones_default = async (request, context) => {
  const metodo = request.method;
  if (metodo === "GET") {
    const acceso = await verificarSesion(request);
    if (acceso.error) return acceso.error;
  } else if (metodo === "POST" || metodo === "DELETE") {
    const acceso = await verificarAdministrador(request);
    if (acceso.error) return acceso.error;
  } else {
    return responder({ error: "M\xE9todo no permitido." }, 405);
  }
  if (metodo === "GET") {
    const url = new URL(request.url);
    const sorteoId = url.searchParams.get("sorteoId");
    const participanteId = url.searchParams.get("participanteId");
    const eventoId = url.searchParams.get("eventoId");
    if (participanteId && eventoId) {
      try {
        const { data: sorteo, error: errorSorteo } = await supabase_default.from("sorteos").select("id").eq("evento_id", eventoId).eq("estado", "publicado").maybeSingle();
        if (errorSorteo || !sorteo) {
          return responder({ mensaje: "El sorteo a\xFAn no ha sido publicado." }, 200);
        }
        const { data: asignacion, error: errorAsig } = await supabase_default.from("asignaciones").select(`
            id,
            destinatario:usuarios!asignaciones_destinatario_id_fkey (
              id,
              nombre,
              participaciones (
                id,
                evento_id,
                wishlists (
                  descripcion,
                  regalo
                )
              )
            )
          `).eq("sorteo_id", sorteo.id).eq("participante_id", participanteId).maybeSingle();
        if (errorAsig || !asignacion) {
          return responder({ mensaje: "No cuentas con asignaciones oficiales." }, 200);
        }
        const perfilDestinatario = asignacion.destinatario;
        const partEvento = perfilDestinatario.participaciones?.find(
          (p) => String(p.evento_id) === String(eventoId)
        );
        let contenidoWishlist = "";
        if (partEvento && partEvento.wishlists) {
          const wl = Array.isArray(partEvento.wishlists) ? partEvento.wishlists[0] : partEvento.wishlists;
          contenidoWishlist = wl?.descripcion || wl?.regalo || "";
        }
        return responder({
          destinatario_nombre: perfilDestinatario.nombre,
          destinatario_wishlist: contenidoWishlist || "Esta persona a\xFAn no ha detallado sus gustos en su Wishlist. \xA1Sorpr\xE9ndela!"
        }, 200);
      } catch (err) {
        return responder({ error: "Error interno: " + err.message }, 500);
      }
    }
    let consulta = supabase_default.from("asignaciones").select("*");
    if (sorteoId) {
      consulta = consulta.eq("sorteo_id", sorteoId);
    }
    const { data, error } = await consulta;
    if (error) {
      return responder({ error: "No se pudieron consultar las asignaciones." }, 500);
    }
    return responder(data);
  }
  if (metodo === "POST") {
    let cuerpo;
    try {
      cuerpo = await request.json();
    } catch {
      return responder({ error: "El cuerpo JSON no es v\xE1lido." }, 400);
    }
    const { sorteoId, participanteId, destinatarioId } = cuerpo;
    if (!sorteoId || !participanteId || !destinatarioId) {
      return responder({ error: "Debes indicar el sorteo, el participante y el destinatario." }, 400);
    }
    if (participanteId === destinatarioId) {
      return responder({ error: "Una persona no puede ser su propio amigo secreto." }, 400);
    }
    const { data: sorteo, error: errorSorteo } = await supabase_default.from("sorteos").select("id, evento_id, estado").eq("id", sorteoId).maybeSingle();
    if (errorSorteo || !sorteo) return responder({ error: "El sorteo no existe." }, 404);
    if (sorteo.estado === "publicado" || sorteo.estado === "cancelado") {
      return responder({ error: "No puedes modificar las asignaciones de este sorteo." }, 409);
    }
    const { data: participantes, error: errorParticipantes } = await supabase_default.from("participaciones").select("usuario_id, estado").eq("evento_id", sorteo.evento_id).in("usuario_id", [participanteId, destinatarioId]);
    if (errorParticipantes) return responder({ error: "No se pudieron comprobar los participantes." }, 500);
    const participanteValido = participantes?.some((p) => p.usuario_id === participanteId && p.estado === "activo");
    const destinatarioValido = participantes?.some((p) => p.usuario_id === destinatarioId && p.estado === "activo");
    if (!participanteValido || !destinatarioValido) {
      return responder({ error: "Ambas personas deben tener una participaci\xF3n activa en el evento." }, 400);
    }
    const { data, error } = await supabase_default.from("asignaciones").insert({ sorteo_id: sorteoId, participante_id: participanteId, destinatario_id: destinatarioId }).select().single();
    if (error) {
      if (error.code === "23505") {
        return responder({ error: "El participante ya tiene una asignaci\xF3n o el destinatario ya fue asignado en este sorteo." }, 409);
      }
      return responder({ error: "No se pudo guardar la asignaci\xF3n: " + error.message }, 500);
    }
    return responder({ mensaje: "Asignaci\xF3n guardada correctamente.", asignacion: data }, 201);
  }
  return responder({ error: "M\xE9todo no permitido." }, 405);
};
export {
  asignaciones_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvc3VwYWJhc2UuanMiLCAibmV0bGlmeS9mdW5jdGlvbnMvYXV0aEhlbHBlci5qcyIsICJuZXRsaWZ5L2Z1bmN0aW9ucy9hc2lnbmFjaW9uZXMuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gXCJAc3VwYWJhc2Uvc3VwYWJhc2UtanNcIjtcclxuXHJcbmNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KFxyXG4gIHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTCxcclxuICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZXHJcbik7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzdXBhYmFzZTsiLCAiXHJcbmltcG9ydCBzdXBhYmFzZSBmcm9tIFwiLi9zdXBhYmFzZS5qc1wiO1xyXG5cclxuZnVuY3Rpb24gcmVzcHVlc3RhRXJyb3IobWVuc2FqZSwgZXN0YWRvKSB7XHJcbiAgcmV0dXJuIG5ldyBSZXNwb25zZShcclxuICAgIEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IG1lbnNhamUgfSksXHJcbiAgICB7XHJcbiAgICAgIHN0YXR1czogZXN0YWRvLFxyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2ZXJpZmljYXJTZXNpb24ocmVxdWVzdCkge1xyXG4gIGNvbnN0IGF1dG9yaXphY2lvbiA9IHJlcXVlc3QuaGVhZGVycy5nZXQoXCJhdXRob3JpemF0aW9uXCIpO1xyXG5cclxuICBpZiAoIWF1dG9yaXphY2lvbiB8fCAhYXV0b3JpemFjaW9uLnN0YXJ0c1dpdGgoXCJCZWFyZXIgXCIpKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBlcnJvcjogcmVzcHVlc3RhRXJyb3IoXCJEZWJlcyBpbmljaWFyIHNlc2lcdTAwRjNuLlwiLCA0MDEpXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgY29uc3QgdG9rZW4gPSBhdXRvcml6YWNpb24uc3Vic3RyaW5nKDcpLnRyaW0oKTtcclxuXHJcbiAgaWYgKCF0b2tlbikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZXJyb3I6IHJlc3B1ZXN0YUVycm9yKFwiVG9rZW4gZGUgYWNjZXNvIHZhY1x1MDBFRG8uXCIsIDQwMSlcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5hdXRoLmdldFVzZXIodG9rZW4pO1xyXG5cclxuICBpZiAoZXJyb3IgfHwgIWRhdGEudXNlcikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZXJyb3I6IHJlc3B1ZXN0YUVycm9yKFwiTGEgc2VzaVx1MDBGM24gbm8gZXMgdlx1MDBFMWxpZGEgbyBoYSBleHBpcmFkby5cIiwgNDAxKVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHsgZGF0YTogcGVyZmlsLCBlcnJvcjogZXJyb3JQZXJmaWwgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAuZnJvbShcInVzdWFyaW9zXCIpXHJcbiAgICAuc2VsZWN0KFwiaWQsIG5vbWJyZSwgdXNlcm5hbWUsIHJvbCwgYXV0aF91c2VyX2lkXCIpXHJcbiAgICAuZXEoXCJhdXRoX3VzZXJfaWRcIiwgZGF0YS51c2VyLmlkKVxyXG4gICAgLm1heWJlU2luZ2xlKCk7XHJcblxyXG4gIGlmIChlcnJvclBlcmZpbCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZXJyb3I6IHJlc3B1ZXN0YUVycm9yKFwiTm8gc2UgcHVkbyB2ZXJpZmljYXIgZWwgcGVyZmlsLlwiLCA1MDApXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgaWYgKCFwZXJmaWwpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGVycm9yOiByZXNwdWVzdGFFcnJvcihcIkxhIGN1ZW50YSBubyB0aWVuZSB1biBwZXJmaWwgYXNvY2lhZG8uXCIsIDQwMylcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgdXNlcjogZGF0YS51c2VyLFxyXG4gICAgcGVyZmlsXHJcbiAgfTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHZlcmlmaWNhckFkbWluaXN0cmFkb3IocmVxdWVzdCkge1xyXG4gIGNvbnN0IHJlc3VsdGFkbyA9IGF3YWl0IHZlcmlmaWNhclNlc2lvbihyZXF1ZXN0KTtcclxuXHJcbiAgaWYgKHJlc3VsdGFkby5lcnJvcikge1xyXG4gICAgcmV0dXJuIHJlc3VsdGFkbztcclxuICB9XHJcblxyXG4gIGlmIChyZXN1bHRhZG8ucGVyZmlsLnJvbCAhPT0gXCJhZG1pblwiKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBlcnJvcjogcmVzcHVlc3RhRXJyb3IoXHJcbiAgICAgICAgXCJObyB0aWVuZXMgcGVybWlzb3MgcGFyYSByZWFsaXphciBlc3RhIG9wZXJhY2lcdTAwRjNuLlwiLFxyXG4gICAgICAgIDQwM1xyXG4gICAgICApXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJlc3VsdGFkbztcclxufSIsICJpbXBvcnQgc3VwYWJhc2UgZnJvbSBcIi4vc3VwYWJhc2UuanNcIjtcclxuaW1wb3J0IHsgdmVyaWZpY2FyU2VzaW9uLCB2ZXJpZmljYXJBZG1pbmlzdHJhZG9yIH0gZnJvbSBcIi4vYXV0aEhlbHBlci5qc1wiO1xyXG5cclxuZnVuY3Rpb24gcmVzcG9uZGVyKGRhdG9zLCBlc3RhZG8gPSAyMDApIHtcclxuICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KGRhdG9zKSwge1xyXG4gICAgc3RhdHVzOiBlc3RhZG8sXHJcbiAgICBoZWFkZXJzOiB7XHJcbiAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIChyZXF1ZXN0LCBjb250ZXh0KSA9PiB7XHJcbiAgY29uc3QgbWV0b2RvID0gcmVxdWVzdC5tZXRob2Q7XHJcblxyXG4gIC8vIENvbnRyb2wgZGUgYXV0b3JpemFjaVx1MDBGM24gc2VnXHUwMEZBbiBlbCBtXHUwMEU5dG9kb1xyXG4gIGlmIChtZXRvZG8gPT09IFwiR0VUXCIpIHtcclxuICAgIGNvbnN0IGFjY2VzbyA9IGF3YWl0IHZlcmlmaWNhclNlc2lvbihyZXF1ZXN0KTtcclxuICAgIGlmIChhY2Nlc28uZXJyb3IpIHJldHVybiBhY2Nlc28uZXJyb3I7XHJcbiAgfSBlbHNlIGlmIChtZXRvZG8gPT09IFwiUE9TVFwiIHx8IG1ldG9kbyA9PT0gXCJERUxFVEVcIikge1xyXG4gICAgY29uc3QgYWNjZXNvID0gYXdhaXQgdmVyaWZpY2FyQWRtaW5pc3RyYWRvcihyZXF1ZXN0KTtcclxuICAgIGlmIChhY2Nlc28uZXJyb3IpIHJldHVybiBhY2Nlc28uZXJyb3I7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiByZXNwb25kZXIoeyBlcnJvcjogXCJNXHUwMEU5dG9kbyBubyBwZXJtaXRpZG8uXCIgfSwgNDA1KTtcclxuICB9XHJcblxyXG4gIGlmIChtZXRvZG8gPT09IFwiR0VUXCIpIHtcclxuICAgIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxdWVzdC51cmwpO1xyXG4gICAgY29uc3Qgc29ydGVvSWQgPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcInNvcnRlb0lkXCIpO1xyXG4gICAgY29uc3QgcGFydGljaXBhbnRlSWQgPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcInBhcnRpY2lwYW50ZUlkXCIpO1xyXG4gICAgY29uc3QgZXZlbnRvSWQgPSB1cmwuc2VhcmNoUGFyYW1zLmdldChcImV2ZW50b0lkXCIpO1xyXG5cclxuICAgIGlmIChwYXJ0aWNpcGFudGVJZCAmJiBldmVudG9JZCkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHsgZGF0YTogc29ydGVvLCBlcnJvcjogZXJyb3JTb3J0ZW8gfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgICAgICAuZnJvbShcInNvcnRlb3NcIilcclxuICAgICAgICAgIC5zZWxlY3QoXCJpZFwiKVxyXG4gICAgICAgICAgLmVxKFwiZXZlbnRvX2lkXCIsIGV2ZW50b0lkKVxyXG4gICAgICAgICAgLmVxKFwiZXN0YWRvXCIsIFwicHVibGljYWRvXCIpXHJcbiAgICAgICAgICAubWF5YmVTaW5nbGUoKTtcclxuXHJcbiAgICAgICAgaWYgKGVycm9yU29ydGVvIHx8ICFzb3J0ZW8pIHtcclxuICAgICAgICAgIHJldHVybiByZXNwb25kZXIoeyBtZW5zYWplOiBcIkVsIHNvcnRlbyBhXHUwMEZBbiBubyBoYSBzaWRvIHB1YmxpY2Fkby5cIiB9LCAyMDApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgeyBkYXRhOiBhc2lnbmFjaW9uLCBlcnJvcjogZXJyb3JBc2lnIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAgICAgLmZyb20oXCJhc2lnbmFjaW9uZXNcIilcclxuICAgICAgICAgIC5zZWxlY3QoYFxyXG4gICAgICAgICAgICBpZCxcclxuICAgICAgICAgICAgZGVzdGluYXRhcmlvOnVzdWFyaW9zIWFzaWduYWNpb25lc19kZXN0aW5hdGFyaW9faWRfZmtleSAoXHJcbiAgICAgICAgICAgICAgaWQsXHJcbiAgICAgICAgICAgICAgbm9tYnJlLFxyXG4gICAgICAgICAgICAgIHBhcnRpY2lwYWNpb25lcyAoXHJcbiAgICAgICAgICAgICAgICBpZCxcclxuICAgICAgICAgICAgICAgIGV2ZW50b19pZCxcclxuICAgICAgICAgICAgICAgIHdpc2hsaXN0cyAoXHJcbiAgICAgICAgICAgICAgICAgIGRlc2NyaXBjaW9uLFxyXG4gICAgICAgICAgICAgICAgICByZWdhbG9cclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgIGApXHJcbiAgICAgICAgICAuZXEoXCJzb3J0ZW9faWRcIiwgc29ydGVvLmlkKVxyXG4gICAgICAgICAgLmVxKFwicGFydGljaXBhbnRlX2lkXCIsIHBhcnRpY2lwYW50ZUlkKVxyXG4gICAgICAgICAgLm1heWJlU2luZ2xlKCk7XHJcblxyXG4gICAgICAgIGlmIChlcnJvckFzaWcgfHwgIWFzaWduYWNpb24pIHtcclxuICAgICAgICAgIHJldHVybiByZXNwb25kZXIoeyBtZW5zYWplOiBcIk5vIGN1ZW50YXMgY29uIGFzaWduYWNpb25lcyBvZmljaWFsZXMuXCIgfSwgMjAwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHBlcmZpbERlc3RpbmF0YXJpbyA9IGFzaWduYWNpb24uZGVzdGluYXRhcmlvO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnN0IHBhcnRFdmVudG8gPSBwZXJmaWxEZXN0aW5hdGFyaW8ucGFydGljaXBhY2lvbmVzPy5maW5kKFxyXG4gICAgICAgICAgKHApID0+IFN0cmluZyhwLmV2ZW50b19pZCkgPT09IFN0cmluZyhldmVudG9JZClcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBsZXQgY29udGVuaWRvV2lzaGxpc3QgPSBcIlwiO1xyXG4gICAgICAgIGlmIChwYXJ0RXZlbnRvICYmIHBhcnRFdmVudG8ud2lzaGxpc3RzKSB7XHJcbiAgICAgICAgICBjb25zdCB3bCA9IEFycmF5LmlzQXJyYXkocGFydEV2ZW50by53aXNobGlzdHMpID8gcGFydEV2ZW50by53aXNobGlzdHNbMF0gOiBwYXJ0RXZlbnRvLndpc2hsaXN0cztcclxuICAgICAgICAgIGNvbnRlbmlkb1dpc2hsaXN0ID0gd2w/LmRlc2NyaXBjaW9uIHx8IHdsPy5yZWdhbG8gfHwgXCJcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXNwb25kZXIoe1xyXG4gICAgICAgICAgZGVzdGluYXRhcmlvX25vbWJyZTogcGVyZmlsRGVzdGluYXRhcmlvLm5vbWJyZSxcclxuICAgICAgICAgIGRlc3RpbmF0YXJpb193aXNobGlzdDogY29udGVuaWRvV2lzaGxpc3QgfHwgXCJFc3RhIHBlcnNvbmEgYVx1MDBGQW4gbm8gaGEgZGV0YWxsYWRvIHN1cyBndXN0b3MgZW4gc3UgV2lzaGxpc3QuIFx1MDBBMVNvcnByXHUwMEU5bmRlbGEhXCJcclxuICAgICAgICB9LCAyMDApO1xyXG5cclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlc3BvbmRlcih7IGVycm9yOiBcIkVycm9yIGludGVybm86IFwiICsgZXJyLm1lc3NhZ2UgfSwgNTAwKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGxldCBjb25zdWx0YSA9IHN1cGFiYXNlLmZyb20oXCJhc2lnbmFjaW9uZXNcIikuc2VsZWN0KFwiKlwiKTtcclxuXHJcbiAgICBpZiAoc29ydGVvSWQpIHtcclxuICAgICAgY29uc3VsdGEgPSBjb25zdWx0YS5lcShcInNvcnRlb19pZFwiLCBzb3J0ZW9JZCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgY29uc3VsdGE7XHJcblxyXG4gICAgaWYgKGVycm9yKSB7XHJcbiAgICAgIHJldHVybiByZXNwb25kZXIoeyBlcnJvcjogXCJObyBzZSBwdWRpZXJvbiBjb25zdWx0YXIgbGFzIGFzaWduYWNpb25lcy5cIiB9LCA1MDApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXNwb25kZXIoZGF0YSk7XHJcbiAgfVxyXG5cclxuICBpZiAobWV0b2RvID09PSBcIlBPU1RcIikge1xyXG4gICAgbGV0IGN1ZXJwbztcclxuICAgIHRyeSB7IGN1ZXJwbyA9IGF3YWl0IHJlcXVlc3QuanNvbigpOyB9IGNhdGNoIHsgcmV0dXJuIHJlc3BvbmRlcih7IGVycm9yOiBcIkVsIGN1ZXJwbyBKU09OIG5vIGVzIHZcdTAwRTFsaWRvLlwiIH0sIDQwMCk7IH1cclxuXHJcbiAgICBjb25zdCB7IHNvcnRlb0lkLCBwYXJ0aWNpcGFudGVJZCwgZGVzdGluYXRhcmlvSWQgfSA9IGN1ZXJwbztcclxuXHJcbiAgICBpZiAoIXNvcnRlb0lkIHx8ICFwYXJ0aWNpcGFudGVJZCB8fCAhZGVzdGluYXRhcmlvSWQpIHtcclxuICAgICAgcmV0dXJuIHJlc3BvbmRlcih7IGVycm9yOiBcIkRlYmVzIGluZGljYXIgZWwgc29ydGVvLCBlbCBwYXJ0aWNpcGFudGUgeSBlbCBkZXN0aW5hdGFyaW8uXCIgfSwgNDAwKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAocGFydGljaXBhbnRlSWQgPT09IGRlc3RpbmF0YXJpb0lkKSB7XHJcbiAgICAgIHJldHVybiByZXNwb25kZXIoeyBlcnJvcjogXCJVbmEgcGVyc29uYSBubyBwdWVkZSBzZXIgc3UgcHJvcGlvIGFtaWdvIHNlY3JldG8uXCIgfSwgNDAwKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB7IGRhdGE6IHNvcnRlbywgZXJyb3I6IGVycm9yU29ydGVvIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAuZnJvbShcInNvcnRlb3NcIilcclxuICAgICAgLnNlbGVjdChcImlkLCBldmVudG9faWQsIGVzdGFkb1wiKVxyXG4gICAgICAuZXEoXCJpZFwiLCBzb3J0ZW9JZClcclxuICAgICAgLm1heWJlU2luZ2xlKCk7XHJcblxyXG4gICAgaWYgKGVycm9yU29ydGVvIHx8ICFzb3J0ZW8pIHJldHVybiByZXNwb25kZXIoeyBlcnJvcjogXCJFbCBzb3J0ZW8gbm8gZXhpc3RlLlwiIH0sIDQwNCk7XHJcbiAgICBpZiAoc29ydGVvLmVzdGFkbyA9PT0gXCJwdWJsaWNhZG9cIiB8fCBzb3J0ZW8uZXN0YWRvID09PSBcImNhbmNlbGFkb1wiKSB7XHJcbiAgICAgIHJldHVybiByZXNwb25kZXIoeyBlcnJvcjogXCJObyBwdWVkZXMgbW9kaWZpY2FyIGxhcyBhc2lnbmFjaW9uZXMgZGUgZXN0ZSBzb3J0ZW8uXCIgfSwgNDA5KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB7IGRhdGE6IHBhcnRpY2lwYW50ZXMsIGVycm9yOiBlcnJvclBhcnRpY2lwYW50ZXMgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgIC5mcm9tKFwicGFydGljaXBhY2lvbmVzXCIpXHJcbiAgICAgIC5zZWxlY3QoXCJ1c3VhcmlvX2lkLCBlc3RhZG9cIilcclxuICAgICAgLmVxKFwiZXZlbnRvX2lkXCIsIHNvcnRlby5ldmVudG9faWQpXHJcbiAgICAgIC5pbihcInVzdWFyaW9faWRcIiwgW3BhcnRpY2lwYW50ZUlkLCBkZXN0aW5hdGFyaW9JZF0pO1xyXG5cclxuICAgIGlmIChlcnJvclBhcnRpY2lwYW50ZXMpIHJldHVybiByZXNwb25kZXIoeyBlcnJvcjogXCJObyBzZSBwdWRpZXJvbiBjb21wcm9iYXIgbG9zIHBhcnRpY2lwYW50ZXMuXCIgfSwgNTAwKTtcclxuXHJcbiAgICBjb25zdCBwYXJ0aWNpcGFudGVWYWxpZG8gPSBwYXJ0aWNpcGFudGVzPy5zb21lKHAgPT4gcC51c3VhcmlvX2lkID09PSBwYXJ0aWNpcGFudGVJZCAmJiBwLmVzdGFkbyA9PT0gXCJhY3Rpdm9cIik7XHJcbiAgICBjb25zdCBkZXN0aW5hdGFyaW9WYWxpZG8gPSBwYXJ0aWNpcGFudGVzPy5zb21lKHAgPT4gcC51c3VhcmlvX2lkID09PSBkZXN0aW5hdGFyaW9JZCAmJiBwLmVzdGFkbyA9PT0gXCJhY3Rpdm9cIik7XHJcblxyXG4gICAgaWYgKCFwYXJ0aWNpcGFudGVWYWxpZG8gfHwgIWRlc3RpbmF0YXJpb1ZhbGlkbykge1xyXG4gICAgICByZXR1cm4gcmVzcG9uZGVyKHsgZXJyb3I6IFwiQW1iYXMgcGVyc29uYXMgZGViZW4gdGVuZXIgdW5hIHBhcnRpY2lwYWNpXHUwMEYzbiBhY3RpdmEgZW4gZWwgZXZlbnRvLlwiIH0sIDQwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgLmZyb20oXCJhc2lnbmFjaW9uZXNcIilcclxuICAgICAgLmluc2VydCh7IHNvcnRlb19pZDogc29ydGVvSWQsIHBhcnRpY2lwYW50ZV9pZDogcGFydGljaXBhbnRlSWQsIGRlc3RpbmF0YXJpb19pZDogZGVzdGluYXRhcmlvSWQgfSlcclxuICAgICAgLnNlbGVjdCgpLnNpbmdsZSgpO1xyXG5cclxuICAgIGlmIChlcnJvcikge1xyXG4gICAgICBpZiAoZXJyb3IuY29kZSA9PT0gXCIyMzUwNVwiKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlc3BvbmRlcih7IGVycm9yOiBcIkVsIHBhcnRpY2lwYW50ZSB5YSB0aWVuZSB1bmEgYXNpZ25hY2lcdTAwRjNuIG8gZWwgZGVzdGluYXRhcmlvIHlhIGZ1ZSBhc2lnbmFkbyBlbiBlc3RlIHNvcnRlby5cIiB9LCA0MDkpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiByZXNwb25kZXIoeyBlcnJvcjogXCJObyBzZSBwdWRvIGd1YXJkYXIgbGEgYXNpZ25hY2lcdTAwRjNuOiBcIiArIGVycm9yLm1lc3NhZ2UgfSwgNTAwKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzcG9uZGVyKHsgbWVuc2FqZTogXCJBc2lnbmFjaVx1MDBGM24gZ3VhcmRhZGEgY29ycmVjdGFtZW50ZS5cIiwgYXNpZ25hY2lvbjogZGF0YSB9LCAyMDEpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJlc3BvbmRlcih7IGVycm9yOiBcIk1cdTAwRTl0b2RvIG5vIHBlcm1pdGlkby5cIiB9LCA0MDUpO1xyXG59O1xyXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7O0FBQUEsU0FBUyxvQkFBb0I7QUFFN0IsSUFBTSxXQUFXO0FBQUEsRUFDZixRQUFRLElBQUk7QUFBQSxFQUNaLFFBQVEsSUFBSTtBQUNkO0FBRUEsSUFBTyxtQkFBUTs7O0FDSmYsU0FBUyxlQUFlLFNBQVMsUUFBUTtBQUN2QyxTQUFPLElBQUk7QUFBQSxJQUNULEtBQUssVUFBVSxFQUFFLE9BQU8sUUFBUSxDQUFDO0FBQUEsSUFDakM7QUFBQSxNQUNFLFFBQVE7QUFBQSxNQUNSLFNBQVM7QUFBQSxRQUNQLGdC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
