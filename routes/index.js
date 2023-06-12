const Pet = require('../models/pet');

module.exports = (app) => {
  /* GET home page. */
  app.get('/', (req, res) => {
    const page = req.query.page || 1;
    const currentPage = page;

    Pet.paginate({}, { page: page }).then((results) => {
      if (req.header('Content-Type') == 'application/json') {
        return res.json({ pets: results.docs, pagesCount: results.pages, currentPage });
      } else {
        return res.render('pets-index', {
          pets: results.docs,
          pageCount: results.pages,
          currentPage,
        });
      }
    });
  });
};
