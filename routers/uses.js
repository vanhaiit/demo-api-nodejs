"use strict";
const express = require('express');
var router = express.Router();
var usersControllers = require('./../controllers/users.controllers');

router.post("/signup", usersControllers.user_signup);

router.post("/signin", usersControllers.user_signin);

module.exports = router;