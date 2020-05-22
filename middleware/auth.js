const jwt = require('jsonwebtoken')
const User = require('../models/User')
const asyncHandeler = require('../middleware/asyncHandeler')
const errorResponse = require('../utiles/errorResponse')


const Protect = asyncHandeler(async(req, res, next)=>{
    if(! req.header('Authorization')){
        return(next( new errorResponse('User Did Not Authenticate!', 401)))
    }

    const token = req.header('Authorization').replace('Bearer ', '')
    const encoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
    const user = await User.findById(encoded.id)
    if(!user){
        return(next(new errorResponse('User Did Not Authenticate!', 401)))
    }

    req.user = user
    next()

})

const Authorize=(...roles)=>{
    return (req, res, next)=>{
        if(!roles.includes(req.user.role)){
            return (next(new errorResponse(`User role ${req.user.role} is not authorized to access this route!`, 403)))
        }
        next()
    }
}

module.exports ={
    Protect,
    Authorize
}