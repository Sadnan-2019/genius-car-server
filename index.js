const express = require("express");

const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
var jwt = require("jsonwebtoken");

require("dotenv").config();

const port = process.env.PORT || 5000;
const app = express();

// use middleware

app.use(cors());
app.use(express.json());

function veriFyJWT(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "unauthorization access" });
  }

  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCSESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "forbiden acesss" });
    }
    console.log("decoded", decoded);
    req.decoded = decoded;
    next();
  });
  
  console.log("authorization inside header", authorization);
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fx7vs.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("giniusCar").collection("service");
    const orderCollection = client.db("giniusCar").collection("order");

    //AUTH

    app.post("/login", async (req, res) => {
      const user = req.body;
      // const accesToken = jwt.sign({})

      const accesToken = jwt.sign(user, process.env.ACCSESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send(accesToken);
    });

    ///SERVICE
    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    app.post("/service", async (req, res) => {
      const addService = req.body;

      const result = await serviceCollection.insertOne(addService);
      res.send(result);
    });

    app.delete("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };

      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });
    app.post("/order", async (req, res) => {
      const addOrder = req.body;
      const result = await orderCollection.insertOne(addOrder);
      res.send(result);
    });

    app.get("/order", veriFyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;

      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);
      }else{

        return res.status(403).send({message : "Email not match"})

      }
      console.log(email)

      
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Genious Resourcing is runing");
});

app.listen(port, () => {
  console.log("Listening to port", port);
});
