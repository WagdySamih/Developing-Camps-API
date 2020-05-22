const express = require('express')
const router = express.Router()

const {Protect} = require('../middleware/auth')
const {
    register,
    login,
    getMyProfile,
    forgetPassword,
    resetPassword,
    updateDetails,
    updatePassword,
} = require('../controllers/auth')

router
    .route('/auth/register')
    .post(register)
    
router
    .route('/auth/login')
    .post(login)

router
    .route('/auth/me')
    .get(Protect, getMyProfile)

router
    .route('/auth/forgetpassword')
    .post(forgetPassword)
    
router
    .route('/auth/resetpassword/:resetToken')
    .patch(resetPassword)
    
router
    .route('/auth/updatedetails')
    .patch(Protect, updateDetails)

router
    .route('/auth/updatepassword')
    .patch(Protect, updatePassword)
module.exports = router