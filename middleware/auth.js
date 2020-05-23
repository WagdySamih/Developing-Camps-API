const jwt = require('jsonwebtoken')
const User = require('../models/User')
const asyncHandeler = require('../middleware/asyncHandeler')
const errorResponse = require('../utiles/errorResponse')


const Protect = asyncHandeler(async(req, res, next)=>{
    let token
    if( req.header('Authorization')){
        token = req.header('Authorization').replace('Bearer ', '')
    } else if (req.cookies.token) {
        token = req.cookies.token
    }
    if(! token){
        return(next(new errorResponse('User Did Not Authenticate!', 401)))
    }
    const encoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
    const user = await User.findOne({_id:encoded.id, 'tokens.token':token})
    if(!user){
        return(next(new errorResponse('User Did Not Authenticate!', 401)))
    }
    req.token = token
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