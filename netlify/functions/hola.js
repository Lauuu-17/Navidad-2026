export default async (request, context) => {
  return new Response(
    JSON.stringify({
      mensaje: "Prueba correcta"
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
};
