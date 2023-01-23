const router = require('express').Router();
const User = require('../model/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { registerValidation, loginValidation } = require('../validation');



//REGISTER
router.post('/register', async (req, res) => {

    //Validation
    const { error } = registerValidation(req.body);
    if (error)
        return res.status(400).send(error.details[0].message);

    //Check if useres exists (duplicate emails)
    const emailExist = await User.findOne({ email: req.body.email })
    if (emailExist)
        return res.status(400).send('Email already exists');

    //Pass hashing
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashPassword
    });
    try {
        const savedUser = await user.save();
        res.send({user: user._id});
    } catch (err) {
        res.status(400).send(err);
    }
});

//LOGIN
router.post('/login', async (req, res) => {

    //Validation
    const { error } = loginValidation(req.body);
    if (error)
        return res.status(400).send(error.details[0].message);

    //Check if user exists
    const user = await User.findOne({ email: req.body.email })
    if (!user)
        return res.status(400).send('Email does not exists!');

    //Pass verify
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if(!validPass) return res.status(400).send('Password is incorrect!');
    
    //Create auth token
    const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);
    res.header('auth-token', token).send(token);


    //res.send('Logged in!');
    
});

module.exports = router;