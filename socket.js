  const socketIO = require("socket.io");
const Coupon = require("./models/couponModel");
const User = require("./models/userModel");

const auctionTimers = {};
const auctionEndTimes = {};

let io; // Global variable to hold the io instance

function initializeSocket(server) {
  io = socketIO(server, {
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

        // Ownership/auction validation
        // if (
        //   !coupon.auction ||
        //   String(coupon.auctionDetails?.auction_user) !== String(coupon.userId)
        // ) {
        //   console.log(
        //     `Aborting auction for coupon ${couponId} due to invalid state.`
        //   );
        //   return;
        // }

        const minPrice = coupon.auctionDetails?.auction_price || 0;
        if (bidAmount <= minPrice) {
          socket.emit("bidError", {
            message: `Bid must be greater than ${minPrice}`,
          });
          return;
        }

        const user = await User.findById(userId);
        if (!user) {
          socket.emit("bidError", { message: "User not found" });
          return;
        }

        if (user.wallet < bidAmount + coupon.couponCard.premium) {
          socket.emit("bidError", {
            message: "Insufficient wallet balance",
          });
          return;
        }

        // Return previous user's bid
        if (
          String(coupon.auctionDetails.auction_user) !== String(coupon.userId)
        ) {
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

        // Deduct bid
        user.wallet -= bidAmount + coupon.couponCard.premium;
        user.pendingWalletAmount += bidAmount;
        await user.save();

        coupon.auctionDetails = {
          auction_user: user._id,
          auction_price: bidAmount,
          auction_date: new Date().toISOString(),
        };

        await coupon.save();

        io.emit("bidUpdate", {
          couponId,
          auctionDetails: coupon,
        });

        // Clear previous timers
        if (auctionTimers[couponId]) {
          io.emit("clearTimer");
          clearTimeout(auctionTimers[couponId].timeout);
          clearInterval(auctionTimers[couponId].interval);
          delete auctionTimers[couponId];
        }

        if (auctionEndTimes[couponId]) {
          clearTimeout(auctionEndTimes[couponId]);
        }

        auctionTimers[couponId] = {};
        auctionEndTimes[couponId] = {};

        // Delay before 3-min countdown
        auctionTimers[couponId].timeout = setTimeout(() => {
          const auctionEndTime = Date.now() + 3 * 60 * 1000;
          auctionEndTimes[couponId] = auctionEndTime;

          console.log(`3-minute auction started for coupon ${couponId}`);

          auctionTimers[couponId].interval = setInterval(() => {
            const remainingTime = Math.max(
              0,
              auctionEndTime - Date.now()
            );

            io.emit("timerUpdate", { couponId, remainingTime });

            if (remainingTime <= 0) {
              clearInterval(auctionTimers[couponId].interval);
              delete auctionTimers[couponId].interval;
              endAuction(couponId);
            }
          }, 1000);
        }, 60 * 1000); // 1-minute delay
      } catch (error) {
        console.error("Error placing bid:", error);
        socket.emit("bidError", {
          message: "An error occurred while placing the bid",
        });
      }
    });

    // timer reset when the elimination completed
    socket.on("resetTimer", () => {
      console.log("Received resetTimer event");

      // Clear all auction timers
      for (const couponId in auctionTimers) {
        if (auctionTimers[couponId].timeout) {
          clearTimeout(auctionTimers[couponId].timeout);
        }
        if (auctionTimers[couponId].interval) {
          clearInterval(auctionTimers[couponId].interval);
        }
        delete auctionTimers[couponId];
      }

      // Clear all auction end times
      for (const couponId in auctionEndTimes) {
        clearTimeout(auctionEndTimes[couponId]);
        delete auctionEndTimes[couponId];
      }

      socket.emit("clearTimer"); // Let frontend know
    });

    

    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
    });
  });

  return io;
}

async function endAuction(couponId) {
  try {
    const coupon = await Coupon.findById(couponId);
    if (!coupon || !coupon.auctionDetails.auction_user) return;

    const newOwner = coupon.auctionDetails.auction_user;
    const realOwner = coupon.userId;

    await User.updateOne(
      { _id: newOwner },
      {
        $inc: { pendingWalletAmount: -coupon.auctionDetails.auction_price },
        $push: { coupons: { couponId } },
      }
    );

    await User.updateOne(
      { _id: realOwner },
      {
        $pull: { coupons: { couponId } },
        $inc: { wallet: coupon.auctionDetails.auction_price },
      }
    );

    coupon.userId = newOwner;
    coupon.auction = false;
    coupon.auctionDetails = null;

    await coupon.save();

    io.emit("auctionEnded", { couponId, newOwner });
    console.log(`Auction ended for coupon ${couponId}`);
  } catch (error) {
    console.error("Error ending auction:", error);
  }
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

module.exports = {
  initializeSocket,
  getIO,
};
