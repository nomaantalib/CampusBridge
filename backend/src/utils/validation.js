const Joi = require('joi');
const FARE_CONFIG = require('../config/constants');


const signupSchema = Joi.object({
    name: Joi.string().required().trim(),
    email: Joi.string().email().required().lowercase(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('Requester', 'Server', 'Admin').default('Requester'),
    campusId: Joi.string().required(), // MongoDB ObjectId string
});

const loginSchema = Joi.object({
    email: Joi.string().email().required().lowercase(),
    password: Joi.string().required(),
});

const createTaskSchema = Joi.object({
    category: Joi.string().valid('Printout', 'Food', 'Stationery').required(),
    description: Joi.string().required(),
    offeredFare: Joi.number().min(1).required().custom((value, helpers) => {
        const category = helpers.state.ancestors[0].category;
        if (category === 'Printout' && value < FARE_CONFIG.PRINTOUT_MIN) {
            return helpers.message(`Minimum fare for Printout is ${FARE_CONFIG.PRINTOUT_MIN}`);
        }
        if (category === 'Food' && value < FARE_CONFIG.FOOD_MIN) {
            return helpers.message(`Minimum fare for Food is ${FARE_CONFIG.FOOD_MIN}`);
        }
        if (category === 'Stationery' && value < FARE_CONFIG.STATIONERY_MIN) {
            return helpers.message(`Minimum fare for Stationery is ${FARE_CONFIG.STATIONERY_MIN}`);
        }
        return value;
    }),
    expiresAt: Joi.date().greater('now').optional(),
});

const placeBidSchema = Joi.object({
    taskId: Joi.string().required(),
    amount: Joi.number().min(1).required(),
});

const acceptBidSchema = Joi.object({
    taskId: Joi.string().required(),
    bidId: Joi.string().required(),
});

module.exports = {
    signupSchema,
    loginSchema,
    createTaskSchema,
    placeBidSchema,
    acceptBidSchema,
};


