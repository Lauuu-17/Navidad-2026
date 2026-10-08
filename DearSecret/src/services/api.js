const API_URL = "/.netlify/functions";

export async function obtenerDatos(nombreFuncion) {
  const respuesta = await fetch(
    `${API_URL}/${nombreFuncion}`
  );

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.error || "No se pudieron obtener los datos."
    );
  }

  return datos;
}

export async function enviarDatos(nombreFuncion, datos) {
  const respuesta = await fetch(
    `${API_URL}/${nombreFuncion}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(datos)
    }
  );

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      resultado.error || "No se pudieron guardar los datos."
    );
  }

  return resultado;
}