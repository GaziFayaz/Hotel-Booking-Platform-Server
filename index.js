require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
	cors({
		origin: ["http://localhost:5173"],
	})
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.udmqtzd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});
async function run() {
	try {
		const userCollection = client
			.db("B9A11-Hotel-Booking-Platform")
			.collection("users");
		const roomCategoriesCollection = client
			.db("B9A11-Hotel-Booking-Platform")
			.collection("roomCategories");
		const bookingsCollection = client
			.db("B9A11-Hotel-Booking-Platform")
			.collection("bookings");

		app.get("/users", async (req, res) => {
			const cursor = userCollection.find();
			const result = await cursor.toArray();
			res.send(result);
		});

		app.get("/users-count", async (req, res) => {
			const cursor = userCollection.find();
			const result = await cursor.toArray();
			res.send(result);
		});

		app.get("/user/:uid", async (req, res) => {
			const uid = req.params.uid;
			const query = { firebase_uid: uid };
			const result = await userCollection.findOne(query);
			// console.log(result)
			res.send(result);
		});

		app.post("/user", async (req, res) => {
			const newUser = req.body;
			// console.log(newUser)
			const result = await userCollection.insertOne(newUser);
			res.send(result);
		});

		app.post("/user-book-room/:uid", async (req, res) => {
      
      console.log("in update user with new room booking")
			const uid = req.params.uid;
			const roomId = req.body.roomId;
			const query = { firebase_uid: uid };
			// console.log("query", query)
			// console.log(req.body.insertedId)
			// console.log(uid)
			const update = {
				$push: { bookings: roomId },
			};
			// console.log(update)
			// const  result = await userCollection.findOne(query)
			const result = await userCollection.updateOne(query, update);
			// console.log(result)
			res.send(result);
		});

		app.get("/bookings", async (req, res) => {
      
      console.log("in bookings")
			const result = await bookingsCollection.find().toArray();
			res.send(result);
		});

		app.post("/booking", async (req, res) => {
      console.log("in booking")
      console.log(req.body)
			const newBooking = req.body;
			// console.log(newBooking)
			const result = await bookingsCollection.insertOne(newBooking);
			res.send(result);
		});

		app.get("/room-categories", async (req, res) => {
			let option = {};
			if (req.query?.sorted === "true") {
				// console.log(req.query.sorted)
				option = { sort: { price_per_night: 1 } };
			} else {
				option = {};
			}
			const result = await roomCategoriesCollection.find({}, option).toArray();
			res.send(result);
		});
		app.get("/room/:_id", async (req, res) => {
			const _id = req.params._id;
			// console.log(_id)
			const query = { _id: new ObjectId(_id) };
			const result = await roomCategoriesCollection.findOne(query);
			// console.log(result)
			res.send(result);
		});

    app.post("/book-room/:roomId", async (req,res) => {
      
      console.log("in book room") 
      const roomId = req.params.roomId
      const query = { _id: new ObjectId(roomId)}
      const result = await roomCategoriesCollection.updateOne(query, {$set: {availability: "Not Available"}});
      res.send(result);
    })

		// Send a ping to confirm a successful connection
		await client.db("admin").command({ ping: 1 });
		console.log(
			"Pinged your deployment. You successfully connected to MongoDB!"
		);
	} finally {
		// Ensures that the client will close when you finish/error
	}
}
run().catch(console.dir);

app.get(`/`, (req, res) => {
	res.send("Server is running");
});

app.listen(port, () => {
	console.log(`Server is running on port: ${port}`);
});
