const express = require('express')
const router = express.Router()

const {Protect, Authorize} = require('../middleware/auth')

const {
    getBootcamps,
    getBootcamp,
    createBootcamp,
    updateBootcamp,
    deleteBootcamp,
    getBootcampByDistance,
    bootcampPhotoUpload
} = require('../controllers/bootcamps')

const {
    getCourses,
    createCourse
} = require('../controllers/courses')

    
router
    .route('/bootcamps/:id/photo')
    .patch(Protect, Authorize('publisher','admin'), bootcampPhotoUpload)

router
    .route('/bootcamps/:bootcampId/courses')
    .get(getCourses)
    .post(Protect, Authorize('publisher','admin'), createCourse)


router
    .route('/bootcamps')
    .get(getBootcamps)
    .post(Protect, Authorize('publisher','admin'), createBootcamp)

router
    .route('/bootcamps/:id')
    .get(getBootcamp)
    .patch(Protect, Authorize('publisher','admin'), updateBootcamp)
    .delete(Protect, Authorize('publisher','admin'), deleteBootcamp)

router
    .route('/bootcamps/distance/:zipcode/:distance')
    .get(getBootcampByDistance)


module.exports = router