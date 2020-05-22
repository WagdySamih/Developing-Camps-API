const express = require('express')
const router = express.Router()

const {Protect} = require('../middleware/auth')

const {
    getReviews,
    createReview,
    updateReview,
    deleteReview
} = require('../controllers/reviews')

 router
    .route('/bootcamps/:bootcampId/reviews')
    .get(getReviews)
    .post(Protect, createReview)
    .patch(Protect, updateReview)
    .delete(Protect, deleteReview)

module.exports = router