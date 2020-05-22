const Bootcamp = require('../models/Bootcamp')
const Course = require('../models/Course')
const errorResponse = require('../utiles/errorResponse')
const asyncHandeler = require('../middleware/asyncHandeler')


/**
 *   description    Get all bootcamps || get all courses for specific bootcamp
 *   route          GET /bootcamps/:bootcampId/courses
 * 	 route			GET /courses
 *   access         Public
 */
exports.getCourses = asyncHandeler(async (req, res, next) => {
	let query
	if (req.params.bootcampId) {
		query = Course.find({
			bootcamp: req.params.bootcampId
		})
	} else {
		query = Course.find()
	}

	courses = await query.populate({
		path: 'bootcamp',
		select: ['name', 'description','averageCost']
	})
	res.json({
		success: true,
		count: courses.length,
		data: courses
	})
})

/**
 *   description    Get a single course
 * 	 route			GET /courses/:id
 *   access         Public
 */
exports.getCourse = asyncHandeler(async (req, res, next) => {

	let course = await Course.findById(req.params.id)

	if (req.params.bootcampId) {
	return next(new errorResponse(`Course not found with id of ${req.params.id}`, 404))
	}

	course = await course.populate('bootcamp').execPopulate()
	res.json({
		success: true,
		data: course
	})
})
/**
 *   description    create new bootcamp
 *   route          POST /courses
 *   access         Private
 */
exports.createCourse = asyncHandeler(async (req, res, next) => {

	req.body.bootcamp = req.params.bootcampId
	req.body.user = req.user._id

	const bootcamp = await Bootcamp.findById(req.params.bootcampId)

	if (!bootcamp) {
		return next(new errorResponse(`Bootcamp not found with id equal to ${req.params.bootcampId}`, 404))
	}
	if(req.user.role!=='admin' && req.user._id != bootcamp.user.toString()){
		return next(new errorResponse(`user not authorized to add courses to bootcamp with is ${bootcamp._id}`, 401)) 
	}
	const course = await Course.create(req.body)
	res.json({
		success: true,
		data: course
	})
})


/**
 *   description    update a course
 *   route          PATCH /courses/:id
 *   access         Private
 */
exports.updateCourse = asyncHandeler(async (req, res, next) => {
	const validUpdates = ['minimumSkill','scholarhipsAvailable','title','description','weeks','tuition']
	const updates = Object.keys(req.body)
	const isValidUpdate = updates.every((update) => validUpdates.includes(update) )
	if(!isValidUpdate){
		return next(new errorResponse(`It is not a valid update`, 400))
	}

	let course = await Course.findById(req.params.id)

	if (!course) {
		return next(new errorResponse(`Course not found with id equal to ${req.params.id}`, 404))
	}
	if(req.user.role!=='admin' && req.user._id != bootcamp.user.toString()){
		return next(new errorResponse(`user not authorized to update course in bootcamp with is ${bootcamp._id}`, 401)) 
	}
	updates.forEach((update) => course[update]=req.body[update] )
	
	await course.save()
	res.json({
		success: true,
		data: course
	})
})



/**
 *   description    delete a course
 *   route          DELETE /courses/:id
 *   access         Private
 */
exports.deleteCourse = asyncHandeler(async (req, res, next) => {

	const course = await Course.findById(req.params.id)
	if (!course) {
		return next(new errorResponse(`Course not found with id equal to ${req.params.id}`, 404))
	}
	if(req.user.role!=='admin' && req.user._id != bootcamp.user.toString()){
		return next(new errorResponse(`user not authorized to delete courses in bootcamp with is ${bootcamp._id}`, 401)) 
	}
	await course.remove()
	res.json({
		success: true,
		data: {}
	})
})