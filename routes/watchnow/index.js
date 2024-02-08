const express = require("express");
const router = express.Router();
const { requestValidator } = require("../../middleware");
const schema = require("./schema");
const watchNowController = require("../../controllers/watchnow");

router.post(
  "/:userId/favorites/:hikeId",
  requestValidator(schema.getById, "params"),
  watchNowController.addFavorite
);

router.get("/:userId/favorites", watchNowController.getAllUserFavorite);

router.delete(
  "/:userId/favorites/:hikeId",
  requestValidator(schema.getById, "params"),
  watchNowController.deleteFavorite
);

router.get("/get-all-watch-now", watchNowController.getAllWatchNow);

module.exports = router;
