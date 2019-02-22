"use strict";
const express = require('express');
var router = express.Router();
const checkAuth = require('./../utilities/checkAuth');
const productsControllers = require('./../controllers/products.controllers')

router.post("/", checkAuth, productsControllers.createProducts);

router.put("/:id", checkAuth, productsControllers.updateProducts);

router.get("/", checkAuth, productsControllers.getProducts);

router.get("/:id", checkAuth, productsControllers.getDetailProducts);

router.delete("/:id", checkAuth, productsControllers.deleteProducts);


module.exports = router;