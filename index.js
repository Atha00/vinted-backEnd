require("dotenv").config();
console.log(process.env);
// import du package express
const express = require("express");
// import du package mongoose
const mongoose = require("mongoose");

// import du package cloudinary
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// créer notre serveur
const app = express();

// utiliser express.json pour pouvoir lire les paramètres de type body (middleware global) :
app.use(express.json());

// établir la connexion avec mongoose :
mongoose.connect(process.env.MONGODB_URI);

// Import du modèle User :
const User = require("./models/User");
// Import du modèle Offer :
const Offer = require("./models/Offer");

// import des routes :
const userRoutes = require("./routes/user");
app.use(userRoutes);
const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

// faire la route app.all (toujours la laisser tout en bas)
app.all("*", (req, res) => {
  try {
    res.status(404).json("Route not found");
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// lancer le serveur (le mettre à l'écoute/ en ligne)

app.listen(process.env.PORT || 3000, () => {
  console.log("Server is on fire 🔥 ");
});
