"use strict";
const express = require('express');
var router = express.Router();
const checkAuth = require('./../utilities/checkAuth');
const productOptionsControllers = require('./../controllers/productOptions.controllers')

router.put("/:id", checkAuth, productOptionsControllers.updateProductsOptions);

router.get("/", checkAuth, productOptionsControllers.getProductsOptions);

router.get("/get-top-ten/", checkAuth, productOptionsControllers.getTop10ProductOptions);

router.get("/:id", checkAuth, productOptionsControllers.getDetailProductsOptions);



module.exports = router;