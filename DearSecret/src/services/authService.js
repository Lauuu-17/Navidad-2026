import supabaseCliente from "./supabaseCliente";

export async function iniciarSesion(username, contraseña) {
  const correoSimulado = `${username.trim().toLowerCase()}@dearsecret.local`;

  const { data, error } = await supabaseCliente.auth.signInWithPassword({
    email: correoSimulado,
    password: contraseña
  });

  if (error) {
    throw new Error("Usuario o contraseña incorrectos.");
  }

  const { data: perfil, error: errorPerfil } = await supabaseCliente
    .from("usuarios")
    .select(`
      id,
      nombre,
      username,
      rol,
      participaciones(evento_id, estado)
    `)
    .eq("id", data.user.id)
    .maybeSingle();

  if (errorPerfil || !perfil) {
    await supabaseCliente.auth.signOut();
    throw new Error(
      "El usuario autenticado no tiene un perfil configurado en la base de datos."
    );
  }

  return perfil;
}

export async function cerrarSesion() {
  const { error } = await supabaseCliente.auth.signOut();
  if (error) {
    throw error;
  }
}
