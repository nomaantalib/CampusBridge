const Joi = require('joi');

const FARE_CONFIG = {
    PRINTOUT_MIN: 10,
    FOOD_MIN: 30,
    STATIONERY_MIN: 20,
};

// E.164 phone number: +<country_code><number>, 8–15 digits total
const e164Phone = Joi.string()
    .pattern(/^\+[1-9]\d{6,14}$/)
    .required()
    .messages({
        'string.pattern.base': 'Phone number must be in E.164 format, e.g. +911234567890',
        'any.required': 'Phone number is required',
    });

const signupSchema = Joi.object({
    name:        Joi.string().trim().required(),
    email:       Joi.string().email().lowercase().required(),
    password:    Joi.string().min(6).required(),
    phoneNumber: e164Phone,
    collegeName: Joi.string().required(),
    role:        Joi.string().valid('User', 'Admin', 'Requester', 'Server').default('User'),
    campusId:    Joi.string().optional(),
}).unknown(true);


const loginSchema = Joi.object({
    email:    Joi.string().email().lowercase().required(),
    password: Joi.string().required(),
}).unknown(true);


const createTaskSchema = Joi.object({
    category:    Joi.string().valid('Printout', 'Food', 'Stationery').required(),
    description: Joi.string().required(),
    offeredFare: Joi.number().min(1).required().custom((value, helpers) => {
        const category = helpers.state.ancestors[0].category;
        if (category === 'Printout'   && value < FARE_CONFIG.PRINTOUT_MIN)   return helpers.message(`Minimum fare for Printout is ${FARE_CONFIG.PRINTOUT_MIN}`);
        if (category === 'Food'       && value < FARE_CONFIG.FOOD_MIN)        return helpers.message(`Minimum fare for Food is ${FARE_CONFIG.FOOD_MIN}`);
        if (category === 'Stationery' && value < FARE_CONFIG.STATIONERY_MIN) return helpers.message(`Minimum fare for Stationery is ${FARE_CONFIG.STATIONERY_MIN}`);
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
    bidId:  Joi.string().required(),
});

module.exports = {
    signupSchema,
    loginSchema,
    createTaskSchema,
    placeBidSchema,
    acceptBidSchema,
};
