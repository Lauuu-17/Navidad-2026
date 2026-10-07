import { useState } from "react";

function UsuariosAdmin({ volver }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [usuarios, setUsuarios] = useState([
    {
      id: 1,
      nombre: "Fernando",
      usuario: "fernando",
      contrasena: "1234",
      evento: "Intercambio de Navidad 2026"
    },
    {
      id: 2,
      nombre: "Laura",
      usuario: "laura",
      contrasena: "1234",
      evento: "Intercambio de Navidad 2026"
    },
    {
      id: 3,
      nombre: "Erica",
      usuario: "erica",
      contrasena: "1234",
      evento: "Intercambio de Navidad 2026"
    }
  ]);

  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");

  function crearUsuario(e) {
    e.preventDefault();

    const nuevoUsuario = {
      id: Date.now(),
      nombre: nombre,
      usuario: usuario,
      contrasena: contrasena,
      evento: "Sin asignar"
    };

    setUsuarios([...usuarios, nuevoUsuario]);

    setNombre("");
    setUsuario("");
    setContrasena("");

    setMostrarFormulario(false);
  }

  return (
    <div className="contenido">

      <button
        className="boton-secundario"
        onClick={volver}
      >
        ← Volver al panel
      </button>

      <div className="titulo-seccion">
        <div>
          <h1>Usuarios</h1>
          <p>
            Crea y administra las cuentas de los participantes.
          </p>
        </div>

        <button
          onClick={() => setMostrarFormulario(true)}
        >
          + Crear usuario
        </button>
      </div>

      {mostrarFormulario && (
        <div className="formulario-evento">

          <h2>Crear nuevo usuario</h2>

          <form onSubmit={crearUsuario}>

            <label>Nombre</label>

            <input
              type="text"
              placeholder="Nombre del participante"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />

            <label>Usuario</label>

            <input
              type="text"
              placeholder="Nombre de usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />

            <label>Contraseña inicial</label>

            <input
              type="text"
              placeholder="Contraseña inicial"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />

            <div className="acciones-formulario">

              <button
                type="button"
                className="boton-secundario"
                onClick={() => setMostrarFormulario(false)}
              >
                Cancelar
              </button>

              <button type="submit">
                Crear usuario
              </button>

            </div>

          </form>
        </div>
      )}

      <div className="tabla-contenedor">

        <table className="tabla-usuarios">

          <thead>
            <tr>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Evento</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>

          <tbody>

            {usuarios.map((usuario) => (

              <tr key={usuario.id}>

                <td>{usuario.nombre}</td>

                <td>{usuario.usuario}</td>

                <td>{usuario.evento}</td>

                <td>
                  <span className="estado-activo">
                    Activo
                  </span>
                </td>

                <td>
                  <button className="boton-tabla">
                    Gestionar
                  </button>
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default UsuariosAdmin;