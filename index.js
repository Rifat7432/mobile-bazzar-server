const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();


const port = process.env.PORT || 5000;
const app = express();

// middle wears

app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unAuthorized");
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ massage: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
};

app.get("/", (req, res) => {
  res.send("backend is working");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.rdtrwss.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    const ProductCategory = client.db("Assignment-12").collection("Categories");
    const UsersCollection = client.db("Assignment-12").collection("Users");
   app.get('/categories',async(req,res)=>{
    const result = await ProductCategory.find({}).toArray()
    res.send(result)
   })
   app.post("/users", async (req, res) => {
    const user = req.body;
    const result = await UsersCollection.insertOne(user);
    res.send(result);
  });
   app.get("/jwt", async (req, res) => {
    const email = req.query.email;
    const query = {
      email: email,
    };
    const user = await UsersCollection.find(query);
    if (user) {
      const token = jwt.sign({ email }, process.env.ACCESS_SECRET_TOKEN, {
        expiresIn: "7d",
      });
      return res.send({ accessToken: token });
    }
    res.status(401).send({ accessToken: "" });
  });
  
   
  } finally {
  }
};
run().catch(console.dir);

app.listen(port, () => console.log(`server is running on ${port}`));
