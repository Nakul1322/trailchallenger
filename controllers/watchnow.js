const HttpStatus = require("http-status");
const errors = require("../errors");
const User = require("../models/user");
const MyHike = require("../models/myhikes");

//ADD FAVORITE
const addFavorite = async (req, res) => {
  const { userId, hikeId } = req.params;
  try {
    console.log("userId", userId, hikeId);
    const user = await User.findById(userId);
    console.log(user);
    user.favorites.push(hikeId);
    await user.save();
    return res.send({
      message: req.t('"Record added to favorites"'),
      data: user,
      status: 200,
      success: true,
    });
  } catch (err) {
    res.status(500).json({ error: "Could not add record to favorites" });
  }
};

//DELETE FAVORITE
const deleteFavorite = async (req, res, next) => {
  const { userId, hikeId } = req.params;
  try {
    const user = await User.findById(userId);
    user.favorites.pull(hikeId);
    await user.save();
    return res.send({
      message: req.t("Record removed from favorites"),
      data: {},
      status: 200,
      success: true,
    });
  } catch (err) {
    res.status(500).json({ error: "Could not remove record from favorites" });
  }
};

//GET ALL FAVORITES
const getAllUserFavorite = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).populate("favorites");
    return res.send({
      message: req.t("All Favorite Record list"),
      data: user.favorites,
      status: 200,
      success: true,
    });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch user favorites" });
  }
};

//********************************************************** WATCH NOW ************************************************************************//

//GET ALL FAVORITES
const getAllWatchNow = async (req, res) => {
  try {
    let { page, pageSize } = req.query;
    page = page || 0;
    pageSize = pageSize || 10;
    let skip = Number(page * pageSize);
    console.log(page, pageSize, skip);
    const watchNow = await MyHike.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "challenges",
          localField: "trailId",
          foreignField: "_id",
          as: "challenge",
        },
      },
      {
        $unwind: { path: "$challenge", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          challengeName: "$challenge.title",
          challengeImage: "$challenge.image",
          UserName: "$user.name",
          UserImage: "$user.photo",
          currentDistance: 1,
          completionPercentage: {
            $cond: {
              if: "$isCompleted",
              then: 100,
              else: "$completionPercentage",
            },
          },
          hikingTime: "$duration",
          isOnline: "false",
          isFavourite: "false",
          isRequestSend: "false",
        },
      },
    ])
      .skip(skip)
      .limit(Number(pageSize))
      .exec();
    const totalCount = await MyHike.countDocuments().exec();
    return res.send({
      message: req.t("All Watch Now Record list"),
      data: { watchNow, totalCount },
      status: 200,
      success: true,
    });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch user favorites" });
  }
};

module.exports = {
  addFavorite,
  deleteFavorite,
  getAllUserFavorite,
  getAllWatchNow,
};
