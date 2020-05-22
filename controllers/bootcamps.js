const path = require('path')
const Bootcamp = require('../models/Bootcamp')
const errorResponse = require('../utiles/errorResponse')
const asyncHandeler = require('../middleware/asyncHandeler')
const geocoder = require('../utiles/geocoder')
/**
 *   description    Get all bootcamps
 *   route          GET /bootcamps
 *   access         Public
 */
exports.getBootcamps = asyncHandeler(async (req, res, next) => {
    /**
     *      can search by averageCost[gt] | averageCost[gte] | averageCost[lt] | averageCost[lte] 
     *      can filter by location.city | location.state 
     *      can search by careers[in]
     *      can filter by housing | jobAssistance | jobGuarantee =true
     * 
     *      can select specific fields to view. ex:  select=name,description, housing
     * 
     *      can sort by name, createdAt, averageCost
     *          ex:  sort=name | sort=-name | sort=-housing | sort=averageCost 
     * 
     *      can set page and limit for each page  
     *          ex:   page=x&limit=y
     *  
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
    queryStr = queryStr
        .replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => {
            return `$${match}`
        })

    query = Bootcamp.find(JSON.parse(queryStr)).populate({path: 'courses', select: ['title', 'description','tuition'] })
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
    const total = await Bootcamp.countDocuments()


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
    const bootcamps = await query

    res.status(200)
        .json({
            success: true,
            pagination,
            count: bootcamps.length,
            data: bootcamps
        })
})

/**
 *   description    Get a sngle bootcamps
 *   route          GET /bootcamps/:id
 *   access         Public
 */
exports.getBootcamp = asyncHandeler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)
    await bootcamp.populate('courses').execPopulate()

    if (!bootcamp) {
        return next(new errorResponse(`Bootcamp not found with id equal to ${req.params.id}`, 404)) 
    }
    res.status(200)
        .json({
            success: true,
            data: bootcamp
        })
})

/**
 *   description    Create new bootcamp
 *   route          POST /bootcamps
 *   access         Private
 */
exports.createBootcamp = asyncHandeler(async (req, res, next) => {
    
    req.body.user = req.user._id
    const publishedBootcamp = await Bootcamp.findOne({ user: req.user._id })
    if(publishedBootcamp && req.user.role!=='admin') {
        return next(new errorResponse(`Publisher role can add only one bootcamp!`, 400))
    }

    const bootcamp = new Bootcamp(req.body)
    await bootcamp.save()
    res
        .status(200)
        .json({
            success: true,
            data: bootcamp
        })
})

/**
 *   description    Update a single bootcamp
 *   route          DELETE /bootcamps/:id
 *   access         Private
 */
exports.updateBootcamp = asyncHandeler(async (req, res, next) => {
    
    let bootcamp = await Bootcamp.findById(req.params.id)

    /// if no bootcamp
    if(!bootcamp){
        return next(new errorResponse(`Bootcamp not found with id equal to ${req.params.id}`, 404)) 
    }
    /// bootcamp not belongs to user and user is not an admin >> he is not able to modify the bootcamp
    if( req.user.role !== 'admin' && req.user._id != bootcamp.user.toString()  ) {
        return next(new errorResponse(`user not authorized to update this bootcamp`, 401)) 
     }

    bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })


    res.status(200).json({
        success: true,
        data: bootcamp
    })
})

/**
 *   description    Delete a single bootcamps
 *   route          DELETE /bootcamps/:id
 *   access         Private
 */
exports.deleteBootcamp = asyncHandeler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)
    if (!bootcamp) {
        return next(new errorResponse(`Bootcamp not found with id equal to ${req.params.id}`, 404)) 
    }
    /// bootcamp not belongs to user and user is not an admin >> he is not able to modify the bootcamp
    if( req.user.role !== 'admin' && req.user._id != bootcamp.user.toString()  ) {
        return next(new errorResponse(`user not authorized to delete this bootcamp`, 401)) 
    }

    await bootcamp.remove()
    res.status(200).json({
        success: true,
        data: bootcamp
    })
})


/**
 *   description    Get bootcamps by distance
 *   route          GET /bootcamps/raduis/:zipcode/:distance
 *   access         Private
 */
exports.getBootcampByDistance = asyncHandeler(async (req, res, next) => {
    const {
        distance,
        zipcode,
    } = req.params

    // get longitude, latitude from geocoder
    const location = await geocoder.geocode(zipcode)
    const latitude = location[0].latitude
    const longitude = location[0].longitude

    // calculate raduis
    const raduis = distance / 3963

    /// find witnin raduis
    const bootcamps = await Bootcamp.find({
        location: {
            $geoWithin: {
                $centerSphere: [
                    [latitude, longitude], raduis
                ]
            }
        }
    })

    res.json({
        success: true,
        count: bootcamps.length,
        data: bootcamps
    })
})


/**
 *   description    upload a bootcamp photo
 *   route          PATCH /bootcamps/:id/photo
 *   access         Private
 */
exports.bootcampPhotoUpload = asyncHandeler (async (req, res, next) => {

    const bootcamp = await Bootcamp.findById(req.params.id)
    if (!bootcamp) {
        return next(new errorResponse(`Bootcamp not found with id equal to ${req.params.id}`, 404)) 
    }
    /// bootcamp not belongs to user and user is not an admin >> he is not able to modify the bootcamp
    if( req.user.role !== 'admin' && req.user._id != bootcamp.user.toString()  ) {
        return next(new errorResponse(`user not authorized to update this bootcamp`, 401)) 
    }
    /// check the file if its uploaded, if it's an image    
    const photo = req.files.photo
    if(!req.files ||  !photo.mimetype.startsWith('image') ){
        return next(new errorResponse(`Please upload a photo`, 400)) 
    } 

    /// check the file size
    if(photo.size > process.env.MAX_FILE_SIZE){
        return next(new errorResponse(`Please upload a photo with max size of ${process.env.MAX_FILE_SIZE/ (1024*1024)} mega bytes`, 400))
    }
    /// create a custom file name >> so as files don't overwrite itself
    photo.name = `bootcamp_photo_${bootcamp._id}`+path.extname(photo.name)
  
    photo.mv(`${process.env.FILE_UPLOAD_PATH}/${photo.name}`, async(error)=>{
        if(error){
            return next(new errorResponse(`Problem saving the file`, 500))     
       }
       await Bootcamp.findByIdAndUpdate(req.params.id, {  photo: photo.name  })
       res.json({
           success: true,
           data: photo.name
       })
     })


    res.send(photo.name)
})
