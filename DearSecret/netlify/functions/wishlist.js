
import supabase from "./supabase.js";
import { verificarSesion } from "./authHelper.js";

function responder(datos, estado = 200) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { "Content-Type": "application/json" }
  });
}

export default async (request, context) => {
  const acceso = await verificarSesion(request);

  if (acceso.error) {
    return acceso.error;
  }

  if (request.method !== "GET" && request.method !== "POST") {
    return responder({ error: "Método no permitido." }, 405);
  }

  const perfil = acceso.perfil;
  let eventoId;
  let cuerpo = {};

  if (request.method === "GET") {
    const url = new URL(request.url);
    eventoId = url.searchParams.get("eventoId");
  } else {
    try {
      cuerpo = await request.json();
    } catch {
      return responder({ error: "El cuerpo JSON no es válido." }, 400);
    }

    eventoId = cuerpo.eventoId;
  }

  if (!eventoId) {
    return responder({ error: "Debes indicar el evento." }, 400);
  }

  const { data: participacion, error: errorParticipacion } =
    await supabase
      .from("participaciones")
      .select("id, estado")
      .eq("evento_id", eventoId)
      .eq("usuario_id", perfil.id)
      .maybeSingle();

  if (errorParticipacion) {
    return responder(
      { error: "No se pudo comprobar tu participación." },
      500
    );
  }

  if (!participacion || participacion.estado !== "activo") {
    return responder(
      { error: "No tienes una participación activa en este evento." },
      403
    );
  }

  if (request.method === "GET") {
    const { data, error } = await supabase
      .from("wishlists")
      .select(
        "id, regalo, color, caricatura, enlace, imagen, descripcion, actualizado_en"
      )
      .eq("participacion_id", participacion.id)
      .maybeSingle();

    if (error) {
      return responder(
        { error: "No se pudo consultar tu wishlist." },
        500
      );
    }

    return responder(data);
  }

  function textoSeguro(valor, maximo) {
    if (valor == null || valor === "") return null;
    if (typeof valor !== "string") return null;
    return valor.trim().slice(0, maximo);
  }

  const datosWishlist = {
    participacion_id: participacion.id,
    regalo: textoSeguro(cuerpo.regalo, 2000),
    color: textoSeguro(cuerpo.color, 100),
    caricatura: textoSeguro(cuerpo.caricatura, 150),
    enlace: textoSeguro(cuerpo.enlace, 2000),
    imagen: textoSeguro(cuerpo.imagen, 2000),
    descripcion: textoSeguro(cuerpo.descripcion, 5000),
    actualizado_en: new Date().toISOString()
  };

  const { data: guardada, error: errorGuardado } = await supabase
    .from("wishlists")
    .upsert(datosWishlist, {
      onConflict: "participacion_id"
    })
    .select()
    .single();

  if (errorGuardado) {
    return responder(
      { error: "No se pudo guardar tu wishlist." },
      500
    );
  }

  return responder({
    mensaje: "Wishlist guardada correctamente.",
    wishlist: guardada
  });
};