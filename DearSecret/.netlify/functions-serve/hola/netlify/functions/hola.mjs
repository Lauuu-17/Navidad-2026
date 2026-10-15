
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// netlify/functions/hola.js
var hola_default = async (request, context) => {
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
export {
  hola_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvaG9sYS5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiZXhwb3J0IGRlZmF1bHQgYXN5bmMgKHJlcXVlc3QsIGNvbnRleHQpID0+IHtcclxuICByZXR1cm4gbmV3IFJlc3BvbnNlKFxyXG4gICAgSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICBtZW5zYWplOiBcIlBydWViYSBjb3JyZWN0YVwiXHJcbiAgICB9KSxcclxuICAgIHtcclxuICAgICAgc3RhdHVzOiAyMDAsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIlxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgKTtcclxufTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7OztBQUFBLElBQU8sZUFBUSxPQUFPLFNBQVMsWUFBWTtBQUN6QyxTQUFPLElBQUk7QUFBQSxJQUNULEtBQUssVUFBVTtBQUFBLE1BQ2IsU0FBUztBQUFBLElBQ1gsQ0FBQztBQUFBLElBQ0Q7QUFBQSxNQUNFLFFBQVE7QUFBQSxNQUNSLFNBQVM7QUFBQSxRQUNQLGdCQUFnQjtBQUFBLE1BQ2xCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRjsiLAogICJuYW1lcyI6IFtdCn0K
