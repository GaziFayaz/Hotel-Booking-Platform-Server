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
    const reviewCollection = client
    .db("B9A11-Hotel-Booking-Platform")
    .collection("reviews");

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
			const uid = req.params.uid;
			const roomId = req.body.roomId;
			const query = { firebase_uid: uid };
			const update = {
				$push: { bookings: roomId },
			};
			const result = await userCollection.updateOne(query, update);
			res.send(result);
		});

		app.get("/bookings", async (req, res) => {
			const result = await bookingsCollection.find().toArray();
			res.send(result);
		});

		app.get("/user-bookings/:uid", async (req, res) => {
			const uid = req.params.uid;
			const user = await userCollection.findOne({ firebase_uid: uid });
			const bookingIds = user.bookings;
			// console.log(bookingIds);
			const promises = bookingIds.map(async (bookingId) => {
				const booking = await bookingsCollection.findOne({
					_id: new ObjectId(bookingId),
				});
				// console.log("booking", booking);
				const room = await roomCategoriesCollection.findOne({
					category: booking.room,
				});
				return { ...room, ...booking };
			});
			const data = await Promise.all(promises);
			res.send(data);
		});

		app.post("/booking", async (req, res) => {
			const newBooking = req.body;
			// console.log(newBooking)
			const result = await bookingsCollection.insertOne(newBooking);
			res.send(result);
		});

		app.post("/update-booking-date/:_id", async (req, res) => {
			const _id = req.params._id
			const date = req.body.date;
			console.log(date)
			const query = { _id: new ObjectId(_id) };
			const update = {
				$set: { date: date },
			};
			const result = await bookingsCollection.updateOne(query, update, {upsert: true});
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

		app.post("/book-room/:roomId", async (req, res) => {
			const roomId = req.params.roomId;
			const query = { _id: new ObjectId(roomId) };
			const result = await roomCategoriesCollection.updateOne(query, {
				$set: { availability: "Not Available" },
			});
			res.send(result);
		});

		app.post("/unbook-room/:room", async (req, res) => {
			const room = req.params.room
			const query = { category: room}
			const result = await roomCategoriesCollection.updateOne(query, {
				$set: { availability: "Available"},
			})
			// console.log("unbook", result)
			res.send(result)
		})

		app.post("/user-cancel-book/:uid", async(req, res) => {
			const uid = req.params.uid
			const bookingId = req.body.bookingId
			const query = {firebase_uid: uid}
			const update = {$pull: {bookings: bookingId}}
			const result = await userCollection.updateOne(query, update)
			// console.log("booking removed from user bookings array", result)
      res.send(result)
		})

		app.delete("/delete-book/:_id", async (req, res) => {
			const _id = req.params._id
			const query = {_id: new ObjectId(_id)}
			const result = await bookingsCollection.deleteOne(query)
			// if (result.deletedCount === 1) {
      //   console.log("Successfully deleted one document.", result);
      // } else {
      //   console.log("No documents matched the query. Deleted 0 documents.", result);
      // }
      res.send(result)
		})

		app.get("/all-reviews", async(req, res) => {
			const result = await reviewCollection.find().toArray()
			res.send(result)
		})

		app.get("/room-reviews/:room", async (req, res) => {
			const room = req.params.room
			const roomData = await roomCategoriesCollection.findOne({category: room})
			const reviewIds = roomData.reviews.map(reviewId => new ObjectId(reviewId))
			console.log(reviewIds)
			const query = { _id: {$in: reviewIds}}
			const reviews = await reviewCollection.find(query).toArray()
			console.log(reviews)
			res.send(reviews)
		})

    app.post("/add-review", async (req, res) => {
      const review = req.body
      const result = await reviewCollection.insertOne(review)
      res.send(result)
    })

    app.post("/add-review-to-user/:uid", async(req, res) => {
      const uid = req.params.uid
      const reviewId = req.body.reviewId
      const query = {firebase_uid: uid}
      const update = {$push: {reviews: reviewId}}
      const result = await userCollection.updateOne(query, update)
      res.send(result)
    })

    app.post("/add-review-to-room/:room", async(req, res) => {
      const room = req.params.room
      const reviewId = req.body.reviewId
      const query = {category: room}
      const update = {$push: {reviews: reviewId}}
      const result = await roomCategoriesCollection.updateOne(query, update)
      res.send(result)
    })

    app.post("/booking-reviewed/:bookingId", async(req, res) => {
      const _id = req.params.bookingId
      const query = {_id: new ObjectId(_id)}
      const update = {$set: {reviewed:true}}
      const result = await bookingsCollection.updateOne(query, update)
      console.log(result)
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
