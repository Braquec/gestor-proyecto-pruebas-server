/* eslint-disable */
const functions = require("firebase-functions");
const express = require("express");
const app = express();
const admin = require("firebase-admin");
const cors = require("cors");
const serviceAccount = require("./serviceAccountKey.json");
const { FieldValue } = require("firebase-admin/firestore");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors({ origin: true }));
const db = admin.firestore();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const getDocFromFirestore = async (route) => {
  const doc = await db.doc(route).get();
  if (!doc.exists) {
    return { status: 404, message: "Item no encontrado" };
  }
  return {
    status: 200,
    data: { id: doc.id, ...doc.data(), doc: "Esta es una prueba" },
  };
};

// Calcular métricas globales por id de proyecto
async function calcularMetricaProyecto(id) {
  const proyectoRef = db.collection("proyectos").doc(id);
  const doc = await proyectoRef.get();

  if (!doc.exists) {
    return res.status(404).json({ message: "Proyecto no encontrado" });
  }

  const proyectoData = doc.data();

  let totalHitos = proyectoData.Hito.length;
  let totalPruebas = 0;
  let totalDefectos = 0;
  let defectosAbiertos = 0;
  let defectosCerrados = 0;

  // Contar pruebas y defectos
  proyectoData.Hito.forEach((hito) => {
    totalPruebas += hito.Prueba.length;

    hito.Prueba.forEach((prueba) => {
      totalDefectos += prueba.Defecto.length;

      prueba.Defecto.forEach((defecto) => {
        if (
          defecto.Estado === "En proceso" ||
          defecto.Estado === "Planificado"
        ) {
          defectosAbiertos += 1;
        } else if (defecto.Estado === "Completado") {
          defectosCerrados += 1;
        }
      });
    });
  });

  let pruebasConDefectos = proyectoData.Hito.reduce((count, hito) => {
    return (
      count + hito.Prueba.filter((prueba) => prueba.Defecto.length > 0).length
    );
  }, 0);

  let porcentajePruebasConDefectos = (pruebasConDefectos / totalPruebas) * 100;

  return {
    totalHitos,
    totalPruebas,
    totalDefectos,
    defectosAbiertos,
    defectosCerrados,
    porcentajePruebasConDefectos,
  };
}
// Calcular métricas globales a partir de todos los proyectos
async function calcularMetricasPorProyecto() {
  const proyectos = [];
  try {
    const proyectosSnapshot = await db.collection("proyectos").get();

    proyectosSnapshot.forEach((doc) => {
      proyectos.push({ id: doc.id, ...doc.data() });
    });
  } catch (error) {
    console.error("Error al obtener los proyectos:", error);
  }
  let metricasGlobales = proyectos.map((proyecto) => {
    let totalHitos = 0;
    let totalPruebas = 0;
    let totalDefectos = 0;
    let defectosAbiertos = 0;
    let defectosCerrados = 0;

    totalHitos += proyecto.Hito.length;
    proyecto.Hito.forEach((hito) => {
      totalPruebas += hito.Prueba.length;

      hito.Prueba.forEach((prueba) => {
        totalDefectos += prueba.Defecto.length;

        prueba.Defecto.forEach((defecto) => {
          if (
            defecto.Estado === "En proceso" ||
            defecto.Estado === "Planificado"
          ) {
            defectosAbiertos += 1;
          } else if (defecto.Estado === "Completado") {
            defectosCerrados += 1;
          }
        });
      });
    });

    let pruebasConDefectos = proyecto.Hito.reduce((count, hito) => {
      return (
        count + hito.Prueba.filter((prueba) => prueba.Defecto.length > 0).length
      );
    }, 0);

    let porcentajePruebasConDefectos =
      (pruebasConDefectos / totalPruebas) * 100;

    return {
      nombreProyecto: proyecto.Proyecto,
      totalHitos,
      totalPruebas,
      totalDefectos,
      defectosAbiertos,
      defectosCerrados,
      porcentajePruebasConDefectos,
    };
  });

  return metricasGlobales;
}

// Calcular métricas globales a partir de todos los proyectos
async function calcularMetricasGlobales() {
  const proyectos = [];
  let totalHitos = 0;
  let totalPruebas = 0;
  let totalDefectos = 0;
  let defectosAbiertos = 0;
  let defectosCerrados = 0;
  let totalPruebasErroneas = 0;
  let totalPruebasExitosas = 0;
  let totalPruebasPendientes = 0;

  try {
    const proyectosSnapshot = await db.collection("proyectos").get();

    proyectosSnapshot.forEach((doc) => {
      proyectos.push({ id: doc.id, ...doc.data() });
    });
  } catch (error) {
    console.error("Error al obtener los proyectos:", error);
  }

  proyectos.forEach((proyecto) => {
    totalHitos += proyecto.Hito.length;
    proyecto.Hito.forEach((hito) => {
      totalPruebas += hito.Prueba.length;

      hito.Prueba.forEach((prueba) => {
        totalDefectos += prueba.Defecto.length;

        prueba.Defecto.forEach((defecto) => {
          if (
            defecto.Estado === "En proceso" ||
            defecto.Estado === "Planificado"
          ) {
            defectosAbiertos += 1;
          } else if (defecto.Estado === "Completado") {
            defectosCerrados += 1;
          }
        });
      });
      hito.Prueba.forEach((prueba) => {
        if (prueba.Resultado == "Exitoso") {
          totalPruebasExitosas += 1;
        } else if (prueba.Resultado == "Erroneo") {
          totalPruebasErroneas += 1;
        } else {
          totalPruebasPendientes += 1;
        }
      });
    });
    /*let pruebasConDefectos = proyectos.Hito?.reduce((count, hito) => {
    return (
      count + hito.Prueba?.filter((prueba) => prueba.Defecto?.length > 0).length
    );
  }, 0);*/

    //let porcentajePruebasConDefectos = (pruebasConDefectos / totalPruebas) * 100;
  });

  return {
    totalProyectos: proyectos.length,
    totalHitos,
    totalPruebas,
    totalDefectos,
    defectosAbiertos,
    defectosCerrados,
    totalPruebasExitosas,
    totalPruebasErroneas,
    totalPruebasPendientes,
  };
}

app.get("/api/proyecto/metricas/all", async (req, res) => {
  try {
    const metricas = await calcularMetricasGlobales();
    res.json(metricas);
  } catch (error) {
    res.status(500).send("Error al obtener métricas" + error);
  }
});

app.get("/api/proyecto/metricas/:id", async (req, res) => {
  try {
    const metricas = await calcularMetricaProyecto(req.params.id);
    res.json(metricas);
  } catch (error) {
    res.status(500).send("Error al obtener métricas" + error);
  }
});

app.get("/api/proyecto/metricas", async (req, res) => {
  try {
    const metricas = await calcularMetricasPorProyecto();
    res.json(metricas);
  } catch (error) {
    res.status(500).send("Error al obtener métricas" + error);
  }
});

app.post("/api/register", async (req, res) => {
  const { email, password, username } = req.body;

  try {
    //Crear usuario en bd
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: username,
    });
    await db.collection("users").doc(userRecord.uid).set({
      username: username,
      email: email,
    });
    res.status(201).json({ message: "Usuario registrado exitosamente" });
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    if (userRecord) {
      const customToken = await admin.auth().createCustomToken(userRecord.uid);
      res.status(200).json({ token: customToken });
    }
  } catch (error) {
    console.error("Error en el inicio de sesión:", error);
    res.status(400).json({ message: "Error en el inicio de sesión" });
  }
});

//api/proyectos
app.get(
  "/api/proyectos",
  asyncHandler(async (req, res, next) => {
    const snapshot = await db.collection("proyectos").get();
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json([...data]);
  })
);

app.post("/api/proyectos", async (req, res) => {
  try {
    const newProject = req.body;
    const docRef = await db.collection("proyectos").add(newProject);
    res.status(201).json({ id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: "Error al crear proyecto" });
  }
});

app.delete("/api/proyectos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection("proyectos").doc(id).delete();
    res.status(200).json({ message: "Proyecto eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar proyecto" });
  }
});

//api/proyectos/:id
app.get(
  "/api/proyectos/:id",
  asyncHandler(async (req, res, next) => {
    const result = await getDocFromFirestore("proyectos/" + req.params.id);
    res.status(result.status).json(result.message || result.data);
  })
);

app.put("/api/proyectos/:id", async (req, res) => {
  const proyectoRef = db.collection("proyectos").doc(req.params.id);
  const doc = await proyectoRef.get();

  if (!doc.exists) {
    return res.status(404).json({ message: "Proyecto no encontrado" });
  }

  await proyectoRef.update(req.body);

  return res.status(200).json({
    msg: "El documento se actualizo correctamente",
  });
});

//hito
app.post("/api/proyectos/:id/hito", async (req, res, next) => {
  const projectId = req.params.id;
  const {
    Descripcion,
    Propietario,
    Fecha_inicio,
    Fecha_fin,
    Estado,
    Porcentaje,
  } = req.body;

  try {
    const projectRef = db.collection("proyectos").doc(projectId);

    const newHito = {
      Descripcion: Descripcion || "Nuevo hito",
      Propietario: Propietario || "Sin asignar",
      Fecha_inicio: Fecha_inicio || "",
      Fecha_fin: Fecha_fin || "",
      Estado: Estado || "Planificado",
      Porcentaje: Porcentaje || "",
      Prueba: [],
    };

    await projectRef.update({
      Hito: FieldValue.arrayUnion(newHito),
    });

    res
      .status(200)
      .json({ message: "Hito agregado correctamente al proyecto" });
  } catch (error) {
    console.error("Error al agregar hito:", error);
    res.status(500).json({ message: "Error al agregar hito" });
  }
});

app.delete("/api/proyectos/:id/hito/:indexHito", async (req, res, next) => {
  const proyectoId = req.params.id;
  const indexHito = req.params.indexHito;
  try {
    const proyectoRef = db.collection("proyectos").doc(proyectoId);
    const doc = await proyectoRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    const proyectoData = doc.data();
    const Hito = proyectoData.Hito || [];

    if (!Hito[indexHito]) {
      return res
        .status(404)
        .json({ message: "Hito no encontrado en el índice especificado" });
    }

    //Eliminar el hito mediante el index
    Hito.splice(indexHito, 1);

    // Guardar los cambios en Firebase
    await proyectoRef.update({ Hito });

    res.status(200).json({
      message: "Hito eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar la prueba:", error);
    res.status(500).json({ message: "Error al eliminar la prueba" });
  }
});

///api/proyectos/:id/hito/:indexHito
app.put("/api/proyectos/:id/hito/:indexHito", async (req, res, next) => {
  const proyectoId = req.params.id;
  const indexHito = req.params.indexHito;
  const nuevoHito = req.body;

  try {
    const proyectoRef = db.collection("proyectos").doc(proyectoId);
    const doc = await proyectoRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    const proyectoData = doc.data();
    const Hito = proyectoData.Hito || [];

    if (!Hito[indexHito]) {
      return res
        .status(404)
        .json({ message: "Hito no encontrado en el índice especificado" });
    }
    Hito[indexHito] = nuevoHito;
    // Guardar los cambios en Firebase
    await proyectoRef.update({ Hito });

    res.status(200).json({
      message: "Hito actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar el hito:", error);
    res.status(500).json({ message: "Error al actualizar el hito" });
  }
});

//api/recursos
app.get(
  "/api/recursos",
  asyncHandler(async (req, res, next) => {
    const snapshot = await db.collection("proyectos").get();
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json([...data]);
  })
);

app.get("/api/proyectos/:id/recurso", async (req, res) => {
  const { id } = req.params;

  try {
    const proyectoRef = db.collection("proyectos").doc(id);
    const doc = await proyectoRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    const proyectoData = doc.data();
    const recursos = proyectoData.Recurso || [];

    return res.status(200).json(recursos); // Devolvemos los recursos
  } catch (error) {
    console.error("Error al obtener los recursos:", error);
    return res.status(500).json({ message: "Error al obtener los recursos" });
  }
});

app.post("/api/proyectos/:id/recurso", async (req, res, next) => {
  const projectId = req.params.id;
  const { Nombre, Rol } = req.body;

  try {
    const projectRef = db.collection("proyectos").doc(projectId);

    const newRecurso = {
      Nombre: Nombre || "Recurso",
      Rol: Rol || "Sin asignar",
    };

    await projectRef.update({
      Recurso: FieldValue.arrayUnion(newRecurso),
    });

    res
      .status(200)
      .json({ message: "Recurso agregado correctamente al proyecto" });
  } catch (error) {
    console.error("Error al agregar recurso:", error);
    res.status(500).json({ message: "Error al agregar recurso" });
  }
});

app.get("/api/proyectos/:id/prueba", async (req, res) => {
  const { id } = req.params;

  try {
    const proyectoRef = db.collection("proyectos").doc(id);
    const doc = await proyectoRef.get();

    if (!doc.exists) {
      return res.status(404).json({ messasge: "Proyecto no encontrado" });
    }

    const proyectoData = doc.data();
    //accedo al array de hitos
    const hitos = proyectoData.Hito || [];

    return res.status(200).json({ proyecto: proyectoData.Proyecto, hitos });
  } catch (error) {
    console.error("Error al obtener el proyecto:", error);
    return res.status(500).json({ message: "Error al obtener el proyecto" });
  }
});
//api/proyectos/:id/hito/:indexHito/prueba
app.post(
  "/api/proyectos/:id/hito/:indexHito/prueba",
  async (req, res, next) => {
    const proyectoId = req.params.id;
    const indexHito = req.params.indexHito;
    const {
      Nombre,
      Estado,
      Propietario,
      Fecha_inicio,
      Fecha_fin,
      Comentario,
      Archivo_adjunto,
      Criterio_aceptacion,
      Resultado,
      Defecto,
    } = req.body;

    try {
      const newPrueba = {
        Nombre: Nombre || "Nueva prueba",
        Estado: Estado || "Planificado",
        Fecha_inicio: Fecha_inicio || "",
        Propietario: Propietario || "",
        Fecha_fin: Fecha_fin || "",
        Comentario: Comentario || "Planificado",
        Archivo_adjunto: Archivo_adjunto || "",
        Criterio_aceptacion: Criterio_aceptacion || "",
        Resultado: Resultado || "",
        Defecto: Defecto || "",
      };

      const proyectoRef = db.collection("proyectos").doc(proyectoId);
      const doc = await proyectoRef.get();

      if (!doc.exists) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      const proyectoData = doc.data();
      const Hito = proyectoData.Hito || [];

      if (!Hito[indexHito]) {
        return res
          .status(404)
          .json({ message: "Hito no encontrado en el índice especificado" });
      }

      console.log(Hito[indexHito].Descripcion);

      // Acceder al MAP de pruebas dentro del hito seleccionado
      const prueba = Hito[indexHito].Prueba || {};

      // Generar un nuevo ID para la prueba o actualizar una existente
      const newPruebaId = `${Object.keys(prueba).length}`;

      console.error("NewPruebaID:", newPruebaId);

      // Actualizar el MAP de pruebas
      prueba[newPruebaId] = newPrueba;

      // Actualizar el hito con el nuevo MAP de pruebas
      Hito[indexHito].Prueba = prueba;

      // Guardar los cambios en Firebase
      await proyectoRef.update({ Hito });

      res.status(200).json({
        message: "Prueba agregada correctamente al proyecto",
      });
    } catch (error) {
      console.error("Error al agregar la prueba:", error);
      res.status(500).json({ message: "Error al agregar la prueba" });
    }
  }
);
//api/proyectos/:id/hito/:indexHito/prueba/:indexPrueba
app.put(
  "/api/proyectos/:id/hito/:indexHito/prueba/:indexPrueba",
  async (req, res, next) => {
    const proyectoId = req.params.id;
    const indexHito = req.params.indexHito;
    const indexPrueba = req.params.indexPrueba;
    const nuevaPrueba = req.body;

    try {
      const proyectoRef = db.collection("proyectos").doc(proyectoId);
      const doc = await proyectoRef.get();

      if (!doc.exists) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      const proyectoData = doc.data();
      const Hito = proyectoData.Hito || [];

      if (!Hito[indexHito]) {
        return res
          .status(404)
          .json({ message: "Hito no encontrado en el índice especificado" });
      }

      // Acceder al MAP de pruebas dentro del hito seleccionado
      const prueba = Hito[indexHito].Prueba || {};

      prueba[indexPrueba] = nuevaPrueba;

      // Guardar los cambios en Firebase
      await proyectoRef.update({ Hito });

      res.status(200).json({
        message: "Prueba actualizada correctamente",
      });
    } catch (error) {
      console.error("Error al eliminar la prueba:", error);
      res.status(500).json({ message: "Error al eliminar la prueba" });
    }
  }
);

//api/proyectos/:id/hito/:indexHito/prueba/:indexPrueba
app.delete(
  "/api/proyectos/:id/hito/:indexHito/prueba/:indexPrueba",
  async (req, res, next) => {
    const proyectoId = req.params.id;
    const indexHito = req.params.indexHito;
    const indexPrueba = req.params.indexPrueba;

    try {
      const proyectoRef = db.collection("proyectos").doc(proyectoId);
      const doc = await proyectoRef.get();

      if (!doc.exists) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      const proyectoData = doc.data();
      const Hito = proyectoData.Hito || [];

      if (!Hito[indexHito]) {
        return res
          .status(404)
          .json({ message: "Hito no encontrado en el índice especificado" });
      }

      // Acceder al MAP de pruebas dentro del hito seleccionado
      const prueba = Hito[indexHito].Prueba || {};

      //Eliminar la prueba
      prueba.splice(indexPrueba, 1);
      // Actualizar el hito con el nuevo MAP de pruebas
      Hito[indexHito].Prueba = prueba;

      // Guardar los cambios en Firebase
      await proyectoRef.update({ Hito });

      res.status(200).json({
        message: "Prueba eliminado correctamente",
      });
    } catch (error) {
      console.error("Error al eliminar la prueba:", error);
      res.status(500).json({ message: "Error al eliminar la prueba" });
    }
  }
);

//api/proyectos/:id/hito/:indexHito/prueba/:indexPrueba/defecto
app.get(
  "/api/proyectos/:id/hito/:indexHito/prueba/:indexPrueba/defecto",
  async (req, res) => {
    const id = req.params.id;
    const indexHito = req.params.indexHito;
    const indexPrueba = req.params.indexPrueba;

    try {
      const proyectoRef = db.collection("proyectos").doc(id);
      const doc = await proyectoRef.get();

      if (!doc.exists) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      const proyectoData = doc.data();
      //accedo al array de hitos
      const hitos = proyectoData.Hito || [];
      const pruebas = proyectoData.Hito[indexHito].Prueba || [];
      const defectos = pruebas[indexPrueba].Defecto || [];

      if (!hitos[indexHito] || !pruebas[indexPrueba]) {
        return res.status(404).json({
          message: "Hito o Prueba no encontrado en el índice especificado",
        });
      }

      return res.status(200).json({ prueba: pruebas[indexPrueba], defectos });
    } catch (error) {
      console.error("Error al obtener el proyecto:", error);
      return res.status(500).json({ message: "Error al obtener el proyecto" });
    }
  }
);

//api/proyectos/:id/hito/:indexHito/prueba/:indexPrueba/defecto
app.post(
  "/api/proyectos/:id/hito/:indexHito/prueba/:indexPrueba/defecto",
  async (req, res, next) => {
    const proyectoId = req.params.id;
    const indexHito = req.params.indexHito;
    const indexPrueba = req.params.indexPrueba;
    const { Nombre, Propietario, Estado, Resolucion, Resuelto } = req.body;

    try {
      const newDefecto = {
        Nombre: Nombre || "Nuevo defecto",
        Propietario: Propietario || "Planificado",
        Estado: Estado || "",
        Resolucion: Resolucion || "",
        Resuelto: Resuelto || "",
      };

      const proyectoRef = db.collection("proyectos").doc(proyectoId);
      const doc = await proyectoRef.get();

      if (!doc.exists) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      const proyectoData = doc.data();
      const Hito = proyectoData.Hito || [];

      if (!Hito[indexHito]) {
        return res
          .status(404)
          .json({ message: "Hito no encontrado en el índice especificado" });
      }

      // Acceder al MAP de pruebas dentro del hito seleccionado
      const prueba = Hito[indexHito].Prueba || {};

      const defecto = prueba[indexPrueba].Defecto || {};

      //Generar nuevo ID para Defecto
      const newDefectoID = `${Object.keys(defecto).length}`;
      console.error("newDefectoID:", newDefectoID);

      // Actualizar el MAP de pruebas
      defecto[newDefectoID] = newDefecto;

      // Actualizar el MAP de Defecto
      prueba[indexPrueba].Defecto = defecto;

      // Actualizar el hito con el nuevo MAP de pruebas
      Hito[indexHito].Prueba = prueba;

      // Guardar los cambios en Firebase
      await proyectoRef.update({ Hito });

      res.status(200).json({
        message: "Defecto agregado correctamente al proyecto",
      });
    } catch (error) {
      console.error("Error al agregar la prueba:", error);
      res.status(500).json({ message: "Error al agregar defecto" });
    }
  }
);

//api/proyectos/:id/hito/:indexHito/prueba/:indexPrueba/defecto
app.delete(
  "/api/proyectos/:id/hito/:indexHito/prueba/:indexPrueba/defecto/:indexDefecto",
  async (req, res, next) => {
    const proyectoId = req.params.id;
    const indexHito = req.params.indexHito;
    const indexPrueba = req.params.indexPrueba;
    const indexDefecto = req.params.indexDefecto;

    try {
      const proyectoRef = db.collection("proyectos").doc(proyectoId);
      const doc = await proyectoRef.get();

      if (!doc.exists) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      const proyectoData = doc.data();
      const Hito = proyectoData.Hito || [];

      if (!Hito[indexHito]) {
        return res
          .status(404)
          .json({ message: "Hito no encontrado en el índice especificado" });
      }

      // Acceder al MAP de pruebas dentro del hito seleccionado
      const prueba = Hito[indexHito].Prueba || {};

      const defecto = prueba[indexPrueba].Defecto || {};

      // Eliminar el defecto de la prueba
      defecto.splice(indexDefecto, 1);

      // Actualizar el MAP de Defecto
      prueba[indexPrueba].Defecto = defecto;

      // Actualizar el hito con el nuevo MAP de pruebas
      Hito[indexHito].Prueba = prueba;

      // Guardar los cambios en Firebase
      await proyectoRef.update({ Hito });

      res.status(200).json({
        message: "Defecto eliminado correctamente",
      });
    } catch (error) {
      console.error("Error al eliminar defecto:", error);
      res.status(500).json({ message: "Error al eliminar defecto" });
    }
  }
);

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (String(err.message).includes("ALREADY_EXISTS")) {
    res.status(409).send({ error: "ALREADY_EXISTS" });
  } else {
    res.status(500).json({
      error: "Error en el servidor",
      details: err.message,
    });
  }
});

exports.app = functions.https.onRequest(app);
