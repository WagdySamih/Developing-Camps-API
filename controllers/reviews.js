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
    const bootcamp = await Bootcamp.findById(req.params.bootcampId)
    if(!bootcamp){
        return next(new errorResponse(`Bootcamp not found with id equal to ${req.params.bootcampId}`, 404))
    }

    const reviews = await Review.find({bootcamp: req.params.bootcampId})
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
