import supabaseCliente from "./supabaseCliente";

export async function iniciarSesion(username, contraseña) {
  const correoSimulado = `${username.trim().toLowerCase()}@dearsecret.com`;

  const { data, error } = await supabaseCliente.auth.signInWithPassword({
    email: correoSimulado,
    password: contraseña
  });

  if (error) {
    throw new Error("Usuario o contraseña incorrectos.");
  }

  const { data: perfil, error: errorPerfil } = await supabaseCliente
    .from("usuarios")
    .select("id, nombre, username, rol, auth_user_id")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();


  if (errorPerfil || !perfil) {
    await supabaseCliente.auth.signOut();
    throw new Error(
      "El usuario autenticado no tiene un perfil configurado en la base de datos."
    );
  }

  try {
    const { data: parts } = await supabaseCliente
      .from("participaciones")
      .select("evento_id, estado")
      .eq("usuario_id", perfil.id);

    perfil.participaciones = parts || [];
  } catch (err) {
    console.log("El usuario no cuenta con participaciones activas aún:", err.message);
    perfil.participaciones = [];
  }

  return perfil;
}

export async function cerrarSesion() {
  const { error } = await supabaseCliente.auth.signOut();
  if (error) {
    throw error;
  }
}
