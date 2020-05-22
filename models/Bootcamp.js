const mongooose = require('mongoose')
const validator = require('validator')
const slugify = require('slugify')
const geocoder = require('../utiles/geocoder')
const Course = require('./Course')

const bootcampSchema = mongooose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
        unique: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    slug: String, /// URL friendly version of name
    description: {
        type: String,
        required: [true, 'Please add a description.'],
        maxlength: [1000, 'description can not be more than 1000 characters']
    },
    website: {
        type: String,
        trim: true,
        unique: true,
        validate(website) {
            if (!validator.isURL(website)) {
                throw new Error('please use a valid URL')
            }
        }
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number'],
        maxlength: [20, 'Phone number can not be more than 20 characters']
    },
    email: {
        type: String,
        validate(email) {
            if (!validator.isEmail(email)) {
                throw new Error('Please use a valid email adress')
            }
        }
    },
    address: {
        type: String,
        required: [true, 'Please provide an adress']
    },
    location: {
        type: {
            type: String, // Don't do `{ location: { type: String } }`
            enum: ['Point'], // 'location.type' must be 'Point'
        },
        coordinates: {
            type: [Number],
            index: '2dsphere'
        },
        formattedAddress: String,
        street: String,
        city: String,
        state: String,
        zipcode: String,
        country: String,
    },
    careers: {
        type: [String],
        required: true,
        enum: ['Web Development', 'Mobile Development', 'UI/UX', 'Data Science', 'Business', 'Others']
    },
    averageRating: {
        type: Number,
        min: [1, 'rating must be more than or equal 1'],
        max: [10, 'rating must be less than or equal 10']
    },
    avergeCost: {
        type: Number,
    },
    photo: {
        type: String,
        default: 'no-photo.jpg'
    },
    housing: {
        type: Boolean,
        default: false
    },
    jobAssistance: {
        type: Boolean,
        default: false
    },
    jobGuarantee: {
        type: Boolean,
        default: false
    },
    acceptGi: {
        type: Boolean,
        default: false
    },
    averageCost: {
        type: Number,
        default:0
    },
    user: {
        type: mongooose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true,
    id: false
})

bootcampSchema.set('toObject', { virtuals: true })
bootcampSchema.set('toJSON', { virtuals: true })

/// set up a virtual relation with courses
bootcampSchema.virtual('courses', {
    ref: 'Course',
    localField: '_id',
    foreignField: 'bootcamp',
})

/// delete any courses associated with deleted bootcamp
bootcampSchema.pre('remove', async function(next){
    await Course.deleteMany({bootcamp:this._id })
    next()
})




/// create a shareble link from name
bootcampSchema.pre('save', function (next) {
    const bootCamp = this
    bootCamp.slug = slugify(bootCamp.name, {
        lower: true
    })
    next()
})



/// find location with geocoding
bootcampSchema.pre('save', async function (next) {
    const bootCamp = this
    const location = await geocoder.geocode(bootCamp.address)

    bootCamp.location = {
        type: 'Point',
        coordinates: [location[0].latitude, location[0].longitude],
        formattedAddress: location[0].formattedAddress,
        country: null,
        city: location[0].city,
        state: location[0].stateCode,
        zipcode: location[0].zipcode,
        street: location[0].streetName,
        country: location[0].countryCode,
    }

    bootCamp.address = undefined
    bootCamp.id = undefined
    next()
})



module.exports = mongooose.model('Bootcamp', bootcampSchema)