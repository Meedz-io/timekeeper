const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const { getStatus, newSearch } = require('../controllers/linkedin/search.controller');

router.post('/', [
    body('keywords').isString()
        .withMessage('Entrez des mots de clés de recherche')
], newSearch);

router.get('/:id', getStatus)

module.exports = router;