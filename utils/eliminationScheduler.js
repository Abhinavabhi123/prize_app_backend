const schedule = require("node-schedule");
const Cards = require("../models/cardModel");
// const User = require("./models/User"); //
const Coupon =require("../models/couponModel");
const schedulePickWinner = require("./pickWinnerScheduler");

async function scheduleEliminations() {
  try {
    const activeCards = await Cards.find({
      isDelete: false,
      status: true,
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
              console.log("No active coupons left.");
              return;
            }
            const eliminationCount = Math.ceil(
              activeCoupons.length / updatedCard.eliminationStages.length
            );
            // Randomly select coupons to eliminate
            const shuffledCoupons = activeCoupons.sort(
              () => Math.random() - 0.5
            );
            const couponsToEliminate = shuffledCoupons.slice(
              0,
              eliminationCount
            );
            const eliminatedCouponIds = couponsToEliminate.map((coupon) => coupon._id);
            await Coupon.updateMany(
              { _id: { $in: eliminatedCouponIds } },
              { $set: { status: false } }
            );
            schedulePickWinner()
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
