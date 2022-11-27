const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SK);

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
    //collections
    const ProductCategory = client.db("Assignment-12").collection("Categories");
    const UsersCollection = client.db("Assignment-12").collection("Users");
    const ProductsCollection = client
      .db("Assignment-12")
      .collection("Products");
    const OrdersCollection = client.db("Assignment-12").collection("Orders");
    const PaymentCollection = client.db("Assignment-12").collection("Payment");
    //category
    app.get("/categories", async (req, res) => {
      const result = await ProductCategory.find({}).toArray();
      res.send(result);
    });
    //users
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await UsersCollection.insertOne(user);
      res.send(result);
    });
    app.get("/usersSeller/:role", async (req, res) => {
      const role = req.params.role;
      const query = {
        role: role,
      };
      const result = await UsersCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/seller", async (req, res) => {
      const email = req.query.email;
      const role = req.query.role;

      const query = {
        email: email,
        role: role,
      };
      const result = await UsersCollection.findOne(query);
      res.send(result);
    });
    app.get("/seller/:email", async (req, res) => {
      const email = req.params.email;

      const query = {
        email: email,
      };
      const result = await UsersCollection.findOne(query);
      res.send(result);
    });
    app.get("/usersBuyer/:role", async (req, res) => {
      const role = req.params.role;
      const query = {
        role: role,
      };
      const result = await UsersCollection.find(query).toArray();
      res.send(result);
    });
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await UsersCollection.deleteOne(query);
      res.send(result);
    });
    app.put('/users/:email', async (req, res) => {
      const email = req.params.email;
      console.log(email)
      const verified = req.body
      const filter = { email : email };
      const updateDoc = {
        $set: {
          verified:verified.verified
        },
      };
      const updateProductDoc = {
        $set:{
          sellerVerified:verified.verified
        }
      }
      const update = await UsersCollection.updateOne(filter, updateDoc);
      const updateProduct = await ProductsCollection.updateMany(filter, updateProductDoc);
      console.log(update,updateProduct)
      res.send(update)
    })
    //Products
    app.post("/products", async (req, res) => {
      const Products = req.body;
      const result = await ProductsCollection.insertOne(Products);
      res.send(result);
    });
    app.put('/product/:id', async (req, res) => {
      const id = req.params.id;
      const advertise = req.body
      const filter = { _id :ObjectId(id) };
      const option = {upsert:true}
      const updateProductDoc = {
        $set:{
          advertise:advertise.advertise
        }
      }
      const updateProduct = await ProductsCollection.updateMany(filter, updateProductDoc,option);
      res.send(updateProduct)
    })
    app.get("/products/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await ProductsCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/categoryProducts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { categoryId: id, status: "available" };
      const result = await ProductsCollection.find(query).toArray();
      res.send(result);
    });
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: ObjectId(id) };
      const result = await ProductsCollection.deleteOne(query);
      res.send(result);
    });
    //orders
    app.get("/order/:email", async (req, res) => {
      const email = req.params.email;
      const query = { buyerEmail: email };
      const result = await OrdersCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/orderPayment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await OrdersCollection.findOne(query);
      res.send(result);
    });
    app.post("/order", async (req, res) => {
      const booking = req.body;
      const result = await OrdersCollection.insertOne(booking);
      res.send(result);
    });
    //Payment
    app.post("/payment", async (req, res) => {
      const payment = req.body;
      const result = await PaymentCollection.insertOne(payment);
      const id = payment.orderId;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const update = await OrdersCollection.updateOne(filter, updateDoc);
      const productId = payment.productId;
      const query = { _id: ObjectId(productId) };
      const updateProduct = {
        $set: {
          status: "sold",
        },
      };
      const Update = await OrdersCollection.updateOne(query, updateProduct);
      res.send(result);
    });
    //jwt
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
    app.post("/create-payment-intent", async (req, res) => {
      const order = req.body;
      const price = order.productPrice;
      const amount = price;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    app.get("/status", async (req, res) => {
      const filter = {};
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          paid: false,
        },
      };
      const result = await OrdersCollection.updateMany(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
  } finally {
  }
};
run().catch(console.dir);

app.listen(port, () => console.log(`server is running on ${port}`));
