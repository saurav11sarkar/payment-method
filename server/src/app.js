const express = require("express");
const cors = require("cors");
const config = require("./config");
const SSLCommerzPayment = require("sslcommerz-lts");
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const app = express();

app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// MongoDB Order Schema and Model
const orderSchema = new mongoose.Schema({
  name: String,
  email: String,
  address: String,
  phone: String,
  amount: Number,
  currency: String,
  paidStatus: { type: Boolean, default: false },
  tranjectionId: String,
});

const Order = mongoose.model("Order", orderSchema);

// Root
app.get("/", (req, res) => {
  res.send("Hello World");
});

// SSLCommerz credentials
const store_id = config.STORE_ID;
const store_passwd = config.STORE_PASSWORD;
const is_live = false;

// Create Order Endpoint
app.post("/order", async (req, res, next) => {
  try {
    const tran_id = new ObjectId().toString();

    const data = {
      total_amount: parseFloat(req.body.amount),
      currency: req.body.currency,
      tran_id: tran_id,
      success_url: `http://localhost:5000/payment/success/${tran_id}`,
      fail_url: `http://localhost:5000/payment/fail/${tran_id}`,
      cancel_url: "http://localhost:3030/cancel",
      ipn_url: "http://localhost:3030/ipn",
      shipping_method: "Courier",
      product_name: "Computer",
      product_category: "Electronic",
      product_profile: "general",
      cus_name: req.body.name,
      cus_email: req.body.email,
      cus_add1: req.body.address,
      cus_add2: "Dhaka",
      cus_city: "Dhaka",
      cus_state: "Dhaka",
      cus_postcode: "1000",
      cus_country: "Bangladesh",
      cus_phone: req.body.phone,
      cus_fax: "01711111111",
      ship_name: req.body.name,
      ship_add1: "Dhaka",
      ship_add2: "Dhaka",
      ship_city: "Dhaka",
      ship_state: "Dhaka",
      ship_postcode: 1000,
      ship_country: "Bangladesh",
    };

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const apiResponse = await sslcz.init(data);
    const GatewayPageURL = apiResponse.GatewayPageURL;

    if (GatewayPageURL) {
      // Save the order with paidStatus: false
      const newOrder = new Order({
        ...req.body,
        paidStatus: false,
        tranjectionId: tran_id,
      });
      await newOrder.save();

      console.log("Redirecting to:", GatewayPageURL);
      res.status(200).json({ url: GatewayPageURL });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Failed to initiate payment." });
    }
  } catch (error) {
    next(error);
  }
});

// Success Callback
app.post("/payment/success/:tranId", async (req, res, next) => {
  const tranId = req.params.tranId;
  try {
    const result = await Order.updateOne(
      { tranjectionId: tranId },
      { $set: { paidStatus: true } }
    );

    if (result.modifiedCount > 0) {
      res.redirect(`http://localhost:3000/success/${tranId}`);
    } else {
      res.status(404).send("Transaction not found.");
    }
  } catch (err) {
    next(err);
  }
});

// Faild Callback
app.post("/payment/fail/:tranId", async (req, res, next) => {
  const tranId = req.params.tranId;
  try {
    const result = await Order.deleteOne({ tranjectionId: tranId });

    if (result.deletedCount) {
      res.redirect(`http://localhost:3000/fail/${tranId}`);
    } else {
      res.status(404).send("Transaction not found.");
    }
  } catch (err) {
    next(err);
  }
});

// 404 Error Handling
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Endpoint not found" });
});

// General Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: config.NODE_ENV === "development" ? err.stack : undefined,
  });
});

module.exports = app;
