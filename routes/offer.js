const express = require("express");
const router = express.Router();
// import du package cloudinary
const cloudinary = require("cloudinary").v2;
// import du package express-fileupload
const fileUpload = require("express-fileupload");
// import du middleware isAuthenticated
const isAuthenticated = require("../middlewares/isAuthenticated");
// import de la fonction de conversion en base 64:
const { convertToBase64, test } = require("../utils/converterB64");

const Offer = require("../models/Offer");

// le package express-fileupload s'utilise en middleware directement dans la route concernée
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      // destructuring :
      const { title, description, price, condition, city, brand, size, color } =
        req.body;

      // conversion de l'image en base 64 pour permettre l'upload :

      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ÉTAT: condition,
          },
          {
            COULEUR: color,
          },
          {
            EMPLACEMENT: city,
          },
        ],
        owner: req.user,
      });
      // envoi de l'image sur cloudinary, qui nous renvoi en retour un objet contenant toutes les infos de l'image (secure_url, format, taille... etc...)
      if (req.files) {
        const pictureToUpload = convertToBase64(req.files.picture);
        const uploadResult = await cloudinary.uploader.upload(pictureToUpload, {
          folder: `/vinted/offers/${newOffer._id}`,
        });
        newOffer.product_image = uploadResult;
      }
      await newOffer.save(); // sauvegarde dans la base de données
      res.status(201).json(newOffer);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    // console.log(req.query);
    const limit = 5;

    const filters = {};
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }

    // filters.product_price = {};

    if (req.query.priceMin) {
      filters.product_price = { $gte: req.query.priceMin };
    }

    if (req.query.priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = req.query.priceMax;
      } else {
        filters.product_price = {};
        filters.product_price.$lte = req.query.priceMax;
      }
    }
    // si limit = 10 :
    //  page 1 => skip = 0
    //  page 2 => skip = 10
    //  page 3 => skip = 20

    // skip =

    // rappel : limit = 5

    // page 1 => skip = 0
    // page 2 => skip = 5
    // page 3 => skip = 10
    // page 4 => skip = 15

    const sortValue = {};

    if (req.query.sort === "price-desc") {
      sortValue.product_price = "desc";
    } else if (req.query.sort === "price-asc") {
      sortValue.product_price = "asc";
    }

    const page = req.query.page;
    const offers = await Offer.find(filters)
      .sort(sortValue)
      .limit(limit)
      .skip((page - 1) * limit);

    const count = await Offer.find(filters).countDocuments();
    res.status(200).json({ count: count, offers: offers });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offerFound = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account",
    });
    // console.log(offerFound);
    res.status(200).json(offerFound);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
