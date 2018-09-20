const mongoose = require('mongoose')
const SMS = require('../models/sms')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const authToken = process.env.TWILIO_AUTH_TOKEN
const accountSid = process.env.TWILIO_ACCOUNT_SID

const twilio = require('twilio')(accountSid, authToken)

exports.sendSms = (req, res, next) => {
    const smsMsg = {
        asin: req.body.asin,
        oldPrice: req.body.oldPrice,
        oldSeller: req.body.oldSeller,
        newPrice: req.body.newPrice,
        newSeller: req.body.newSeller,
    }

    twilio.messages.create({
//      to: process.env.MY_PHONE_NUMBER,
        to: "+" + req.body.phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: JSON.stringify({smsMsg})
    })
    .then( (message) => {
        res.setHeader({
            message: message
        })
        next()
    })
    .catch( err => {
        console.log( err )
        res.status(500).json({
            msg: "Twilio request failure.",
            error: err,
        })
    })
    .done()
}    


    // Log message to database.
exports.logSms = (req, res, next) => {
    const sms = new SMS({
        _id: new mongoose.Types.ObjectId(),
        //user: req.body.user,
        phoneNumber: req.body.phoneNumber,
        asin: req.body.asin,
        oldPrice: req.body.oldPrice,
        oldSeller: req.body.oldSeller,
        newPrice: req.body.newPrice,
        newSeller: req.body.newSeller,
        msgSentSid: res.message.sid,
    })

    sms
        .save()
        .then( result => {
            console.log( result )
            res.status(201).json({
                message: "Handle POST requests to /send",
                createdSMS: {
                    _id: result._id,
                    asin: result.name,
                    request: {
                        desc: "To list a specific sms message",
                        type: "GET",
                        url: "http://" + req.get('host') + "/sms/" + result._id,
                    }
                }
            })
        })
        .catch( err => {
            console.log( err )
            res.status(500).json({
                error: err,
            })
        })
}

exports.get_all_sms = (req, res, next) => {
    
    SMS
        .find()
        .select( "phoneNumber asin oldPrice oldSeller newPrice newSeller msgSentSid" )
        .exec()
        .then( docs => {
            const response = {
                count: docs.length,
                smsMsgs: docs.map( doc => {
                    return {
                        _id: doc._id,
                        phoneNumber: doc.phoneNumber,
                        asin: doc.asin,
                        oldSeller: doc.oldSeller,
                        oldPrice: doc.oldPrice,
                        newSeller: doc.newSeller,
                        newPrice: doc.newPrice,
                        msgSentSid: doc.msgSentSid,
                        request: {
                            desc: "To list a specific sms",
                            type: 'GET',
                            url: "http://" + req.get('host') + "/sms/" + doc._id,
                        }
                    }
                })    
            }
            res.status(200).json( response )
        })
        .catch( err => {
            console.log( err )
            res.status(500).json({ 
                error: err 
            })
        })
}