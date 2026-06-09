const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be atleast 3 characters"],
      maxlength: [20, "Username cannot exceed 20 characters"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be atleast 6 characters"],
    },
  },
  { timestamps: true }
);

UserSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});


module.exports = mongoose.model("User", UserSchema);
