const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require("dotenv").config();

app.use(cors())
app.use(express.json())

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.7k1gh4c.mongodb.net/?appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


  const db = client.db('blood_db')
  const modelCollection = db.collection('donar_request')
  const userCollection = db.collection('users')
  const fundingCollection = db.collection('funding')
  const districtCollection = db.collection('district')
  const upazilaCollection = db.collection('upazila')


     
    //put method

    app.put("/pending-donations/:id",async(req,res)=>{
      const id = req.params.id;
      const {donationStatus,donorName,donorEmail}=req.body;

      console.log("put request id:",req.params.id);
      console.log("Request body",req.body);

      const result = await modelCollection.updateOne(
        {_id: new ObjectId(id)},
        {$set:{donationStatus,donorName,donorEmail}}
      );

      res.send({message:"Donation Updated Successfully"})

    })
  
    

    //post method 
    //insertMany
    //insertOne

   app.get('/all-donation-request',async(req,res)=>{

      const {status,page=1,limit=5} = req.query;

      let query = {};

      if(status && status !== "all"){
            query.donationStatus = status;
      }

      const skip = (parseInt(page)-1)*parseInt(limit);


      console.log("FILTER_QUERY:", query);

      const total = await modelCollection.countDocuments(query);

      const result = await modelCollection
      .find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

      console.log("all-donation-request:",result)

      res.send({
        total,
        result,
      });
    })


    app.patch("/donation-status/:id",async(req,res)=>{
      const {id} = req.params;
      const {status} = req.body;

      const allowed = ["done","cancel","inprogress","pending"];
      
      const result = await modelCollection.updateOne(
        {_id:new ObjectId(id)},
        {$set:{donationStatus:status}}
      );
      res.send(result);
    })


    app.get('/pending-donations',async(req,res)=>{
      const result = await modelCollection
      .find({donationStatus:"pending"})
      .toArray();

      console.log("pending:",result)

      res.send(result);
    })

    app.get('/pending-donations/:id',async(req,res)=>{
      
      const {id} = req.params;
      
      const result = await modelCollection
      .findOne({
        _id: new ObjectId(id),
      });

      console.log("pendingOne:",result)

      res.send(result);
    })

    

  

    app.post("/donations-request",async(req,res)=>{
        const result = await modelCollection.insertOne(req.body);
        res.send(result);
    });


    app.get('/donations-request',async(req,res)=>{

        const {email,status} = req.query;

        let query = {};

        if(email){
            query.requesterEmail = email;
        }

        if(status){
            query.donationStatus = status;
        }

        console.log("FILTER_QUERY:", query);


        const result = await modelCollection
        .find(query)
        .sort({
            donationDate:-1,
            donationTime:-1
        })
        .toArray();
        
        console.log(result);

        res.send(result);
    })


    app.delete("/donations-request/:id",async(req,res)=>{
      const id = req.params.id;

      const result = await modelCollection.deleteOne({

            _id:new ObjectId(id),

      });
      res.send(result);
    })

    app.get("/donations-request/:id",async(req,res)=>{
      const id = req.params.id;

      const result = await modelCollection.findOne({

            _id:new ObjectId(id),

      });
      res.send(result);
    })


    app.patch("/donations-request/edit/:id",async(req,res)=>{

      const id = req.params.id;
      const updateData = req.body;


      const result = await modelCollection.updateOne(
        {_id:new ObjectId(id)},
        {$set:updateData}
      );
      
      console.log("Updating Donation:", updateData);

      


      res.send(result);

    })

    
    

    app.patch("/donations-request/status/:id",async(req,res)=>{

      const id = req.params.id;
      const {donationStatus} = req.body;

      const update = {
        $set:{donationStatus}
      };

      const result = await modelCollection.updateOne(
        {_id:new ObjectId(id)},
        update
      );


      res.send(result);

    })


    app.get("/currentUsers",async(req,res)=>{
      
      const {email}=req.query;

      const user = await userCollection.findOne({email});


      res.send(user);

    });




    app.get("/users",async(req,res)=>{

        const {status} = req.query;

        const query = status?{status}:{}
        
        const result = await userCollection.find(query).toArray();

        res.send(
          result
        )
    })

    ///.........

    app.patch("/users/:id/status",async(req,res)=>{
        const id = req.params.id;
        const {status} = req.body;
        
        console.log("id_received:", id);
        console.log("status_received:", status);

        const result= await userCollection.updateOne(
          {_id: new ObjectId(id)},
          {$set:{status:status}}
        );

        console.log("RESULT:", result);


        res.send(
          result
        )
     })

    app.patch("/users/:id/role",async(req,res)=>{
        const id = req.params.id;
        const {role} = req.body;
        
        console.log("id_received:", id);
        console.log("Role_received:", role);

        const result= await userCollection.updateOne(
          {_id: new ObjectId(id)},
          {$set:{role:role}}
        );

        console.log("RESULT:", result);


        res.send(
          result
        )
     })





    ///


    app.get("/users/:email/role",async(req,res)=>{

        const email = req.params.email;

        const result = await userCollection.findOne({email});

        res.send({role:result?.role || "donor"});

    });


    app.post("/users",async(req,res)=>{
        const user = req.body;

        user.created_at = new Date().toISOString()
        user.last_loggedIn = new Date().toISOString()
        user.role = 'donor'
        user.status = 'active'

        const query = {
            email: user.email,
        }


        const alreadyExists = await userCollection.findOne({
            query
        })

        console.log('User Already Exists--->',!!alreadyExists)
        if(alreadyExists){
            console.log('updating user info.....');

            const result = await userCollection.updateOne(query,{
                $set:{
                    last_loggedIn: new Date().toISOString(),
                },
            })
        }

        const result = await userCollection.insertOne(user);

        console.log(result);

        res.send(result);
    })


    //......................

    app.get("/profile/:email",async(req,res)=>{

      const email = req.params.email;
      const result = await userCollection.findOne({email});

        res.send(
          result
        )
    })

    app.patch("/profile", async (req, res) => {
  const email = req.body.email;

  const updateData = {
    name: req.body.name,
    blood: req.body.blood,
    district: req.body.district,
    upozila: req.body.upozila,
    photo: req.body.photo,
  };

  const result = await userCollection.updateOne(
    { email },
    { $set: updateData }
  );

  res.send(result);
});






    ///payemnt....


  app.post('/payment-checkout-session',async(req,res)=>{

      const paymentInfo = req.body;
      const YOUR_DOMAIN = "http://localhost:5173";


      const session = await  stripe.checkout.sessions.create({
      
        line_items: [
      {
        // Provide the exact Price ID (for example, price_1234) of the product you want to sell
      price_data:{
          currency:'usd',
          product_data:{
            name:"Donation",
          },
          unit_amount: paymentInfo.amount*100,
      },
      quantity: 1,
      },
    ],

    customer_email: paymentInfo.email, 

    mode: 'payment',
   
    metadata:{
      
      userId: paymentInfo.userId,
      userName:paymentInfo.name,

    },


    success_url: `${YOUR_DOMAIN}/funding-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${YOUR_DOMAIN}/funding-cancel`,

        
    })

    res.send({url:session.url});

})

app.post("/funds",async(req,res)=>{

  const {session_id} = req.body;
 

  const session = await stripe.checkout.sessions.retrieve(session_id);

  
  const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);


  const funds ={
  
    userId:session.metadata.userId,
    name:session.metadata.userName,
    email:session.customer_email,
    amount:paymentIntent.amount/100,

    created_at:new Date(),
    session_id: session.id,

  };

  const result = await fundingCollection.insertOne(funds);

  res.send(result);

})

app.get("/funding",async(req,res)=>{

    result = await fundingCollection.find().toArray();
    res.send(result);

})


app.get("/funds-data/:userId",async(req,res)=>{

  const id = req.params.userId;

  result = await fundingCollection.find({userId:id}).toArray();

  res.send(result);
    

})


app.get("/district",async(req,res)=>{

  result = await districtCollection.find().toArray();

  res.send(result);

})


app.get("/upazila",async(req,res)=>{

  result = await upazilaCollection.find().toArray();

  res.send(result);

})


///....search

app.get("/donor-search",async(req,res)=>{

  const {blood,district,upozila} = req.query;

  const query = {};

  if(blood) query.blood = blood;
  if(district) query.district = district;
  if(upozila) query.upozila = upozila;


  const result = await userCollection.find(query).toArray();
  res.send(result);

})




    

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   //await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
