import supabaseCliente from "./supabaseCliente"; 

const API_URL = "http://localhost:8888/.netlify/functions"; 

async function obtenerToken() {
  const { data, error } = await supabaseCliente.auth.getSession();

  if (error) {
    throw new Error("No se pudo comprobar la sesión.");
  }

  if (!data.session) {
    throw new Error("Debes iniciar sesión para continuar.");
  }

  return data.session.access_token;
}

export async function obtenerDatos(nombreFuncion) {
  const token = await obtenerToken(); 

  const respuesta = await fetch(`${API_URL}/${nombreFuncion}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!respuesta.ok) {
    const errorTexto = await respuesta.text();
    throw new Error(`Error en el servidor (${respuesta.status}): ${errorTexto}`);
  }

  const datos = await respuesta.json();
  return datos;
}

export async function enviarDatos(nombreFuncion, datos) {
  const token = await obtenerToken();

  const respuesta = await fetch(`${API_URL}/${nombreFuncion}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(datos)
  });

  if (!respuesta.ok) {
    const errorTexto = await respuesta.text();
    throw new Error(`Error al guardar (${respuesta.status}): ${errorTexto}`);
  }

  const resultado = await respuesta.json();
  return resultado;
}
export async function eliminarDatos(nombreFuncion, datos) {
  const token = await obtenerToken();

  const respuesta = await fetch(`${API_URL}/${nombreFuncion}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(datos)
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      resultado.error || "No se pudieron eliminar los datos."
    );
  }

  return resultado;
}
