const Bootcamp = require('../models/Bootcamp')
const Review = require('../models/Review')
const errorResponse = require('../utiles/errorResponse')
const asyncHandeler = require('../middleware/asyncHandeler')


/**
 *   description    get all reviews for specific bootcamp
 *   route          GET /bootcamps/:bootcampId/reviws
 *   access         Public
 */
exports.getReviews = asyncHandeler(async (req, res, next) => {
    /**
     *      can sort by name, createdAt
     *          ex:  sort=createdAt | sort=title | sort=rating 
     * 
     *      can set page and limit for each page  
     *          ex:   page=x&limit=y 
     */
    query = Review.find({bootcamp: req.params.bootcampId})

    /// sorting
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ')
        query = query.sort(sortBy)
    } else {
        query = query.sort('-createdAt')
    }

    /// Pagination
    const page = parseInt(req.query.page) | 1
    const limit = parseInt(req.query.limit) | 10
    const startIndex = (page - 1) * limit
    const finalIndex = page * limit
    const total = await Review.countDocuments()


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
    const bootcamp = await Bootcamp.findById(req.params.bootcampId)
    if(!bootcamp){
        return next(new errorResponse(`Bootcamp not found with id equal to ${req.params.bootcampId}`, 404))
    }
    const reviews = await query
	res.json({
		success: true,
		count: reviews.length,
		data: reviews
	})
})


/**
 *   description    create a review
 *   route          POST /bootcamps/:bootcampId/reviews
 *   access         Private
 */
exports.createReview = asyncHandeler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.bootcampId)
    if(!bootcamp){
        return next(new errorResponse(`Bootcamp not found with id equal to ${req.params.bootcampId}`, 404))
    }
    const isWroteReviewBefore = await Review.findOne({bootcamp: req.params.bootcampId, user: req.user._id})
    if(isWroteReviewBefore){
        return next(new errorResponse(`You Can Only Write One Review Per Bootcamp!`, 400))
    }
    req.body.user = req.user._id
    req.body.bootcamp = req.params.bootcampId
    const review = await Review.create(req.body)
	res.json({
		success: true,
		data: review
	})
})

/**
 *   description    Update a review
 *   route          PATCH /bootcamps/:bootcampId/reviews
 *   access         Private
 */
exports.updateReview = asyncHandeler(async (req, res, next) => {
    /// check if it is  valid update
    const validUpdates = ['title', 'text','rating']
    const updates = Object.keys(req.body)
    const isValidUpdate = updates.every((update)=> validUpdates.includes(update) )
    if(!isValidUpdate){
        return next(new errorResponse(`Not valid update`, 400))
    }
    /// get the bootcamp to be reviewed
    const bootcamp = await Bootcamp.findById(req.params.bootcampId)
    if(!bootcamp){
        return next(new errorResponse(`Bootcamp not found with id equal to ${req.params.bootcampId}`, 404))
    }
    /// get the review to be updated
    const review = await Review.findOne({bootcamp:req.params.bootcampId, user: req.user._id})
    if(!review){
        return next(new errorResponse(`Review not found`, 404))
    }

    updates.forEach((update)=> review[update] = req.body[update])
    await review.save()

	res.json({
		success: true,
		data: review
	})
})


/**
 *   description    delete a review
 *   route          DELETE /bootcamps/:bootcampId/reviews
 *   access         Private
 */
exports.deleteReview= asyncHandeler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.bootcampId)
    if(!bootcamp){
        return next(new errorResponse(`Bootcamp not found with id equal to ${req.params.bootcampId}`, 404))
    }

    const review = await Review.findOne({bootcamp: req.params.bootcampId , user: req.user._id})
    if(! review){
        return next(new errorResponse(`Review not found`, 404)) 
    }
    await review.remove()
	res.json({
		success: true,
		data: {
            review
        }
	})
})
