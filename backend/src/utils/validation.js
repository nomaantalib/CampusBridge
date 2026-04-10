const Joi = require('joi');

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

module.exports = {
    signupSchema,
    loginSchema,
};
