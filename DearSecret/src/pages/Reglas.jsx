function Reglas({ volver }) {

  return (
    <div className="contenido">

      <button
        className="boton-secundario"
        onClick={volver}
      >
        ← Volver
      </button>

      <div className="titulo-seccion">

        <div>
          <h1>📜 Reglas del evento</h1>

          <p>
            Condiciones que debes tener en cuenta durante el intercambio.
          </p>
        </div>

      </div>

      <div className="reglas-card">

        <h2>Ángel Secreto 2026</h2>

        <h3>🎁 Sobre el intercambio</h3>

        <p>
          Cada participante recibirá una persona a quien deberá
          preparar un regalo.
        </p>

        <h3>💰 Presupuesto</h3>

        <p>
          El valor recomendado del regalo.
        </p>

        <h3>📅 Fecha</h3>

        <p>
          El intercambio se realizará el.
        </p>

        <h3>🤫 Mantén el secreto</h3>

        <p>
          No reveles públicamente quién te fue asignado.
          La idea es mantener la sorpresa hasta el momento indicado.
        </p>

        <h3>💝 Wishlist</h3>

        <p>
          Puedes actualizar tu wishlist en cualquier momento para
          ayudar a la persona que te tenga como amigo secreto.
        </p>

      </div>

    </div>
  );
}

export default Reglas;