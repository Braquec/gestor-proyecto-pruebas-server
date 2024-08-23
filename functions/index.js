const {Timestamp} = require("firebase-admin/firestore");
const functions = require("firebase-functions");
const express = require("express");
const app = express();
const admin = require("firebase-admin");
const cors = require("cors");
const serviceAccount = require("./serviceAccountKey.json");
const Joi = require("joi");

const taskSchema = Joi.object({
  user: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  status: Joi.string(),
});

const updateTaskSchema = Joi.object({
  user: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  status: Joi.string().required(),
  dateCreated: Joi.required(),
  id: Joi.optional(),
  dateUpdated: Joi.optional(),
});

const userSchema = Joi.object({
  email: Joi.string().email().required(),
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const validateSchema = (schema) => (req, res, next) => {
  const {error, value} = schema.validate(req.body);
  if (error) {
    return res.status(400).json({error: error.details});
  } else {
    req.validatedBody = value;
    next();
  }
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const getDocFromFirestore = async (route) => {
  const doc = await db.doc(route).get();
  if (!doc.exists) {
    return {status: 404, message: "Item no encontrado"};
  }
  return {status: 200, data: {id: doc.id, ...doc.data()}};
};


app.use(cors({origin: true}));

app.get("/users/:email", async (req, res) => {
  const result = await getDocFromFirestore("users/" + req.params.email);
  res.status(result.status).json(result.message || result.data);
});

app.post("/users",
    validateSchema(userSchema),
    asyncHandler(async (req, res) => {
      const data = {...req.validatedBody, dateCreated: Timestamp.now()};
      const result = await db.collection("users").doc(data.email).create(data);
      res.status(201).json({id: result.id});
    }));

app.get("/tasks/:taskId", asyncHandler(async (req, res, next) => {
  const result = await getDocFromFirestore("tasks/" + req.params.taskId);
  res.status(result.status).json(result.message || result.data);
}));

app.get("/tasks", asyncHandler(async (req, res, next) => {
  const snapshot = await db.collection("tasks")
      .orderBy("dateCreated", "asc").get();
  const data = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  res.status(200).json([...data]);
}));

app.post("/tasks",
    validateSchema(taskSchema),
    asyncHandler(async (req, res) => {
      const data = {
        ...req.validatedBody,
        dateCreated: Timestamp.now(),
      };
      const result = await db.collection("tasks").add(data);
      res.status(201).json({id: result.id, path: result.path});
    }));

app.put("/tasks/:taskId",
    validateSchema(updateTaskSchema),
    asyncHandler(async (req, res, next) => {
      const docref = db.doc("tasks/" + req.params.taskId);
      const doc = await docref.get();
      const data = {
        ...req.body,
        dateUpdated: Timestamp.now(),
        dateCreated: new Timestamp(req.body.dateCreated._seconds,
            req.body.dateCreated._nanoseconds),
      };

      if (!doc.exists) {
        return res.status(404)
            .json({
              id: req.params.taskId,
              msm: "El documento no existe",
            });
      }
      const docUpdateResult = await docref.update(data);
      return res.status(200)
          .json({
            dateUpdate: docUpdateResult.writeTime,
            msm: "El documento se actualizo correctamente",
          });
    },
    ));

app.delete("/tasks/:taskId",
    asyncHandler(async (req, res, next) => {
      const docref = db.doc("tasks/" + req.params.taskId);
      const doc = await docref.get();
      if (!doc.exists) {
        return res.status(404)
            .json({
              id: req.params.taskId,
              msm: "El documento no existe",
            });
      }
      await docref.delete();
      return res.status(204).json();
    }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (String(err.message).includes("ALREADY_EXISTS")) {
    res.status(409).send({error: "ALREADY_EXISTS"});
  } else {
    res.status(500).json({
      error: "Error en el servidor",
      details: err.message,
    });
  }
});

exports.app = functions.https.onRequest(app);
