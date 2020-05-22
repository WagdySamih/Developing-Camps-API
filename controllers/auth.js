const crypto = require('crypto')
const User = require('../models/User')
const errorResponse = require('../utiles/errorResponse')
const asyncHandeler = require('../middleware/asyncHandeler')
const ResetPasswordTokenEmail = require('../utiles/sendEmail')


const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedjwtToken()
    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE_DATE * 24 * 60 * 60 * 1000),
        httpOnly: true
    }
    if (process.env.NODE_ENV === 'production') {
        options.secure = true
    }

    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            data: {
                user
            },
            token
        })
}

/**
 *   description    Register a user
 *   route          POST /auth/register
 *   access         Public
 */
exports.register = asyncHandeler(async (req, res, next) => {
    const user = await User.create({
        ...req.body
    })
    if (!user) {
        next(new errorResponse(`Wrong email or password`, 400))
    }

    sendTokenResponse(user, 201, res)
})

/**
 *   description    Login a user
 *   route          POST /auth/login
 *   access         Public
 */
exports.login = asyncHandeler(async (req, res, next) => {
    const {
        email,
        password
    } = req.body

    if (!email || !password) {
        return next(errorResponse(`You must provide an email and password`, 400))
    }

    const user = await User.findByCredentials(email, password)
    sendTokenResponse(user, 200, res)
})

/**
 *   description    get user profile
 *   route          POST /auth/me
 *   access         Private
 */
exports.getMyProfile = asyncHandeler(async (req, res, next) => {
    res.send(req.user)
})

/**
 *   description    forget password
 *   route          POST /auth/me
 *   access         Public
 */
exports.forgetPassword = asyncHandeler(async (req, res, next) => {
    const user = await User.findOne({
        email: req.body.email
    })
    if (!user) {
        return next(new errorResponse(`there is no user with that email`, 404))
    }

    const resetToken = user.getResetPasswordToken()
    const url = `${req.protocol}://${req.get('host')}/auth/resetpassword/${resetToken}`
    const message = `You are receiving this email because you or someone else has requested to reset your password,
   \nPlease click this link to confirm \n\n${url}`
    try {
        await ResetPasswordTokenEmail({
            email: user.email,
            subject: 'Reset Password',
            message
        })
        await user.save()
        res.send({
            success: true,
            message: 'email is sent successfully'
        })
    } catch (error) {
        user.resetPasswordToken = undefined,
            user.resetPasswordExpire = undefined
        await user.save()
        res.status(500).send({
            success: false,
            message: 'Failed to send a reset email'
        })
    }
})

/**
 *   description    reset the user password
 *   route          Patch /auth/resetpassword/:resetToken
 *   access         Public
 */
exports.resetPassword = asyncHandeler(async (req, res, next) => {
    /// get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resetToken)
        .digest('hex')


    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {
            $gt: Date.now()
        }
    })

    if(!user){
        return next(new errorResponse('Invalid token',400))
    }

    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    sendTokenResponse(user, 200 , res)  
})


/**
 *   description    update user details
 *   route          PATCH /auth/updatedetails
 *   access         Private
 */
exports.updateDetails = asyncHandeler(async (req, res, next) => {
    const validUpdates = ['name', 'email']
    const updates = Object.keys(req.body)
    const isValidUpdate = updates.every((update)=> validUpdates.includes(update) )
    if(!isValidUpdate){
        return next((new errorResponse('Not valid update',400)))
    }

    updates.forEach((update) => req.user[update] = req.body[update] )
    await req.user.save()
    res.json({
        success: true,
        date: {
            user: req.user
        }
    })
})

/**
 *   description    update user password
 *   route          PATCH /auth/updatepassword
 *   access         Private
 *
 *   req.nody contains new password and old password
 */
exports.updatePassword = asyncHandeler(async (req, res, next) => {
 
    const user = await User.findByCredentials(req.user.email, req.body.oldPassword)
    if(!user){
        return next(new errorResponse('Wrong Password', 400))
    }
    user.password = req.body.newPassword
    
    await user.save()
    res.json({
        success: true,
        date: {
            user: req.user
        }
    })
})