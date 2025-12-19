const User = require("../models/userModel");
const Error=require("../utils/error")

exports.getNearbyUsersPublic = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude required" });
    }

    const users = await User.find({
      isDeleted: false,
      isEmailVerified: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: 30000, // 30 km
        },
      },
    })
      .select("username location")
      .limit(20);

    return res.json({ users });
  } catch (err) {
    return res.status(Error.INTERNAL_SERVER.status_code).json({ message: Error.INTERNAL_SERVER.message});
  }
};

exports.getNearbyUsersAuth = async (req, res) => {
  try {
    const distance = Number(req.query.distance) || 50000; // default 50 km

    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const users = await User.find({
      _id: { $ne: currentUser._id },
      isDeleted: false,
      isEmailVerified: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: currentUser.location.coordinates,
          },
          $maxDistance: distance,
        },
      },
    })
      .select("username location")
      .limit(20);

    return res.json({ users });
  } catch (err) {
    return res.status(Error.INTERNAL_SERVER.status_code).json({ message: Error.INTERNAL_SERVER.message});
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude == null || longitude == null) {
      return res.status(400).json({ message: "Latitude and longitude required" });
    }

    await User.findByIdAndUpdate(req.userId, {
      location: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
      },
    });

    return res.json({ message: "Location updated successfully" });
  } catch (err) {
    return res.status(Error.INTERNAL_SERVER.status_code).json({message: Error.INTERNAL_SERVER.message});
  }
};


