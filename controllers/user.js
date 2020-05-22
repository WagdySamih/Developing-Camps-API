const User = require('../models/User')
const errorResponse = require('../utiles/errorResponse')
const asyncHandeler = require('../middleware/asyncHandeler')



/**
 *   description    get all users
 *   route          GET /users
 *   access         Private/ ADMIN
 */
exports.getUsers= asyncHandeler(async (req, res, next) => {
    /**
     *      can select specific fields to view. ex:  select=name, email, role
     * 
     *      can sort by name, createdAt
     *          
     *      can set page and limit for each page  
     *          ex:   page=x&limit=y
     */
    let query
    let reqQuery = {
        ...req.query
    }
    /// removed select, sort fields from query string
    const removedFields = ['select', 'sort', 'page', 'limit']
    removedFields.forEach((field) => delete reqQuery[field])


    /// Create query string so we can manipulate it
    let queryStr = JSON.stringify(reqQuery)
    /// add $ sign before gt, gte, lt, lte and in so we can query about it

    query = User.find(JSON.parse(queryStr))
    /// selecting fields
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ')
        query = query.select(fields)
    }

    /// sorting
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ')
        query = query.sort(sortBy)
    } else {
        query = query.sort('-createdAt')
    }

    /// Pagination
    const page = parseInt(req.query.page) | 1
    const limit = parseInt(req.query.limit) | 25
    const startIndex = (page - 1) * limit
    const finalIndex = page * limit
    const total = await User.countDocuments()


    query = query.skip(startIndex).limit(limit)

    /// include next and previous pagination info in api
    const pagination = {}
    if (finalIndex < total) {
        pagination.next = {
            page: page + 1,
            limit
        }
    }
    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        }
    }

    /// Executing the query
    const users = await query
    res.json({
        success: true,
        pagination,
        count:total,
        date: {
            users
        }
    })
})

/**
 *   description    get all users
 *   route          GET user/:id
 *   access         Private/ ADMIN
 */
exports.getUser = asyncHandeler(async (req, res, next) => {
 
    const user = await User.findById(req.params.id)
    if(! user){
        return next(new errorResponse(`user with id ${req.params.id} not found`,404))
    }
    res.json({
        success: true,
        date: {
            user
        }
    })
})
