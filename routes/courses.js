const express = require('express')
const router = express.Router()


const {  Protect, Authorize} = require('../middleware/auth')

const {
    getCourses,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse,
} = require('../controllers/courses')

router
    .route('/courses')
    .get(getCourses)
    .post(Protect, Authorize('publisher','admin'), createCourse)

router
    .route('/courses/:id')
    .get(getCourse)
    .patch(Protect, Authorize('publisher','admin'), updateCourse)
    .delete(Protect, Authorize('publisher','admin'), deleteCourse)


module.exports = router


