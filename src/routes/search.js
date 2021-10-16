const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const searchController = require('../controllers/linkedin/search.controller');

router.post('/', [
    body('keywords').isString()
        .withMessage('Entrez des mots de clés de recherche')
], searchController);

module.exports = router;