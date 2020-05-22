const errorResponse = require('../utiles/errorResponse')
const errorHandler = (error, req, res, next) => {

    /// Wrong Mongoose ObjectId
    if (error.name === 'CastError') {
        const message = `Resource not found with id equal to ${error.value}`
        error = new errorResponse(message, 404)
    }

    /// Dublicate Fields Error 
    if (error.code === 11000) {
        const message = error.message
        error = new errorResponse(message, 400)
    }

    /// Mongoose Validation Error
    if (error.name === 'ValidationError') {
        const message = Object
            .values(error.errors)
            .map( (value) => {
                return value.message+' '
           })
        console.log(message)
        error = new errorResponse(message, 400)
    } 
    
    /// Mongoose middleware error of finding user by credentials
    if(error.message === 'Wrong email or password'){
        error = new errorResponse(error.message, 400)
    }

    res.status(error.status || 500)
    res.json({
        success: false,
        error: error.message || 'server error'
    })
}

module.exports = errorHandler