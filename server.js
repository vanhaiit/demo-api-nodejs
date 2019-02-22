"use strict"
const express = require('express');
const port = process.env.PORT || 1337;
const bodyparser = require('body-parser');
const app = express();
app.use(bodyparser.json({ limit: "5mb" }));
var http = require("http").Server(app);

//REQUEST
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization,Cache-Control,Pragma,Expires");
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        res.header("Cache-Control", "no-cache");
        return res.status(200).json({});
    }
    next();
});

//ROUTER
app.use("/api/v0/users", require('./routers/uses'));

app.use("/api/v0/customers", require('./routers/customers'));

app.use("/api/v0/products", require('./routers/products'));

app.use("/api/v0/product-options", require('./routers/productOptions'));

app.use("/api/v0/orders", require('./routers/order'));


app.use((req, res, next) => {
    const error = new Error("Not found");
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});

http.listen(port);
return http

