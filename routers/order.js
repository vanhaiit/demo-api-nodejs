"use strict";
const express = require('express');
var router = express.Router();
const checkAuth = require('./../utilities/checkAuth');
const orderControllers = require('./../controllers/order.controllers')

router.post("/", checkAuth, orderControllers.createOrder);

router.put("/:id", checkAuth, orderControllers.updateOrder);

router.get("/", checkAuth, orderControllers.getOrder);

router.get("/:id", checkAuth, orderControllers.getDetailOrder);

router.put("/cancled/:id", checkAuth, orderControllers.cancledOrder);

router.post("/add-auto-order/", checkAuth, orderControllers.autoCreateOrder);

module.exports = router;