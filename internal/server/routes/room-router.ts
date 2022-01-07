import path from "path";
import express from "express";

var router = express.Router();

router.get("/room", function (req, res) {
  res.sendFile(path.join(__dirname, "../../../frontend/build", "index.html")); // Simply allow the request and client will display error or not
});

export default router;
