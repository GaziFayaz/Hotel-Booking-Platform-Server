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
		const roomCategoriesCollection = client
			.db("B9A11-Hotel-Booking-Platform")
			.collection("roomCategories");

		app.get("/room-categories", async (req, res) => {
      let option = {}
			if (req.query?.sorted==="true") {
        // console.log(req.query.sorted)
				option = {sort:{price_per_night: 1}}
			} else {
        option = {}
			}
			const result = await roomCategoriesCollection.find({}, option).toArray();
			res.send(result);
		});
		app.get("/room/:_id", async (req, res) => {
			const _id = req.params._id
			// console.log(_id)
			const query = { _id: new ObjectId(_id)}
			const result = await roomCategoriesCollection.findOne(query)
			// console.log(result)
			res.send(result)
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
