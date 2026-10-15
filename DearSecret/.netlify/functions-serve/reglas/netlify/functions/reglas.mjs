
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

// netlify/functions/reglas.mjs
function responder(datos, estado = 200) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
var reglas_default = async (request, context) => {
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
    const { data, error } = await supabase_default.from("reglas").select("*").order("creado_en", { ascending: false });
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
      return responder({ error: "El cuerpo JSON no es v\xE1lido." }, 400);
    }
    const { eventoId, tipo, origenId, destinoId } = cuerpo;
    if (!eventoId || !tipo || !origenId || !destinoId) {
      return responder({ error: "Debes completar todos los campos de la regla." }, 400);
    }
    if (!["mutua", "direccional", "manual"].includes(tipo)) {
      return responder({ error: "El tipo de regla no es v\xE1lido." }, 400);
    }
    if (origenId === destinoId) {
      return responder({ error: "Una persona no puede tener una regla consigo misma." }, 400);
    }
    const { data: participaciones, error: errorParticipaciones } = await supabase_default.from("participaciones").select("usuario_id, estado").eq("evento_id", eventoId).in("usuario_id", [origenId, destinoId]);
    if (errorParticipaciones) {
      return responder({ error: "No se pudieron comprobar las participaciones." }, 500);
    }
    const origenValido = participaciones?.some((p) => p.usuario_id === origenId && p.estado === "activo");
    const destinoValido = participaciones?.some((p) => p.usuario_id === destinoId && p.estado === "activo");
    if (!origenValido || !destinoValido) {
      return responder({ error: "Ambas personas deben participar activamente en el evento seleccionado." }, 400);
    }
    const { data, error } = await supabase_default.from("reglas").insert({
      evento_id: eventoId,
      tipo,
      origen_id: origenId,
      destino_id: destinoId
    }).select().single();
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
      return responder({ error: "El cuerpo JSON no es v\xE1lido." }, 400);
    }
    if (!cuerpo.id) {
      return responder({ error: "Debes indicar el ID de la regla." }, 400);
    }
    const { data, error } = await supabase_default.from("reglas").delete().eq("id", cuerpo.id).select().maybeSingle();
    if (error) {
      return responder({ error: "No se pudo eliminar la regla: " + error.message }, 500);
    }
    if (!data) {
      return responder({ error: "No se encontr\xF3 la regla indicada." }, 404);
    }
    return responder({ mensaje: "Regla eliminada correctamente." }, 200);
  }
  return responder({ error: "M\xE9todo no permitido." }, 405);
};
export {
  reglas_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvc3VwYWJhc2UuanMiLCAibmV0bGlmeS9mdW5jdGlvbnMvYXV0aEhlbHBlci5qcyIsICJuZXRsaWZ5L2Z1bmN0aW9ucy9yZWdsYXMubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCI7XHJcblxyXG5jb25zdCBzdXBhYmFzZSA9IGNyZWF0ZUNsaWVudChcclxuICBwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkwsXHJcbiAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9ST0xFX0tFWVxyXG4pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgc3VwYWJhc2U7IiwgIlxyXG5pbXBvcnQgc3VwYWJhc2UgZnJvbSBcIi4vc3VwYWJhc2UuanNcIjtcclxuXHJcbmZ1bmN0aW9uIHJlc3B1ZXN0YUVycm9yKG1lbnNhamUsIGVzdGFkbykge1xyXG4gIHJldHVybiBuZXcgUmVzcG9uc2UoXHJcbiAgICBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBtZW5zYWplIH0pLFxyXG4gICAge1xyXG4gICAgICBzdGF0dXM6IGVzdGFkbyxcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICAgIH1cclxuICAgIH1cclxuICApO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdmVyaWZpY2FyU2VzaW9uKHJlcXVlc3QpIHtcclxuICBjb25zdCBhdXRvcml6YWNpb24gPSByZXF1ZXN0LmhlYWRlcnMuZ2V0KFwiYXV0aG9yaXphdGlvblwiKTtcclxuXHJcbiAgaWYgKCFhdXRvcml6YWNpb24gfHwgIWF1dG9yaXphY2lvbi5zdGFydHNXaXRoKFwiQmVhcmVyIFwiKSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZXJyb3I6IHJlc3B1ZXN0YUVycm9yKFwiRGViZXMgaW5pY2lhciBzZXNpXHUwMEYzbi5cIiwgNDAxKVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHRva2VuID0gYXV0b3JpemFjaW9uLnN1YnN0cmluZyg3KS50cmltKCk7XHJcblxyXG4gIGlmICghdG9rZW4pIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGVycm9yOiByZXNwdWVzdGFFcnJvcihcIlRva2VuIGRlIGFjY2VzbyB2YWNcdTAwRURvLlwiLCA0MDEpXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UuYXV0aC5nZXRVc2VyKHRva2VuKTtcclxuXHJcbiAgaWYgKGVycm9yIHx8ICFkYXRhLnVzZXIpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGVycm9yOiByZXNwdWVzdGFFcnJvcihcIkxhIHNlc2lcdTAwRjNuIG5vIGVzIHZcdTAwRTFsaWRhIG8gaGEgZXhwaXJhZG8uXCIsIDQwMSlcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBjb25zdCB7IGRhdGE6IHBlcmZpbCwgZXJyb3I6IGVycm9yUGVyZmlsIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgLmZyb20oXCJ1c3Vhcmlvc1wiKVxyXG4gICAgLnNlbGVjdChcImlkLCBub21icmUsIHVzZXJuYW1lLCByb2wsIGF1dGhfdXNlcl9pZFwiKVxyXG4gICAgLmVxKFwiYXV0aF91c2VyX2lkXCIsIGRhdGEudXNlci5pZClcclxuICAgIC5tYXliZVNpbmdsZSgpO1xyXG5cclxuICBpZiAoZXJyb3JQZXJmaWwpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGVycm9yOiByZXNwdWVzdGFFcnJvcihcIk5vIHNlIHB1ZG8gdmVyaWZpY2FyIGVsIHBlcmZpbC5cIiwgNTAwKVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGlmICghcGVyZmlsKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBlcnJvcjogcmVzcHVlc3RhRXJyb3IoXCJMYSBjdWVudGEgbm8gdGllbmUgdW4gcGVyZmlsIGFzb2NpYWRvLlwiLCA0MDMpXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHVzZXI6IGRhdGEudXNlcixcclxuICAgIHBlcmZpbFxyXG4gIH07XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2ZXJpZmljYXJBZG1pbmlzdHJhZG9yKHJlcXVlc3QpIHtcclxuICBjb25zdCByZXN1bHRhZG8gPSBhd2FpdCB2ZXJpZmljYXJTZXNpb24ocmVxdWVzdCk7XHJcblxyXG4gIGlmIChyZXN1bHRhZG8uZXJyb3IpIHtcclxuICAgIHJldHVybiByZXN1bHRhZG87XHJcbiAgfVxyXG5cclxuICBpZiAocmVzdWx0YWRvLnBlcmZpbC5yb2wgIT09IFwiYWRtaW5cIikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZXJyb3I6IHJlc3B1ZXN0YUVycm9yKFxyXG4gICAgICAgIFwiTm8gdGllbmVzIHBlcm1pc29zIHBhcmEgcmVhbGl6YXIgZXN0YSBvcGVyYWNpXHUwMEYzbi5cIixcclxuICAgICAgICA0MDNcclxuICAgICAgKVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHJldHVybiByZXN1bHRhZG87XHJcbn0iLCAiaW1wb3J0IHN1cGFiYXNlIGZyb20gXCIuL3N1cGFiYXNlLmpzXCI7XHJcbmltcG9ydCB7IHZlcmlmaWNhclNlc2lvbiwgdmVyaWZpY2FyQWRtaW5pc3RyYWRvciB9IGZyb20gXCIuL2F1dGhIZWxwZXIuanNcIjtcclxuXHJcbmZ1bmN0aW9uIHJlc3BvbmRlcihkYXRvcywgZXN0YWRvID0gMjAwKSB7XHJcbiAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeShkYXRvcyksIHtcclxuICAgIHN0YXR1czogZXN0YWRvLFxyXG4gICAgaGVhZGVyczoge1xyXG4gICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIlxyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhc3luYyAocmVxdWVzdCwgY29udGV4dCkgPT4ge1xyXG4gIGNvbnN0IG1ldG9kbyA9IHJlcXVlc3QubWV0aG9kO1xyXG5cclxuICBpZiAobWV0b2RvID09PSBcIkdFVFwiKSB7XHJcbiAgICBjb25zdCBhY2Nlc28gPSBhd2FpdCB2ZXJpZmljYXJTZXNpb24ocmVxdWVzdCk7XHJcbiAgICBpZiAoYWNjZXNvLmVycm9yKSByZXR1cm4gYWNjZXNvLmVycm9yO1xyXG4gIH0gZWxzZSBpZiAobWV0b2RvID09PSBcIlBPU1RcIiB8fCBtZXRvZG8gPT09IFwiREVMRVRFXCIpIHtcclxuICAgIGNvbnN0IGFjY2VzbyA9IGF3YWl0IHZlcmlmaWNhckFkbWluaXN0cmFkb3IocmVxdWVzdCk7XHJcbiAgICBpZiAoYWNjZXNvLmVycm9yKSByZXR1cm4gYWNjZXNvLmVycm9yO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gcmVzcG9uZGVyKHsgZXJyb3I6IFwiTVx1MDBFOXRvZG8gbm8gcGVybWl0aWRvLlwiIH0sIDQwNSk7XHJcbiAgfVxyXG5cclxuXHJcbiAgaWYgKG1ldG9kbyA9PT0gXCJHRVRcIikge1xyXG4gICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgLmZyb20oXCJyZWdsYXNcIilcclxuICAgICAgLnNlbGVjdChcIipcIilcclxuICAgICAgLm9yZGVyKFwiY3JlYWRvX2VuXCIsIHsgYXNjZW5kaW5nOiBmYWxzZSB9KTtcclxuXHJcbiAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgcmV0dXJuIHJlc3BvbmRlcih7IGVycm9yOiBcIk5vIHNlIHB1ZGllcm9uIGNvbnN1bHRhciBsYXMgcmVnbGFzOiBcIiArIGVycm9yLm1lc3NhZ2UgfSwgNTAwKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzcG9uZGVyKGRhdGEpO1xyXG4gIH1cclxuXHJcblxyXG4gIGlmIChtZXRvZG8gPT09IFwiUE9TVFwiKSB7XHJcbiAgICBsZXQgY3VlcnBvO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY3VlcnBvID0gYXdhaXQgcmVxdWVzdC5qc29uKCk7XHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgcmV0dXJuIHJlc3BvbmRlcih7IGVycm9yOiBcIkVsIGN1ZXJwbyBKU09OIG5vIGVzIHZcdTAwRTFsaWRvLlwiIH0sIDQwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgeyBldmVudG9JZCwgdGlwbywgb3JpZ2VuSWQsIGRlc3Rpbm9JZCB9ID0gY3VlcnBvO1xyXG5cclxuICAgIC8vIFZhbGlkYWNpXHUwMEYzbiBkZSBjYW1wb3Mgb2JsaWdhdG9yaW9zXHJcbiAgICBpZiAoIWV2ZW50b0lkIHx8ICF0aXBvIHx8ICFvcmlnZW5JZCB8fCAhZGVzdGlub0lkKSB7XHJcbiAgICAgIHJldHVybiByZXNwb25kZXIoeyBlcnJvcjogXCJEZWJlcyBjb21wbGV0YXIgdG9kb3MgbG9zIGNhbXBvcyBkZSBsYSByZWdsYS5cIiB9LCA0MDApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghW1wibXV0dWFcIiwgXCJkaXJlY2Npb25hbFwiLCBcIm1hbnVhbFwiXS5pbmNsdWRlcyh0aXBvKSkge1xyXG4gICAgICByZXR1cm4gcmVzcG9uZGVyKHsgZXJyb3I6IFwiRWwgdGlwbyBkZSByZWdsYSBubyBlcyB2XHUwMEUxbGlkby5cIiB9LCA0MDApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvcmlnZW5JZCA9PT0gZGVzdGlub0lkKSB7XHJcbiAgICAgIHJldHVybiByZXNwb25kZXIoeyBlcnJvcjogXCJVbmEgcGVyc29uYSBubyBwdWVkZSB0ZW5lciB1bmEgcmVnbGEgY29uc2lnbyBtaXNtYS5cIiB9LCA0MDApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHsgZGF0YTogcGFydGljaXBhY2lvbmVzLCBlcnJvcjogZXJyb3JQYXJ0aWNpcGFjaW9uZXMgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgIC5mcm9tKFwicGFydGljaXBhY2lvbmVzXCIpXHJcbiAgICAgIC5zZWxlY3QoXCJ1c3VhcmlvX2lkLCBlc3RhZG9cIilcclxuICAgICAgLmVxKFwiZXZlbnRvX2lkXCIsIGV2ZW50b0lkKVxyXG4gICAgICAuaW4oXCJ1c3VhcmlvX2lkXCIsIFtvcmlnZW5JZCwgZGVzdGlub0lkXSk7XHJcblxyXG4gICAgaWYgKGVycm9yUGFydGljaXBhY2lvbmVzKSB7XHJcbiAgICAgIHJldHVybiByZXNwb25kZXIoeyBlcnJvcjogXCJObyBzZSBwdWRpZXJvbiBjb21wcm9iYXIgbGFzIHBhcnRpY2lwYWNpb25lcy5cIiB9LCA1MDApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG9yaWdlblZhbGlkbyA9IHBhcnRpY2lwYWNpb25lcz8uc29tZShwID0+IHAudXN1YXJpb19pZCA9PT0gb3JpZ2VuSWQgJiYgcC5lc3RhZG8gPT09IFwiYWN0aXZvXCIpO1xyXG4gICAgY29uc3QgZGVzdGlub1ZhbGlkbyA9IHBhcnRpY2lwYWNpb25lcz8uc29tZShwID0+IHAudXN1YXJpb19pZCA9PT0gZGVzdGlub0lkICYmIHAuZXN0YWRvID09PSBcImFjdGl2b1wiKTtcclxuXHJcbiAgICBpZiAoIW9yaWdlblZhbGlkbyB8fCAhZGVzdGlub1ZhbGlkbykge1xyXG4gICAgICByZXR1cm4gcmVzcG9uZGVyKHsgZXJyb3I6IFwiQW1iYXMgcGVyc29uYXMgZGViZW4gcGFydGljaXBhciBhY3RpdmFtZW50ZSBlbiBlbCBldmVudG8gc2VsZWNjaW9uYWRvLlwiIH0sIDQwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgLmZyb20oXCJyZWdsYXNcIilcclxuICAgICAgLmluc2VydCh7XHJcbiAgICAgICAgZXZlbnRvX2lkOiBldmVudG9JZCxcclxuICAgICAgICB0aXBvLFxyXG4gICAgICAgIG9yaWdlbl9pZDogb3JpZ2VuSWQsXHJcbiAgICAgICAgZGVzdGlub19pZDogZGVzdGlub0lkXHJcbiAgICAgIH0pXHJcbiAgICAgIC5zZWxlY3QoKVxyXG4gICAgICAuc2luZ2xlKCk7XHJcblxyXG4gICAgaWYgKGVycm9yKSB7XHJcbiAgICAgIHJldHVybiByZXNwb25kZXIoeyBlcnJvcjogXCJObyBzZSBwdWRvIGd1YXJkYXIgbGEgcmVnbGE6IFwiICsgZXJyb3IubWVzc2FnZSB9LCA1MDApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXNwb25kZXIoeyBtZW5zYWplOiBcIlJlZ2xhIGd1YXJkYWRhIGNvcnJlY3RhbWVudGUuXCIsIHJlZ2xhOiBkYXRhIH0sIDIwMSk7XHJcbiAgfVxyXG5cclxuICBpZiAobWV0b2RvID09PSBcIkRFTEVURVwiKSB7XHJcbiAgICBsZXQgY3VlcnBvO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY3VlcnBvID0gYXdhaXQgcmVxdWVzdC5qc29uKCk7XHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgcmV0dXJuIHJlc3BvbmRlcih7IGVycm9yOiBcIkVsIGN1ZXJwbyBKU09OIG5vIGVzIHZcdTAwRTFsaWRvLlwiIH0sIDQwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFjdWVycG8uaWQpIHtcclxuICAgICAgcmV0dXJuIHJlc3BvbmRlcih7IGVycm9yOiBcIkRlYmVzIGluZGljYXIgZWwgSUQgZGUgbGEgcmVnbGEuXCIgfSwgNDAwKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAuZnJvbShcInJlZ2xhc1wiKVxyXG4gICAgICAuZGVsZXRlKClcclxuICAgICAgLmVxKFwiaWRcIiwgY3VlcnBvLmlkKVxyXG4gICAgICAuc2VsZWN0KClcclxuICAgICAgLm1heWJlU2luZ2xlKCk7XHJcblxyXG4gICAgaWYgKGVycm9yKSB7XHJcbiAgICAgIHJldHVybiByZXNwb25kZXIoeyBlcnJvcjogXCJObyBzZSBwdWRvIGVsaW1pbmFyIGxhIHJlZ2xhOiBcIiArIGVycm9yLm1lc3NhZ2UgfSwgNTAwKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIWRhdGEpIHtcclxuICAgICAgcmV0dXJuIHJlc3BvbmRlcih7IGVycm9yOiBcIk5vIHNlIGVuY29udHJcdTAwRjMgbGEgcmVnbGEgaW5kaWNhZGEuXCIgfSwgNDA0KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzcG9uZGVyKHsgbWVuc2FqZTogXCJSZWdsYSBlbGltaW5hZGEgY29ycmVjdGFtZW50ZS5cIiB9LCAyMDApO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJlc3BvbmRlcih7IGVycm9yOiBcIk1cdTAwRTl0b2RvIG5vIHBlcm1pdGlkby5cIiB9LCA0MDUpO1xyXG59O1xyXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7O0FBQUEsU0FBUyxvQkFBb0I7QUFFN0IsSUFBTSxXQUFXO0FBQUEsRUFDZixRQUFRLElBQUk7QUFBQSxFQUNaLFFBQVEsSUFBSTtBQUNkO0FBRUEsSUFBTyxtQkFBUTs7O0FDSmYsU0FBUyxlQUFlLFNBQVMsUUFBUTtBQUN2QyxTQUFPLElBQUk7QUFBQSxJQUNULEtBQUssVUFBVSxFQUFFLE9BQU8sUUFBUSxDQUFDO0FBQUEsSUFDakM7QUFBQSxNQUNFLFFBQVE7QUFBQSxNQUNSLFNBQVM7QUFBQSxRQUNQLGdCQUFnQjtBQUFBLE1BQ2xCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRjtBQUVBLGVBQXNCLGdCQUFnQixTQUFTO0FBQzdDLFFBQU0sZUFBZSxRQUFRLFFBQVEsSUFBSSxlQUFlO0FBRXhELE1BQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLFdBQVcsU0FBUyxHQUFHO0FBQ3hELFdBQU87QUFBQSxNQUNMLE9BQU8sZUFBZSw0QkFBeUIsR0FBRztBQUFBLElBQ3BEO0FBQUEsRUFDRjtBQUVBLFFBQU0sUUFBUSxhQUFhLFVBQVUsQ0FBQyxFQUFFLEtBQUs7QUFFN0MsTUFBSSxDQUFDLE9BQU87QUFDVixXQUFPO0FBQUEsTUFDTCxPQUFPLGVBQWUsNkJBQTBCLEdBQUc7QUFBQSxJQUNyRDtBQUFBLEVBQ0Y7QUFFQSxRQUFNLEVBQUUsTUFB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
