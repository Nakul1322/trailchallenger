const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tokenSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  token: {
    type: String,
    required: true,
  }
},
  {
    timestamps: true
  });

const Token = mongoose.model("token", tokenSchema);

module.exports = Token;