const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
// import du module SHA256 du package crypto-js
const SHA256 = require("crypto-js/sha256");
// import du module enc-BAse64 du package crypto-js
const base64 = require("crypto-js/enc-base64");

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    // Le destructuring permet de créer un ensemble de variable à partir des clefs d'un objet :
    const { username, email, password, newsletter } = req.body; // cela va nous permettre d'écrire `password` à la place de `req.body.password`, etc...

    // vérifier que le username est bien renseigné :
    if (username) {
      // Vérifier que l'email n'est pas déjà présent dans la base de donnée :
      // const userFound = await User.find({ email: req.body.email }) // find retourne un tableau, qui sera vide s'il n'a rien trouvé
      // if (!userFound.length) {
      const userFound = await User.findOne({ email: email }); // findOne retourne un objet ou null (null s'il n'a rien trouvé)
      if (!userFound) {
        const generatedToken = uid2(16);
        const generatedSalt = uid2(12);
        const generatedHash = SHA256(password + generatedSalt).toString(base64);
        const newUser = new User({
          email: email,
          account: {
            username: username,
          },
          newsletter: newsletter,
          token: generatedToken,
          hash: generatedHash,
          salt: generatedSalt,
        });
        await newUser.save();
        res.status(201).json({
          _id: newUser._id,
          token: newUser.token,
          account: {
            username: newUser.account.username,
          },
        });
      } else {
        res.status(409).json({ message: "Cet email est déjà pris" });
      }
    } else {
      res.status(400).json({ message: "Il nous faut un username..." });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    // const { email, password } = req.body;
    // console.log(req.body); // { email: 'johndoe@lereacteur.io', password: 'azerty' }
    const userFound = await User.findOne({ email: req.body.email });
    if (userFound) {
      // on génére un nouveau hash en utilisant le salt récupéré avec l'utilisateur correspondant à l'email reçu dans la BDD :
      const generatedHash = SHA256(req.body.password + userFound.salt).toString(
        base64
      );
      // si le hash généré correspond au hash récupéré avec l'utilisateur correspondant à l'email reçu dans la BDD :
      if (generatedHash === userFound.hash) {
        res.status(200).json({
          _id: userFound._id,
          token: userFound.token,
          account: {
            username: userFound.account.username,
          },
        });
      } else {
        res.status(401).json("email ou password incorrects");
      }
    } else {
      res.status(401).json("email ou password incorrects");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
