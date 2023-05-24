// MODELS
const Pet = require('../models/pet');

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
  app.post('/pets', (req, res) => {
    console.log(req.body);
    var pet = new Pet({ ...req.body, birthday: new Date() });

    pet
      .save()
      .then((pet) => {
        res.redirect(`/pets/${pet._id}`);
      })
      .catch((err) => {
        // Handle Errors
        res.status(400).send({ err: err });
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
};
