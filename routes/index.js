const Pet = require('../models/pet');

module.exports = (app) => {
  /* GET home page. */
  app.get('/', (req, res) => {
    const page = req.query.page || 1;
    const currentPage = page;

    Pet.paginate({}, { page: page }).then((results) => {
      res.render('pets-index', { pets: results.docs, pageCount: results.pages, currentPage });
    });
  });
};
