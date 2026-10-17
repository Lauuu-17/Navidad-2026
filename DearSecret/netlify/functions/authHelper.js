import { supabase, supabaseAdmin } from "./supabase.js";

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

export async function verificarSesion(request) {
  const autorizacion = request.headers.get("authorization");

  if (!autorizacion || !autorizacion.startsWith("Bearer ")) {
    return {
      error: respuestaError("Debes iniciar sesión.", 401)
    };
  }

  const token = autorizacion.substring(7).trim();

  if (!token) {
    return {
      error: respuestaError("Token de acceso vacío.", 401)
    };
  }
  
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return {
      error: respuestaError("La sesión no es válida o ha expirado.", 401)
    };
  }

  const { data: perfil, error: errorPerfil } = await supabaseAdmin
    .from("usuarios")
    .select("id, nombre, username, rol, auth_user_id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (errorPerfil) {
    return {
      error: respuestaError(`Error en DB de Supabase: ${errorPerfil.message} (Código: ${errorPerfil.code})`, 500)
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

export async function verificarAdministrador(request) {
  const resultado = await verificarSesion(request);

  if (resultado.error) {
    return resultado;
  }

  if (resultado.perfil.rol !== "admin") {
    return {
      error: respuestaError(
        "No tienes permisos para realizar esta operación.",
        403
      )
    };
  }

  return resultado;
}
