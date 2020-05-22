const express = require('express')
const router = express.Router()

const {
    getUsers,
    getUser
} = require('../controllers/user')

router
    .route('/users')
    .get(getUsers)
router
    .route('/users/:id')
    .get(getUser)

module.exports = router