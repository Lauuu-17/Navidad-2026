function MiAmigoSecreto({ volver }) {

  const sorteoPublicado = false;

  const amigoSecreto = {
    nombre: "Laura",
    descripcion: "Le gustan los libros y los colores verdes."
  };

  return (
    <div className="contenido">

      <button
        className="boton-secundario"
        onClick={volver}
      >
        ← Volver
      </button>

      {!sorteoPublicado ? (

        <div className="secreto-bloqueado">

          <div className="secreto-icono">
            🎁
          </div>

          <h1>Tu amigo secreto todavía es secreto</h1>

          <p>
            El administrador todavía no ha publicado
            el resultado del sorteo.
          </p>

          <span>
            Cuando llegue el momento podrás descubrir
            a quién debes sorprender.
          </span>

        </div>

      ) : (

        <div className="secreto-revelado">

          <span>Tu misión es regalarle algo especial a</span>

          <h1>{amigoSecreto.nombre}</h1>

          <p>
            {amigoSecreto.descripcion}
          </p>

        </div>

      )}

    </div>
  );
}

export default MiAmigoSecreto;