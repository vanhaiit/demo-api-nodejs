"use strict";
const express = require('express');
var router = express.Router();
var customerControllers = require('./../controllers/customers.controllers');
const checkAuth = require('./../utilities/checkAuth');

router.post("/", checkAuth, customerControllers.createCustomer);

router.put("/:id", checkAuth, customerControllers.updateCustomer);

router.get("/", customerControllers.getCustomer);

router.get("/:id", checkAuth, customerControllers.getDetailCustomer);

router.delete("/:id", checkAuth, customerControllers.deleteCustomer);

router.post("/autoAddCustomer/", checkAuth, customerControllers.autoAddCustomer);

module.exports = router;