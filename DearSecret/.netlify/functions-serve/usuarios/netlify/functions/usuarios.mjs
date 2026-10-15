
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

// netlify/functions/usuarios.js
var usuarios_default = async (request, context) => {
  const acceso = await verificarAdministrador(request);
  if (acceso.error) {
    return acceso.error;
  }
  const metodo = request.method;
  if (metodo === "GET") {
    const { data, error } = await supabase_default.from("usuarios").select(`
        id,
        nombre,
        username,
        rol,
        participaciones (
          evento_id,
          estado
        )
      `).order("creado_en", { ascending: false });
    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
    const resultado = data.map((usuario) => ({
      id: usuario.id,
      nombre: usuario.nombre,
      usuario: usuario.username,
      rol: usuario.rol,
      eventos: usuario.participaciones.map((p) => ({
        eventoId: p.evento_id,
        estado: p.estado
      }))
    }));
    return new Response(
      JSON.stringify(resultado),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
  if (metodo === "POST") {
    try {
      const datos = await request.json();
      const usuarioId = datos.id || datos.usuarioId;
      const usuarioNombre = datos.nombre;
      const usuarioLogin = datos.usuario || datos.username;
      const destinoEventoId = datos.eventoId || datos.evento_id;
      if (usuarioId) {
        const { error: errorBorrado } = await supabase_default.from("participaciones").delete().eq("usuario_id", usuarioId);
        if (errorBorrado) throw errorBorrado;
        if (destinoEventoId) {
          const { error: errorInsertParticipacion } = await supabase_default.from("participaciones").insert([
            {
              usuario_id: usuarioId,
              evento_id: destinoEventoId,
              estado: "activo"
            }
          ]);
          if (errorInsertParticipacion) {
            return new Response(JSON.stringify({ error: errorInsertParticipacion.message }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
        }
        return new Response(
          JSON.stringify({ mensaje: "Asignaci\xF3n actualizada con \xE9xito en la tabla participaciones.", eventoId: destinoEventoId || null }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (!usuarioNombre || !usuarioLogin) {
        return new Response(JSON.stringify({ error: "El nombre y el usuario son obligatorios." }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      const { data: existente, error: errorBusqueda } = await supabase_default.from("usuarios").select("id").eq("username", usuarioLogin).maybeSingle();
      if (errorBusqueda) {
        return new Response(JSON.stringify({ error: errorBusqueda.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
      if (existente) {
        return new Response(JSON.stringify({ error: "Ese nombre de usuario ya existe." }), {
          status: 409,
          headers: { "Content-Type": "application/json" }
        });
      }
      const { data: nuevoUsuario, error: errorUsuario } = await supabase_default.from("usuarios").insert([{ nombre: usuarioNombre, username: usuarioLogin, rol: "participante" }]).select().single();
      if (errorUsuario) {
        return new Response(JSON.stringify({ error: errorUsuario.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
      if (destinoEventoId) {
        const { error: errorParticipacion } = await supabase_default.from("participaciones").insert([{ usuario_id: nuevoUsuario.id, evento_id: destinoEventoId, estado: "activo" }]);
        if (errorParticipacion) {
          await supabase_default.from("usuarios").delete().eq("id", nuevoUsuario.id);
          return new Response(JSON.stringify({ error: errorParticipacion.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
      return new Response(
        JSON.stringify({
          id: nuevoUsuario.id,
          nombre: nuevoUsuario.nombre,
          usuario: nuevoUsuario.username,
          rol: nuevoUsuario.rol,
          eventoId: destinoEventoId || null
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      return new Response(JSON.stringify({ error: "No se pudo procesar la solicitud." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};
export {
  usuarios_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvc3VwYWJhc2UuanMiLCAibmV0bGlmeS9mdW5jdGlvbnMvYXV0aEhlbHBlci5qcyIsICJuZXRsaWZ5L2Z1bmN0aW9ucy91c3Vhcmlvcy5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgY3JlYXRlQ2xpZW50IH0gZnJvbSBcIkBzdXBhYmFzZS9zdXBhYmFzZS1qc1wiO1xyXG5cclxuY29uc3Qgc3VwYWJhc2UgPSBjcmVhdGVDbGllbnQoXHJcbiAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfVVJMLFxyXG4gIHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfUk9MRV9LRVlcclxuKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IHN1cGFiYXNlOyIsICJcclxuaW1wb3J0IHN1cGFiYXNlIGZyb20gXCIuL3N1cGFiYXNlLmpzXCI7XHJcblxyXG5mdW5jdGlvbiByZXNwdWVzdGFFcnJvcihtZW5zYWplLCBlc3RhZG8pIHtcclxuICByZXR1cm4gbmV3IFJlc3BvbnNlKFxyXG4gICAgSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogbWVuc2FqZSB9KSxcclxuICAgIHtcclxuICAgICAgc3RhdHVzOiBlc3RhZG8sXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIlxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHZlcmlmaWNhclNlc2lvbihyZXF1ZXN0KSB7XHJcbiAgY29uc3QgYXV0b3JpemFjaW9uID0gcmVxdWVzdC5oZWFkZXJzLmdldChcImF1dGhvcml6YXRpb25cIik7XHJcblxyXG4gIGlmICghYXV0b3JpemFjaW9uIHx8ICFhdXRvcml6YWNpb24uc3RhcnRzV2l0aChcIkJlYXJlciBcIikpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGVycm9yOiByZXNwdWVzdGFFcnJvcihcIkRlYmVzIGluaWNpYXIgc2VzaVx1MDBGM24uXCIsIDQwMSlcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBjb25zdCB0b2tlbiA9IGF1dG9yaXphY2lvbi5zdWJzdHJpbmcoNykudHJpbSgpO1xyXG5cclxuICBpZiAoIXRva2VuKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBlcnJvcjogcmVzcHVlc3RhRXJyb3IoXCJUb2tlbiBkZSBhY2Nlc28gdmFjXHUwMEVEby5cIiwgNDAxKVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlLmF1dGguZ2V0VXNlcih0b2tlbik7XHJcblxyXG4gIGlmIChlcnJvciB8fCAhZGF0YS51c2VyKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBlcnJvcjogcmVzcHVlc3RhRXJyb3IoXCJMYSBzZXNpXHUwMEYzbiBubyBlcyB2XHUwMEUxbGlkYSBvIGhhIGV4cGlyYWRvLlwiLCA0MDEpXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgY29uc3QgeyBkYXRhOiBwZXJmaWwsIGVycm9yOiBlcnJvclBlcmZpbCB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgIC5mcm9tKFwidXN1YXJpb3NcIilcclxuICAgIC5zZWxlY3QoXCJpZCwgbm9tYnJlLCB1c2VybmFtZSwgcm9sLCBhdXRoX3VzZXJfaWRcIilcclxuICAgIC5lcShcImF1dGhfdXNlcl9pZFwiLCBkYXRhLnVzZXIuaWQpXHJcbiAgICAubWF5YmVTaW5nbGUoKTtcclxuXHJcbiAgaWYgKGVycm9yUGVyZmlsKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBlcnJvcjogcmVzcHVlc3RhRXJyb3IoXCJObyBzZSBwdWRvIHZlcmlmaWNhciBlbCBwZXJmaWwuXCIsIDUwMClcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBpZiAoIXBlcmZpbCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZXJyb3I6IHJlc3B1ZXN0YUVycm9yKFwiTGEgY3VlbnRhIG5vIHRpZW5lIHVuIHBlcmZpbCBhc29jaWFkby5cIiwgNDAzKVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICB1c2VyOiBkYXRhLnVzZXIsXHJcbiAgICBwZXJmaWxcclxuICB9O1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdmVyaWZpY2FyQWRtaW5pc3RyYWRvcihyZXF1ZXN0KSB7XHJcbiAgY29uc3QgcmVzdWx0YWRvID0gYXdhaXQgdmVyaWZpY2FyU2VzaW9uKHJlcXVlc3QpO1xyXG5cclxuICBpZiAocmVzdWx0YWRvLmVycm9yKSB7XHJcbiAgICByZXR1cm4gcmVzdWx0YWRvO1xyXG4gIH1cclxuXHJcbiAgaWYgKHJlc3VsdGFkby5wZXJmaWwucm9sICE9PSBcImFkbWluXCIpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGVycm9yOiByZXNwdWVzdGFFcnJvcihcclxuICAgICAgICBcIk5vIHRpZW5lcyBwZXJtaXNvcyBwYXJhIHJlYWxpemFyIGVzdGEgb3BlcmFjaVx1MDBGM24uXCIsXHJcbiAgICAgICAgNDAzXHJcbiAgICAgIClcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcmVzdWx0YWRvO1xyXG59IiwgImltcG9ydCBzdXBhYmFzZSBmcm9tIFwiLi9zdXBhYmFzZS5qc1wiO1xyXG5pbXBvcnQgeyB2ZXJpZmljYXJBZG1pbmlzdHJhZG9yIH0gZnJvbSBcIi4vYXV0aEhlbHBlci5qc1wiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgKHJlcXVlc3QsIGNvbnRleHQpID0+IHtcclxuICBjb25zdCBhY2Nlc28gPSBhd2FpdCB2ZXJpZmljYXJBZG1pbmlzdHJhZG9yKHJlcXVlc3QpO1xyXG5cclxuICBpZiAoYWNjZXNvLmVycm9yKSB7XHJcbiAgICByZXR1cm4gYWNjZXNvLmVycm9yO1xyXG4gIH1cclxuICBjb25zdCBtZXRvZG8gPSByZXF1ZXN0Lm1ldGhvZDtcclxuXHJcbiAgaWYgKG1ldG9kbyA9PT0gXCJHRVRcIikge1xyXG4gICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgLmZyb20oXCJ1c3Vhcmlvc1wiKVxyXG4gICAgICAuc2VsZWN0KGBcclxuICAgICAgICBpZCxcclxuICAgICAgICBub21icmUsXHJcbiAgICAgICAgdXNlcm5hbWUsXHJcbiAgICAgICAgcm9sLFxyXG4gICAgICAgIHBhcnRpY2lwYWNpb25lcyAoXHJcbiAgICAgICAgICBldmVudG9faWQsXHJcbiAgICAgICAgICBlc3RhZG9cclxuICAgICAgICApXHJcbiAgICAgIGApXHJcbiAgICAgIC5vcmRlcihcImNyZWFkb19lblwiLCB7IGFzY2VuZGluZzogZmFsc2UgfSk7XHJcblxyXG4gICAgaWYgKGVycm9yKSB7XHJcbiAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoXHJcbiAgICAgICAgSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBzdGF0dXM6IDUwMCxcclxuICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVzdWx0YWRvID0gZGF0YS5tYXAoKHVzdWFyaW8pID0+ICh7XHJcbiAgICAgIGlkOiB1c3VhcmlvLmlkLFxyXG4gICAgICBub21icmU6IHVzdWFyaW8ubm9tYnJlLFxyXG4gICAgICB1c3VhcmlvOiB1c3VhcmlvLnVzZXJuYW1lLFxyXG4gICAgICByb2w6IHVzdWFyaW8ucm9sLFxyXG4gICAgICBldmVudG9zOiB1c3VhcmlvLnBhcnRpY2lwYWNpb25lcy5tYXAoKHApID0+ICh7XHJcbiAgICAgICAgZXZlbnRvSWQ6IHAuZXZlbnRvX2lkLFxyXG4gICAgICAgIGVzdGFkbzogcC5lc3RhZG9cclxuICAgICAgfSkpXHJcbiAgICB9KSk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZShcclxuICAgICAgSlNPTi5zdHJpbmdpZnkocmVzdWx0YWRvKSxcclxuICAgICAge1xyXG4gICAgICAgIHN0YXR1czogMjAwLFxyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgaWYgKG1ldG9kbyA9PT0gXCJQT1NUXCIpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IGRhdG9zID0gYXdhaXQgcmVxdWVzdC5qc29uKCk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zdCB1c3VhcmlvSWQgPSBkYXRvcy5pZCB8fCBkYXRvcy51c3VhcmlvSWQ7IFxyXG4gICAgICBjb25zdCB1c3VhcmlvTm9tYnJlID0gZGF0b3Mubm9tYnJlO1xyXG4gICAgICBjb25zdCB1c3VhcmlvTG9naW4gPSBkYXRvcy51c3VhcmlvIHx8IGRhdG9zLnVzZXJuYW1lOyBcclxuICAgICAgY29uc3QgZGVzdGlub0V2ZW50b0lkID0gZGF0b3MuZXZlbnRvSWQgfHwgZGF0b3MuZXZlbnRvX2lkO1xyXG5cclxuICAgICAgaWYgKHVzdWFyaW9JZCkge1xyXG4gICAgICAgIGNvbnN0IHsgZXJyb3I6IGVycm9yQm9ycmFkbyB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgICAgIC5mcm9tKFwicGFydGljaXBhY2lvbmVzXCIpXHJcbiAgICAgICAgICAuZGVsZXRlKClcclxuICAgICAgICAgIC5lcShcInVzdWFyaW9faWRcIiwgdXN1YXJpb0lkKTtcclxuXHJcbiAgICAgICAgaWYgKGVycm9yQm9ycmFkbykgdGhyb3cgZXJyb3JCb3JyYWRvO1xyXG5cclxuICAgICAgICBpZiAoZGVzdGlub0V2ZW50b0lkKSB7XHJcbiAgICAgICAgICBjb25zdCB7IGVycm9yOiBlcnJvckluc2VydFBhcnRpY2lwYWNpb24gfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgICAgICAgIC5mcm9tKFwicGFydGljaXBhY2lvbmVzXCIpXHJcbiAgICAgICAgICAgIC5pbnNlcnQoW1xyXG4gICAgICAgICAgICAgIHsgXHJcbiAgICAgICAgICAgICAgICB1c3VhcmlvX2lkOiB1c3VhcmlvSWQsIFxyXG4gICAgICAgICAgICAgICAgZXZlbnRvX2lkOiBkZXN0aW5vRXZlbnRvSWQsXHJcbiAgICAgICAgICAgICAgICBlc3RhZG86IFwiYWN0aXZvXCIgXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdKTtcclxuXHJcbiAgICAgICAgICBpZiAoZXJyb3JJbnNlcnRQYXJ0aWNpcGFjaW9uKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3JJbnNlcnRQYXJ0aWNpcGFjaW9uLm1lc3NhZ2UgfSksIHtcclxuICAgICAgICAgICAgICBzdGF0dXM6IDQwMCxcclxuICAgICAgICAgICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKFxyXG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkoeyBtZW5zYWplOiBcIkFzaWduYWNpXHUwMEYzbiBhY3R1YWxpemFkYSBjb24gXHUwMEU5eGl0byBlbiBsYSB0YWJsYSBwYXJ0aWNpcGFjaW9uZXMuXCIsIGV2ZW50b0lkOiBkZXN0aW5vRXZlbnRvSWQgfHwgbnVsbCB9KSxcclxuICAgICAgICAgIHsgc3RhdHVzOiAyMDAsIGhlYWRlcnM6IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSB9XHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCF1c3VhcmlvTm9tYnJlIHx8ICF1c3VhcmlvTG9naW4pIHtcclxuICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IFwiRWwgbm9tYnJlIHkgZWwgdXN1YXJpbyBzb24gb2JsaWdhdG9yaW9zLlwiIH0pLCB7XHJcbiAgICAgICAgICBzdGF0dXM6IDQwMCxcclxuICAgICAgICAgIGhlYWRlcnM6IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCB7IGRhdGE6IGV4aXN0ZW50ZSwgZXJyb3I6IGVycm9yQnVzcXVlZGEgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgICAgLmZyb20oXCJ1c3Vhcmlvc1wiKVxyXG4gICAgICAgIC5zZWxlY3QoXCJpZFwiKVxyXG4gICAgICAgIC5lcShcInVzZXJuYW1lXCIsIHVzdWFyaW9Mb2dpbilcclxuICAgICAgICAubWF5YmVTaW5nbGUoKTtcclxuXHJcbiAgICAgIGlmIChlcnJvckJ1c3F1ZWRhKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnJvckJ1c3F1ZWRhLm1lc3NhZ2UgfSksIHtcclxuICAgICAgICAgIHN0YXR1czogNTAwLFxyXG4gICAgICAgICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChleGlzdGVudGUpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IFwiRXNlIG5vbWJyZSBkZSB1c3VhcmlvIHlhIGV4aXN0ZS5cIiB9KSwge1xyXG4gICAgICAgICAgc3RhdHVzOiA0MDksXHJcbiAgICAgICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgeyBkYXRhOiBudWV2b1VzdWFyaW8sIGVycm9yOiBlcnJvclVzdWFyaW8gfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgICAgLmZyb20oXCJ1c3Vhcmlvc1wiKVxyXG4gICAgICAgIC5pbnNlcnQoW3sgbm9tYnJlOiB1c3VhcmlvTm9tYnJlLCB1c2VybmFtZTogdXN1YXJpb0xvZ2luLCByb2w6IFwicGFydGljaXBhbnRlXCIgfV0pXHJcbiAgICAgICAgLnNlbGVjdCgpXHJcbiAgICAgICAgLnNpbmdsZSgpO1xyXG5cclxuICAgICAgaWYgKGVycm9yVXN1YXJpbykge1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3JVc3VhcmlvLm1lc3NhZ2UgfSksIHtcclxuICAgICAgICAgIHN0YXR1czogNTAwLFxyXG4gICAgICAgICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChkZXN0aW5vRXZlbnRvSWQpIHtcclxuICAgICAgICBjb25zdCB7IGVycm9yOiBlcnJvclBhcnRpY2lwYWNpb24gfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAgICAgICAuZnJvbShcInBhcnRpY2lwYWNpb25lc1wiKVxyXG4gICAgICAgICAgLmluc2VydChbeyB1c3VhcmlvX2lkOiBudWV2b1VzdWFyaW8uaWQsIGV2ZW50b19pZDogZGVzdGlub0V2ZW50b0lkLCBlc3RhZG86IFwiYWN0aXZvXCIgfV0pO1xyXG5cclxuICAgICAgICBpZiAoZXJyb3JQYXJ0aWNpcGFjaW9uKSB7XHJcbiAgICAgICAgICBhd2FpdCBzdXBhYmFzZS5mcm9tKFwidXN1YXJpb3NcIikuZGVsZXRlKCkuZXEoXCJpZFwiLCBudWV2b1VzdWFyaW8uaWQpO1xyXG4gICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnJvclBhcnRpY2lwYWNpb24ubWVzc2FnZSB9KSwge1xyXG4gICAgICAgICAgICBzdGF0dXM6IDQwMCxcclxuICAgICAgICAgICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoXHJcbiAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgaWQ6IG51ZXZvVXN1YXJpby5pZCxcclxuICAgICAgICAgIG5vbWJyZTogbnVldm9Vc3VhcmlvLm5vbWJyZSxcclxuICAgICAgICAgIHVzdWFyaW86IG51ZXZvVXN1YXJpby51c2VybmFtZSxcclxuICAgICAgICAgIHJvbDogbnVldm9Vc3VhcmlvLnJvbCxcclxuICAgICAgICAgIGV2ZW50b0lkOiBkZXN0aW5vRXZlbnRvSWQgfHwgbnVsbFxyXG4gICAgICAgIH0pLFxyXG4gICAgICAgIHsgc3RhdHVzOiAyMDEsIGhlYWRlcnM6IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSB9XHJcbiAgICAgICk7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IFwiTm8gc2UgcHVkbyBwcm9jZXNhciBsYSBzb2xpY2l0dWQuXCIgfSksIHtcclxuICAgICAgICBzdGF0dXM6IDQwMCxcclxuICAgICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxufTsiXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7O0FBQUEsU0FBUyxvQkFBb0I7QUFFN0IsSUFBTSxXQUFXO0FBQUEs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
