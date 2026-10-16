
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

// netlify/functions/eventos.js
var eventos_default = async (request, context) => {
  const metodo = request.method;
  if (request.method === "GET") {
    const acceso = await verificarSesion(request);
    if (acceso.error) {
      return acceso.error;
    }
  } else if (request.method === "POST") {
    const acceso = await verificarAdministrador(request);
    if (acceso.error) {
      return acceso.error;
    }
  } else {
    return new Response(
      JSON.stringify({ error: "M\xE9todo no permitido." }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  if (metodo === "GET") {
    const { data, error } = await supabase_default.from("eventos").select("*").order("creado_en", { ascending: false });
    if (error) {
      return new Response(
        JSON.stringify({
          error: error.message
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
  if (metodo === "POST" || metodo === "PUT") {
    const datos = await request.json();
    const datosEvento = {
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      fecha: datos.fecha,
      presupuesto_min: datos.minimo,
      presupuesto_max: datos.maximo,
      estado: datos.estado || "Preparaci\xF3n"
    };
    if (datos.id) {
      datosEvento.id = datos.id;
    }
    const { data, error } = await supabase_default.from("eventos").upsert(datosEvento, { onConflict: "id" }).select().single();
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(data), {
      status: datos.id ? 200 : 201,
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(
    JSON.stringify({
      mensaje: "M\xE9todo no permitido"
    }),
    {
      status: 405,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
};
export {
  eventos_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvc3VwYWJhc2UuanMiLCAibmV0bGlmeS9mdW5jdGlvbnMvYXV0aEhlbHBlci5qcyIsICJuZXRsaWZ5L2Z1bmN0aW9ucy9ldmVudG9zLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCI7XHJcblxyXG5jb25zdCBzdXBhYmFzZSA9IGNyZWF0ZUNsaWVudChcclxuICBwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkwsXHJcbiAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9ST0xFX0tFWVxyXG4pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgc3VwYWJhc2U7IiwgIlxyXG5pbXBvcnQgc3VwYWJhc2UgZnJvbSBcIi4vc3VwYWJhc2UuanNcIjtcclxuXHJcbmZ1bmN0aW9uIHJlc3B1ZXN0YUVycm9yKG1lbnNhamUsIGVzdGFkbykge1xyXG4gIHJldHVybiBuZXcgUmVzcG9uc2UoXHJcbiAgICBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBtZW5zYWplIH0pLFxyXG4gICAge1xyXG4gICAgICBzdGF0dXM6IGVzdGFkbyxcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICAgIH1cclxuICAgIH1cclxuICApO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdmVyaWZpY2FyU2VzaW9uKHJlcXVlc3QpIHtcclxuICBjb25zdCBhdXRvcml6YWNpb24gPSByZXF1ZXN0LmhlYWRlcnMuZ2V0KFwiYXV0aG9yaXphdGlvblwiKTtcclxuXHJcbiAgaWYgKCFhdXRvcml6YWNpb24gfHwgIWF1dG9yaXphY2lvbi5zdGFydHNXaXRoKFwiQmVhcmVyIFwiKSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZXJyb3I6IHJlc3B1ZXN0YUVycm9yKFwiRGViZXMgaW5pY2lhciBzZXNpXHUwMEYzbi5cIiwgNDAxKVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHRva2VuID0gYXV0b3JpemFjaW9uLnN1YnN0cmluZyg3KS50cmltKCk7XHJcblxyXG4gIGlmICghdG9rZW4pIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGVycm9yOiByZXNwdWVzdGFFcnJvcihcIlRva2VuIGRlIGFjY2VzbyB2YWNcdTAwRURvLlwiLCA0MDEpXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UuYXV0aC5nZXRVc2VyKHRva2VuKTtcclxuXHJcbiAgaWYgKGVycm9yIHx8ICFkYXRhLnVzZXIpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGVycm9yOiByZXNwdWVzdGFFcnJvcihcIkxhIHNlc2lcdTAwRjNuIG5vIGVzIHZcdTAwRTFsaWRhIG8gaGEgZXhwaXJhZG8uXCIsIDQwMSlcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBjb25zdCB7IGRhdGE6IHBlcmZpbCwgZXJyb3I6IGVycm9yUGVyZmlsIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgLmZyb20oXCJ1c3Vhcmlvc1wiKVxyXG4gICAgLnNlbGVjdChcImlkLCBub21icmUsIHVzZXJuYW1lLCByb2wsIGF1dGhfdXNlcl9pZFwiKVxyXG4gICAgLmVxKFwiYXV0aF91c2VyX2lkXCIsIGRhdGEudXNlci5pZClcclxuICAgIC5tYXliZVNpbmdsZSgpO1xyXG5cclxuICBpZiAoZXJyb3JQZXJmaWwpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGVycm9yOiByZXNwdWVzdGFFcnJvcihcIk5vIHNlIHB1ZG8gdmVyaWZpY2FyIGVsIHBlcmZpbC5cIiwgNTAwKVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGlmICghcGVyZmlsKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBlcnJvcjogcmVzcHVlc3RhRXJyb3IoXCJMYSBjdWVudGEgbm8gdGllbmUgdW4gcGVyZmlsIGFzb2NpYWRvLlwiLCA0MDMpXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHVzZXI6IGRhdGEudXNlcixcclxuICAgIHBlcmZpbFxyXG4gIH07XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2ZXJpZmljYXJBZG1pbmlzdHJhZG9yKHJlcXVlc3QpIHtcclxuICBjb25zdCByZXN1bHRhZG8gPSBhd2FpdCB2ZXJpZmljYXJTZXNpb24ocmVxdWVzdCk7XHJcblxyXG4gIGlmIChyZXN1bHRhZG8uZXJyb3IpIHtcclxuICAgIHJldHVybiByZXN1bHRhZG87XHJcbiAgfVxyXG5cclxuICBpZiAocmVzdWx0YWRvLnBlcmZpbC5yb2wgIT09IFwiYWRtaW5cIikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZXJyb3I6IHJlc3B1ZXN0YUVycm9yKFxyXG4gICAgICAgIFwiTm8gdGllbmVzIHBlcm1pc29zIHBhcmEgcmVhbGl6YXIgZXN0YSBvcGVyYWNpXHUwMEYzbi5cIixcclxuICAgICAgICA0MDNcclxuICAgICAgKVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHJldHVybiByZXN1bHRhZG87XHJcbn0iLCAiaW1wb3J0IHN1cGFiYXNlIGZyb20gXCIuL3N1cGFiYXNlLmpzXCI7XHJcbmltcG9ydCB7IHZlcmlmaWNhclNlc2lvbix2ZXJpZmljYXJBZG1pbmlzdHJhZG9yfSBmcm9tIFwiLi9hdXRoSGVscGVyLmpzXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhc3luYyAocmVxdWVzdCwgY29udGV4dCkgPT4ge1xyXG4gIGNvbnN0IG1ldG9kbyA9IHJlcXVlc3QubWV0aG9kO1xyXG4gIGlmIChyZXF1ZXN0Lm1ldGhvZCA9PT0gXCJHRVRcIikge1xyXG4gICAgY29uc3QgYWNjZXNvID0gYXdhaXQgdmVyaWZpY2FyU2VzaW9uKHJlcXVlc3QpO1xyXG5cclxuICAgIGlmIChhY2Nlc28uZXJyb3IpIHtcclxuICAgICAgcmV0dXJuIGFjY2Vzby5lcnJvcjtcclxuICAgIH1cclxuICB9IGVsc2UgaWYgKHJlcXVlc3QubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgY29uc3QgYWNjZXNvID0gYXdhaXQgdmVyaWZpY2FyQWRtaW5pc3RyYWRvcihyZXF1ZXN0KTtcclxuXHJcbiAgICBpZiAoYWNjZXNvLmVycm9yKSB7XHJcbiAgICAgIHJldHVybiBhY2Nlc28uZXJyb3I7XHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoXHJcbiAgICAgIEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IFwiTVx1MDBFOXRvZG8gbm8gcGVybWl0aWRvLlwiIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgc3RhdHVzOiA0MDUsXHJcbiAgICAgICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9XHJcbiAgICAgIH1cclxuICAgICk7XHJcbiAgfVxyXG4gIGlmIChtZXRvZG8gPT09IFwiR0VUXCIpIHtcclxuICAgIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgIC5mcm9tKFwiZXZlbnRvc1wiKVxyXG4gICAgICAuc2VsZWN0KFwiKlwiKVxyXG4gICAgICAub3JkZXIoXCJjcmVhZG9fZW5cIiwgeyBhc2NlbmRpbmc6IGZhbHNlIH0pO1xyXG5cclxuICAgIGlmIChlcnJvcikge1xyXG4gICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKFxyXG4gICAgICAgIEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgc3RhdHVzOiA1MDAsXHJcbiAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoXHJcbiAgICAgIEpTT04uc3RyaW5naWZ5KGRhdGEpLFxyXG4gICAgICB7XHJcbiAgICAgICAgc3RhdHVzOiAyMDAsXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBpZiAobWV0b2RvID09PSBcIlBPU1RcIiB8fCBtZXRvZG8gPT09IFwiUFVUXCIpIHtcclxuICAgIGNvbnN0IGRhdG9zID0gYXdhaXQgcmVxdWVzdC5qc29uKCk7XHJcblxyXG4gICAgY29uc3QgZGF0b3NFdmVudG8gPSB7XHJcbiAgICAgIG5vbWJyZTogZGF0b3Mubm9tYnJlLFxyXG4gICAgICBkZXNjcmlwY2lvbjogZGF0b3MuZGVzY3JpcGNpb24sXHJcbiAgICAgIGZlY2hhOiBkYXRvcy5mZWNoYSxcclxuICAgICAgcHJlc3VwdWVzdG9fbWluOiBkYXRvcy5taW5pbW8sXHJcbiAgICAgIHByZXN1cHVlc3RvX21heDogZGF0b3MubWF4aW1vLFxyXG4gICAgICBlc3RhZG86IGRhdG9zLmVzdGFkbyB8fCBcIlByZXBhcmFjaVx1MDBGM25cIlxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAoZGF0b3MuaWQpIHtcclxuICAgICAgZGF0b3NFdmVudG8uaWQgPSBkYXRvcy5pZDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgICAuZnJvbShcImV2ZW50b3NcIilcclxuICAgICAgLnVwc2VydChkYXRvc0V2ZW50bywgeyBvbkNvbmZsaWN0OiBcImlkXCIgfSlcclxuICAgICAgLnNlbGVjdCgpXHJcbiAgICAgIC5zaW5nbGUoKTtcclxuXHJcbiAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pLCB7XHJcbiAgICAgICAgc3RhdHVzOiA1MDAsXHJcbiAgICAgICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoZGF0YSksIHtcclxuICAgICAgc3RhdHVzOiBkYXRvcy5pZCA/IDIwMCA6IDIwMSxcclxuICAgICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHJldHVybiBuZXcgUmVzcG9uc2UoXHJcbiAgICBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgIG1lbnNhamU6IFwiTVx1MDBFOXRvZG8gbm8gcGVybWl0aWRvXCJcclxuICAgIH0pLFxyXG4gICAge1xyXG4gICAgICBzdGF0dXM6IDQwNSxcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICAgIH1cclxuICAgIH1cclxuICApO1xyXG59OyJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7QUFBQSxTQUFTLG9CQUFvQjtBQUU3QixJQUFNLFdBQVc7QUFBQSxFQUNmLFFBQVEsSUFBSTtBQUFBLEVBQ1osUUFBUSxJQUFJO0FBQ2Q7QUFFQSxJQUFPLG1CQUFROzs7QUNKZixTQUFTLGVBQWUsU0FBUyxRQUFRO0FBQ3ZDLFNBQU8sSUFBSTtBQUFBLElBQ1QsS0FBSyxVQUFVLEVBQUUsT0FBTyxRQUFRLENBQUM7QUFBQSxJQUNqQztBQUFBLE1BQ0UsUUFBUTtBQUFBLE1BQ1IsU0FBUztBQUFBLFFBQ1AsZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGO0FBRUEsZUFBc0IsZ0JBQWdCLFNB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
