const socketIO = require("socket.io");
const Coupon = require("./models/couponModel");
const User = require("./models/userModel");

const auctionTimers = {}; // Track auction timers
const auctionEndTimes = {};

function initializeSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected: " + socket.id);
    socket.on("placeBid", async ({ couponId, userId, bidAmount }) => {
      try {
        const coupon = await Coupon.findById(couponId).populate("couponCard");
        if (!coupon) {
          socket.emit("bidError", { message: "Coupon not found" });
          return;
        }
        const minPrice = coupon.auctionDetails?.auction_price || 0;

        if (bidAmount <= minPrice) {
          socket.emit("bidError", {
            message: `Bid must be greater than ${minPrice}`,
          });
          return;
        }

        // Find the user placing the bid
        const user = await User.findById(userId);
        if (!user) {
          socket.emit("bidError", { message: "User not found" });
          return;
        }

        if (user.wallet < bidAmount + coupon.couponCard.premium) {
          socket.emit("bidError", { message: "Insufficient wallet balance" });
          return;
        }
        if (
          String(coupon.auctionDetails.auction_user) !== String(coupon.userId)
        ) {
          console.log("price return");
          await User.updateOne(
            { _id: coupon.auctionDetails.auction_user },
            {
              $inc: {
                wallet: coupon.auctionDetails.auction_price,
                pendingWalletAmount: -coupon.auctionDetails.auction_price,
              },
            }
          );
        }

        // Deduct bid amount from user wallet
        user.wallet -= bidAmount + coupon.couponCard.premium;
        user.pendingWalletAmount = bidAmount;
        await user.save();

        // Update auction details with the highest bid
        coupon.auctionDetails = {
          auction_user: user._id,
          auction_price: bidAmount,
          auction_date: new Date().toISOString(),
        };

        await coupon.save();

        // Emit updated bid data to all users
        io.emit("bidUpdate", {
          couponId,
          auctionDetails: coupon,
        });
        // Clear previous timers
        if (auctionTimers[couponId]) {
          io.emit("clearTimer");
          clearTimeout(auctionTimers[couponId]);
        }
        if (auctionEndTimes[couponId]) {
          io.emit("clearTimer");
          clearTimeout(auctionEndTimes[couponId]); // Clears the countdown timer
        }

        // Wait 1 minute before starting the 3-minute countdown
        auctionTimers[couponId] = setTimeout(() => {
          const auctionEndTime = Date.now() + 3 * 60 * 1000;
          auctionEndTimes[couponId] = auctionEndTime;

          console.log(`3-minute auction started for coupon ${couponId}`);

          // Broadcast timer updates
          const intervalId = setInterval(() => {
            const remainingTime = Math.max(
              0,
              auctionEndTimes[couponId] - Date.now()
            );
            io.emit("timerUpdate", { couponId, remainingTime });

            if (remainingTime <= 0) {
              clearInterval(intervalId);
              endAuction(couponId, io);
            }
          }, 1000);
        }, 1 * 60 * 1000); // Start countdown after 1 minute
      } catch (error) {
        console.error("Error placing bid:", error);
        socket.emit("bidError", {
          message: "An error occurred while placing the bid",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
    });
  });

  return io;
}

async function endAuction(couponId, io) {
  try {
    const coupon = await Coupon.findById(couponId);
    if (!coupon || !coupon.auctionDetails.auction_user) return;

    const newOwner = coupon.auctionDetails.auction_user;
    const realOwner = coupon.userId;

    // Update the user's pending wallet balance
    await User.updateOne(
      { _id: newOwner },
      {
        $inc: { pendingWalletAmount: -coupon.auctionDetails.auction_price },
        $push: { coupons: { couponId } },
      }
    );


    // Remove the coupon from the previous owner's list
    const response =await User.updateOne(
      { _id: realOwner },
      {
        $pull: { coupons: {couponId} }, // Remove the coupon from the user's list
        $inc: { wallet: coupon.auctionDetails.auction_price }, // Increment pendingWalletAmount
      }
    );

    console.log(response,"res")

    // Transfer ownership and end auction
    coupon.userId = newOwner;
    coupon.auction = false;
    coupon.auctionDetails = null;

    await coupon.save();

    // Emit auction end event
    io.emit("auctionEnded", { couponId, newOwner });

    console.log(`Auction ended for coupon ${couponId}. New owner: ${newOwner}`);
  } catch (error) {
    console.error("Error ending auction:", error);
  }
}

module.exports = initializeSocket;
