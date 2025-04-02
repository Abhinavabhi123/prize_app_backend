const schedule = require("node-schedule");
const Cards = require("../models/cardModel");
const User = require("../models/userModel");
const Coupon = require("../models/couponModel");
const schedulePickWinner = require("./pickWinnerScheduler");

async function scheduleEliminations() {
  try {
    const activeCards = await Cards.find({
      isDelete: false,
      status: true,
      completed: false,
    });
    activeCards.forEach((card) => {
      card.eliminationStages.forEach((stage) => {
        const stageDate = new Date(stage.stageDate);
        if (stageDate > new Date()) {
          schedule.scheduleJob(stageDate, async function () {
            console.log(
              `Elimination Stage Triggered for ${card.name} at ${stageDate}`
            );

            // 1. Mark elimination stage as completed
            const updatedCard = await Cards.findOneAndUpdate(
              { _id: card._id, "eliminationStages._id": stage._id },
              {
                $set: {
                  "eliminationStages.$.status": true,
                  isEliminationStarted: true,
                },
              },
              { new: true }
            );
            const activeCoupons = await Coupon.find({
              couponCard: card?._id,
              status: true,
            });
            if (activeCoupons.length === 0) {
              schedulePickWinner();
              console.log("No active coupons left.");
              return;
            }
            const eliminationCount =
              activeCoupons.length > 1
                ? Math.ceil(
                    activeCoupons.length / updatedCard.eliminationStages.length
                  )
                : 0;
            // Randomly select coupons to eliminate
            const shuffledCoupons = activeCoupons.sort(
              () => Math.random() - 0.5
            );
            // 5. Ensure auctioned coupons have correct ownership before elimination
            for (const coupon of shuffledCoupons) {
              if (coupon.auction && coupon.auctionDetails?.auction_user) {
                const newOwner = coupon.auctionDetails.auction_user;
                const realOwner = coupon.userId;
                const auctionPrice = coupon.auctionDetails.auction_price;

                if (String(newOwner) !== String(realOwner)) {
                  console.log(
                    `Updating ownership of coupon ${coupon._id} from ${realOwner} to ${newOwner}`
                  );
                  // Transfer auction price from new owner to real owner
                  await User.updateOne(
                    { _id: newOwner },
                    {
                      $inc: { pendingWalletAmount: -auctionPrice },
                      $push: { coupons: { couponId: coupon._id } },
                    }
                  );
                  await User.updateOne(
                    { _id: realOwner },
                    {
                      $inc: { wallet: auctionPrice },
                      $pull: { coupons: { couponId: coupon._id } },
                    }
                  );

                  // Update ownership in coupon
                  await Coupon.updateOne(
                    { _id: coupon._id },
                    {
                      $set: {
                        userId: newOwner,
                        auction: false,
                        auctionDetails: null,
                      },
                    }
                  );
                }
              }
            }
            const couponsToEliminate = shuffledCoupons.slice(
              0,
              eliminationCount
            );
            const eliminatedCouponIds = couponsToEliminate.map(
              (coupon) => coupon._id
            );
            await Coupon.updateMany(
              { _id: { $in: eliminatedCouponIds } },
              { $set: { status: false, auction: false } }
            );
            schedulePickWinner();
            console.log(`Elimination completed for card: ${card.name}`);
          });
        }
      });
    });
  } catch (error) {
    console.error("Error scheduling eliminations:", error);
  }
}

module.exports = scheduleEliminations;
