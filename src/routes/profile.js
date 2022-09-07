const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const { extractProfiles, getProfileWorkers } = require('../controllers/linkedin/profile.controller');

router.post('/', [
    body('accounts').notEmpty()
        .withMessage('Entrez une liste d\'identifiants valide')
], extractProfiles);

router.get('/', getProfileWorkers);

module.exports = router;