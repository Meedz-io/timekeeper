const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const profileController = require('../controllers/linkedin/profile.controller');

router.post('/', [
    body('accounts').isArray()
        .withMessage('Entrez une liste d\'identifiants valide')
], profileController);

module.exports = router;