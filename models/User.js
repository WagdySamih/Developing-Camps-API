const crypto = require('crypto')
const mongoose = require('mongoose')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        trim: true,
        unique: true,
        validate(email) {
            if (!validator.isEmail(email)) {
                throw new Error('Please use a valid email adress')
            }
        }
    },
    role: {
        type: String,
        enum: ['user', 'publisher'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false
    },
    tokens:[{
        token: String
    }],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
}, {
    timestamps: true
})

userSchema.pre('save', async function (next) {
    const user = this
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})

userSchema.methods.getSignedjwtToken = function (next) {
    const user = this
    return jwt.sign({
        id: this._id
    }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRE_DATE
    })
}


userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({
        email
    }).select('+password')
    if (!user) {
        throw new Error('Wrong email or password')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw new Error('Wrong email or password')
    }

    return user
}

/// generate and hash password token
userSchema.methods.getResetPasswordToken = function (){
    /// generate a token
    const resetToken = crypto.randomBytes(20).toString('hex')
    /// hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
                            .createHash('sha256')
                            .update(resetToken)
                            .digest('hex')
 
    this.resetPasswordExpire = Date.now()+30*60*1000
    return resetToken 
}


const User = mongoose.model('User', userSchema)
module.exports = User