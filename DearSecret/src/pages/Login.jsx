const { data, error } = await supabaseCliente.auth.signInWithPassword({
  email: correo,
  password: contraseña
});