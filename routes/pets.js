// MODELS
const Pet = require('../models/pet');

const mailer = require('../utils/mailer');

// Uploading to aws s3
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const Upload = require('s3-uploader');

const client = new Upload(process.env.S3_BUCKET, {
  aws: {
    path: 'pets/avatar',
    region: process.env.S3_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  cleanup: {
    versions: true,
    original: true,
  },
  versions: [
    {
      maxWidth: 400,
      aspect: '16:10',
      suffix: '-standard',
    },
    {
      maxWidth: 300,
      aspect: '1:1',
      suffix: '-square',
    },
  ],
});

// PET ROUTES
module.exports = (app) => {
  // INDEX PET => index.js
  app.get('/search', (req, res) => {
    const term = new RegExp(req.query.term, 'i');

    const page = req.query.page || 1;
    Pet.paginate(
      {
        $or: [
          { name: term },
          {
            species: term,
          },
        ],
      },
      { page: page }
    ).then((results) => {
      res.render('pets-index', {
        pets: results.docs,
        pageCount: results.pages,
        currentPage: page,
        term: req.query.term,
      });
    });
  });

  // NEW PET
  app.get('/pets/new', (req, res) => {
    res.render('pets-new');
  });

  // CREATE PET
  app.post('/pets', upload.single('avatar'), (req, res, next) => {
    let pet = new Pet({ ...req.body, birthday: new Date() });
    pet.save((err) => {
      if (req.file) {
        // upload the images
        client.upload(req.file.path, {}, async function (err, versions, meta) {
          if (err) {
            return res.status(400).send({ err: err });
          }

          const urlArray = versions[0].url.split('-');
          urlArray.pop();
          const url = urlArray.join('-');
          pet.avatarUrl = url;
          console.log(url);
          pet.save();

          return res.json({ pet: pet });
        });
      } else {
        return res.redirect(`/pets/${pet._id}`);
      }
    });
  });

  // SHOW PET
  app.get('/pets/:id', (req, res) => {
    Pet.findById(req.params.id).exec((err, pet) => {
      res.render('pets-show', { pet: pet });
    });
  });

  // EDIT PET
  app.get('/pets/:id/edit', (req, res) => {
    Pet.findById(req.params.id).exec((err, pet) => {
      res.render('pets-edit', { pet: pet });
    });
  });

  // UPDATE PET
  app.put('/pets/:id', (req, res) => {
    Pet.findByIdAndUpdate(req.params.id, req.body)
      .then((pet) => {
        res.redirect(`/pets/${pet._id}`);
      })
      .catch((err) => {
        // Handle Errors
      });
  });

  // DELETE PET
  app.delete('/pets/:id', (req, res) => {
    Pet.findByIdAndRemove(req.params.id).exec((err, pet) => {
      return res.redirect('/');
    });
  });
  // Purchase
  app.post('/pets/:id/purchase', (req, res) => {
    var stripe = require('stripe')(process.env.PRIVATE_STRIPE_API_KEY);

    const token = req.body.stripeToken; // Using Express

    const petId = req.params.id || req.body.petId;

    Pet.findById(petId).exec((err, pet) => {
      if (err) {
        console.log('Error: ' + err);
        res.redirect(`/pets/${req.params.id}`);
      }

      const charge = stripe.charges
        .create({
          amount: pet.price * 100,
          currency: 'usd',
          description: `Purchased ${pet.name}, ${pet.species}`,
          source: token,
        })
        .then((charge) => {
          const user = {
            email: req.body.stripeEmail,
            amount: charge.amount / 100,
            petName: pet.name,
          };

          mailer.sendMail(user, req, res);

          res.redirect(`/pets/${req.params.id}`);
        })
        .catch((err) => {
          console.log('Error: ' + err);
          res.redirect(`/pets/${req.params.id}`);
        });
    });
  });
};
