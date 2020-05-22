const fs = require('fs')
const colors =require('colors')
const mongoose = require('mongoose')

require('dotenv').config({
    path: './config/config.env'
})

const Bootcamp = require('./models/Bootcamp')
const Course = require('./models/Course')
const User = require('./models/User')
const Review = require('./models/Review')

require('./config/db')

const bootcamps = JSON.parse(fs.readFileSync(`${__dirname}/_data/bootcamps.json`, 'utf-8'))
const courses = JSON.parse(fs.readFileSync(`${__dirname}/_data/courses.json`, 'utf-8'))
const users = JSON.parse(fs.readFileSync(`${__dirname}/_data/users.json`, 'utf-8'))
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/_data/reviews.json`, 'utf-8'))


const importData = async () => {
    try {
        await Bootcamp.create(bootcamps)
        await Course.create(courses)
        await User.create(users)
        await Review.create(reviews)
        console.log('Data imported...'.green.inverse)
        process.exit()
    } catch (error) {
        console.log(error)
    }
}

const destroytData = async () => {
    try {
        await Bootcamp.deleteMany()
        await Course.deleteMany()
        await User.deleteMany()
        await Review.deleteMany()
        console.log('Data destroyed...'.red.inverse)

    } catch (error) {
        console.log(error)
    }
}

if (process.argv[2] === '-i') {
    importData()
} else if (process.argv[2] = 'd') {
    destroytData()
}